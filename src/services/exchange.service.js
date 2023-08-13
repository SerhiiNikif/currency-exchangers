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
}

module.exports = new ExchangeService();