For the project to work correctly, you need to download a file in the correct format, for example:

__file.txt__
```
exchange-offices
  exchange-office
    id = 1
    name = Exchanger 1
    country = UKR
    exchanges
      exchange
        from = EUR
        to = UAH
        ask = 4000
        date = 2023-07-23 21:55:33
      exchange
        from = UAH
        to = EUR
        ask = 50
        date = 2023-07-20 20:55:33
    rates
      rate
        from = UAH
        to = EUR
        in = 0.025
        out = 0.024
        reserve = 120000
        date = 2023-07-21 19:55:33
      rate
        from = EUR
        to = UAH
        in = 38
        out = 40
        reserve = 150000
        date = 2023-07-22 18:55:33
      rate
        from = UAH
        to = USD
        in = 0.028
        out = 0.025
        reserve = 120000
        date = 2023-07-21 19:55:33
      rate
        from = EUR
        to = USD
        in = 1.2
        out = 1.1
        reserve = 150000
        date = 2023-07-22 18:55:33
  exchange-office
    id = 2
    name = Exchanger 2
    country = UKR
    rates
      rate
        from = AUD
        to = CAD
        in = 0.87
        out = 0.86
        reserve = 150000
        date = 2023-07-23 17:55:33
  countries
    country
      code = UKR
      name = Ukraine
```

## Questions

### 1. How to change the code to support different file format versions?

It is necessary to add a new file type check in the `checkFileType` helper - for all file types (except .txt) there should be its own helper (you need to create it) that parses to txt - the parseData function works only with txt files.

__checkFileType.js__
```
const ApiError = require('../exceptions/api-error.js');
const parseXmlToTxt = require('./parseXmlToTxt.js');

module.exports = function (lines, fileName) {
    another code…

    } else if (hasExtension(fileName, 'xml')) {
        if (lines[0].trim() === '<exchange-offices>') return parseXmlToTxt(lines)
        else throw ApiError.SyntaxError('The file format is incorrect') 
    } else {
        throw ApiError.SyntaxError('The file format is incorrect') 
    }
}

```
### 2. How will the import system change if in the future we need to get this data from a web API?

If the data is in the correct JSON format:

__req.body__
```
{
    "exchange-offices": [
        {
            "id": "1",
            "name": "Exchanger 1",
            "country": "UKR",
            "exchanges": [
                {
                    "from": "EUR",
                    "to": "UAH",
                    "ask": "4000",
                    "date": "2023-07-23 21:55:33"
                },
                {
                    "from": "UAH",
                    "to": "EUR",
                    "ask": "50",
                    "date": "2023-07-20 20:55:33"
                }
            ],
            "rates": [
                {
                    "from": "UAH",
                    "to": "EUR",
                    "in": "0.025",
                    "out": "0.024",
                    "reserve": "120000",
                    "date": "2023-07-21 19:55:33"
                },
		another code…
```
then you need to make a condition in the insertData controller method - if req.body exists, then skip parsing and pass req.body to the insertData service method.

__exchange-controller.js__
```
class ExchangeController {
    // Handles loading data from a file and inserting it into the database.
    async insertData(req, res, next) {
        try {
            if (req.body) {
                const insertDataService = await exchangeService.insertData(req.body)
                res.status(201).json(insertDataService)
            } else {
                if (!req.file) throw ApiError.BadRequest("No file uploaded");
                const lines = req.file.buffer.toString('utf-8');
                const parsedData = await parseData(lines, req.file.originalname);
                const insertDataService = await exchangeService.insertData(parsedData)
                res.status(201).json(insertDataService)
            }
        } catch (error) {
            next(error);
        }
    }

    another code…
```
### 3. If in the future it will be necessary to do the calculations using the national bank rate, how could this be added to the system?

It is necessary to create a connection to the national Bank and convert the getMostProfitableExchangersQuery variable into an asynchronous function:

