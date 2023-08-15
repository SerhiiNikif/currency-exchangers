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
                    "to": "USD",
                    "ask": "110",
                    "date": "2023-07-23 21:55:33"
                },
                {
                    "from": "USD",
                    "to": "UAH",
                    "ask": "400",
                    "date": "2023-07-20 20:55:33"
                }
            ],
            "rates": [
                {
                    "from": "EUR",
                    "to": "USD",
                    "in": "1.1",
                    "out": "1",
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

You need to add logic to the function getProfitForEachExchanger:

__exchange.service.js__
```
class ExchangeService {
    constructor() {
        this.rateAPIData = null; // A variable for storing cached data
    }

    another code…

    async getProfitForEachExchanger(exchangeOffices, exchanges, rates) {
        const rateAPI = await this.getRateAPIData();
        another code…
            officeExchanges.forEach(exchange => {
                const { ask, to } = exchange;
                const toRate = rateAPI.conversion_rates[to];
                profit += this.addConversionFee(ask / toRate);
            });
        
            another code…
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

### 4. How would it be possible to speed up the execution of requests if the task allowed you to update market data once a day or even less frequently? Please explain all possible solutions you could think of.

1. __Local Caching__: You can store the updated data in a local database or file. With each request, you check when the data was last updated, and if it was a long time ago (for example, more than a day), you make a new request to the external API, update the data, and save it for later use. This will avoid unnecessary requests to the API during the day.

2. __Scheduled Refresh Trigger__: You can configure automatic trigger of data refresh from rateAPI on a schedule (for example, once a day or once every few hours). You can use the task scheduler or the functionality of your platform to do this. Updated data can be stored in a local database for later use.
3. __Server-level caching__: If you use server-side code, you can implement server-level caching. When a client makes a request, the server checks when the data was last updated. If an update has not occurred in some time, the server makes a request to the external API, updates the data and stores it in the cache. In subsequent requests, data can be taken from the cache, which significantly speeds up the response.

> It is important to remember that when using the cache, you need to monitor the data update time to avoid using outdated or incorrect data.