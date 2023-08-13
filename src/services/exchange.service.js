const sequelize = require('sequelize');
const sequelizeSetup = require('../config/sequelizeSetup.js');
const { ExchangeOffice, Exchange, Rate, Country } = require('../models');

/**
 * The ExchangeService class provides methods for working with data about exchange points and countries.
 * Includes functionality to insert data, calculate profit and get the most profitable exchangers.
 */
class ExchangeService {
    /**
     * Inserts exchange points, exchanges and countries into the database as part of a transaction.
     * @param {Object} data - A structured object with information to insert.
     * @returns {Promise<void>} A promise that indicates the completion of an operation.
     */
    async insertData(data) {
        await sequelizeSetup.transaction(async t => {
            data['exchange-offices'].forEach(async office => {
                const exchangeRateData = [];
                const savedOffice = await ExchangeOffice.create({
                    name: office.name,
                    country: office.country,
                });
    
                if (office.exchanges) {
                    const exchangePromises = office.exchanges?.map(async exchange => {
                        await Exchange.create({
                            exchangeOfficeId: savedOffice.id,
                            from: exchange.from,
                            to: exchange.to,
                            ask: Number(exchange.ask),
                            date: new Date(exchange.date),
                        });
                    });
                    exchangeRateData.push(...exchangePromises)
                }

                if (office.rates) {
                    const ratePromises = office.rates.map(async rate => {
                        await Rate.create({
                            exchangeOfficeId: savedOffice.id,
                            from: rate.from,
                            to: rate.to,
                            in: parseFloat(rate.in),
                            out: parseFloat(rate.out),
                            reserve: Number(rate.reserve),
                            date: new Date(rate.date),
                        });
                    });
                    exchangeRateData.push(...ratePromises)
                }

                await Promise.all(exchangeRateData);
            });

            if (data.countries) {
                const countryPromises = data.countries.map(async country => {
                    await Country.create({
                        code: country.code,
                        name: country.name,
                    });
                });
    
                await Promise.all(countryPromises);
            }
        });
        return {message: 'Data successfully inserted'}
    }

    /**
     * Calculates the profit for exchange points for the last month and returns the most profitable exchangers.
     * @returns {Promise<Object[]>} Promis, which contains an array of the most profitable exchangers for each country.
     */
    async calculateAndRetrieveProfit() {
        const today = new Date();
        const lastMonthStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        const [exchangeOffices, exchanges, rates, countries] = await Promise.all([
            ExchangeOffice.findAll(),
            Exchange.findAll({ where: { date: { [sequelize.Op.gte]: lastMonthStartDate } } }),
            Rate.findAll({ where: { date: { [sequelize.Op.gte]: lastMonthStartDate } } }),
            Country.findAll()
        ]);

        const profitForEachExchanger = this.getProfitForEachExchanger(exchangeOffices, exchanges, rates);

        const officeInEachCountry = countries.map(country => 
            profitForEachExchanger.filter(exchange => exchange.country === country.code)
        );

        const result = officeInEachCountry.map(e => 
            e.reduce((maxElement, currentElement) => 
                currentElement.profit > maxElement.profit ? currentElement : maxElement
            )
        );

        return result.sort((a, b) => b.profit - a.profit)
    }

    /**
     * Calculates profit for each exchange point taking into account exchanges and rates.
     * @param {Object[]} exchangeOffices - An array of objects of exchange points.
     * @param {Object[]} exchanges - An array of exchange objects.
     * @param {Object[]} rates - An array of rate objects.
     * @returns {Object[]} Array with profit data for each exchange point.
     */
    getProfitForEachExchanger(exchangeOffices, exchanges, rates) {
        return exchangeOffices.map(ofice => {
            let profit = 0;
            const officeExchanges = exchanges.filter(e => e.exchangeOfficeId === ofice.id);

            officeExchanges.forEach(exchange => {
                const rateOffice = rates.filter(rate => exchange.exchangeOfficeId === rate.exchangeOfficeId);
                const { ask, from, to } = exchange;
            
                const exchangeRate = this.getRate(rateOffice, from, to);
                const exchangeResult = exchangeRate && ask / exchangeRate.out;
            
                const rateUSD = this.getRate(rateOffice, from, 'USD');
                const convertToUSD = from === 'USD' ? exchangeResult : rateUSD && exchangeResult * rateUSD.out;
                
                profit += this.addConversionFee(convertToUSD);
            });
        
            return {
                id: ofice.dataValues.id,
                name: ofice.dataValues.name,
                country: ofice.dataValues.country,
                profit
            }
        });
    }

    /**
     * Finds the exchange rate for the specified currencies from the list of rates.
     * @param {Object[]} rates - An array of rate objects.
     * @param {string} from - The currency from which the exchange is made.
     * @param {string} to - The currency in which the exchange is made.
     * @returns {Object|undefined} The rate object or undefined if the rate is not found.
     */
    getRate(rates, from, to) {
        return rates.find(r => r.from === from && r.to === to);
    }

    /**
     * Adds a conversion fee to the transferred amount.
     * @param {number} item - The amount to which the commission is added.
     * @returns {number} Amount with added commission.
     */
    addConversionFee(item) {
        return item / 100 * 2
    }    
}

module.exports = new ExchangeService();