__exchange.service.js__
```
const queries = require('./exchange-queries.js');
const axios = require('axios');

    constructor() {
        this.rateAPIData = null; // A variable for storing cached data
    }

    async calculateAndRetrieveProfit() {
        const rateAPI = await this.getRateAPIData(); // Generating queries from a separate module
        return await sequelizeSetup.query(await queries.getMostProfitableExchangersQuery(rateAPI), {
            type: sequelizeSetup.QueryTypes.SELECT
        });
    }

    async getRateAPIData() {
        if (!this.rateAPIData) {
            const response = await axios.get(process.env.API_URL);
            this.rateAPIData = response.data; // Store the data in a variable
        }
        return this.rateAPIData;
    }
```

__exchange-queries.js__
```
const createConversionQuery = (currency, conversionRate, exchangeField) => {
    return `WHEN '${currency}' THEN ${exchangeField} / ${conversionRate}`;
};

async function getMostProfitableExchangersQuery(rateAPI) {
    const oneMonthInterval = "INTERVAL '1 month'";
    const baseConversionRates = [];
    const askConversionRates = [];

    for (const currency in rateAPI.conversion_rates) {
        const conversionRate = rateAPI.conversion_rates[currency];

        baseConversionRates.push(createConversionQuery(currency, conversionRate, 'q1.basicExchange'));
        askConversionRates.push(createConversionQuery(currency, conversionRate, 'e.ask'));
    }

    const basicToUSD = `CASE q1.to ${baseConversionRates.join('\n')} END AS basicToUSD`;
    const askToUSD = `CASE e.to ${askConversionRates.join('\n')} END AS askToUSD `;

    const query = `
        another code…

        Query2 AS (
            -- Request to convert Query1 to USD
            SELECT  q1.country,
                    q1.exchangeId,
                    ${basicToUSD}
            FROM rates r
            JOIN Query1 q1 ON r.from = q1.to AND r.to = 'USD' AND r."exchangeOfficeId" = q1."exchangeOfficeId"
            WHERE r.date >= NOW() - ${oneMonthInterval}
            GROUP BY q1.country, q1.exchangeId, q1.basicExchange, q1.to -- 100 EUR -> 110 USD
        ),

        Query3 AS (
            -- Request to convert ask to USD
            SELECT  eo.id as officeId,
                    eo.name as officeName,
                    e.id as exchangeId,
                    e.to,
                    ${askToUSD}
            FROM exchange_offices eo
            JOIN exchanges e ON eo.id = e."exchangeOfficeId"
            JOIN rates r ON e."exchangeOfficeId" = r."exchangeOfficeId"
            WHERE e.date >= NOW() - ${oneMonthInterval}
                AND r.date >= NOW() - ${oneMonthInterval}
                AND r.from = e.to
                AND r.to = 'USD'
            GROUP BY eo.id, eo.name, e.id, e.ask, r.in, e.to -- 4000 UAH -> 112 USD
        ),

        another code…
    return query;
};

module.exports = {
    getMostProfitableExchangersQuery
}
```


### 4. How would it be possible to speed up the execution of requests if the task allowed you to update market data once a day or even less frequently? Please explain all possible solutions you could think of.

1. __Local Caching__: You can store the updated data in a local database or file. With each request, you check when the data was last updated, and if it was a long time ago (for example, more than a day), you make a new request to the external API, update the data, and save it for later use. This will avoid unnecessary requests to the API during the day.

2. __Scheduled Refresh Trigger__: You can configure automatic trigger of data refresh from rateAPI on a schedule (for example, once a day or once every few hours). You can use the task scheduler or the functionality of your platform to do this. Updated data can be stored in a local database for later use.
3. __Server-level caching__: If you use server-side code, you can implement server-level caching. When a client makes a request, the server checks when the data was last updated. If an update has not occurred in some time, the server makes a request to the external API, updates the data and stores it in the cache. In subsequent requests, data can be taken from the cache, which significantly speeds up the response.

> It is important to remember that when using the cache, you need to monitor the data update time to avoid using outdated or incorrect data.