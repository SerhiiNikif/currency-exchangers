// Connecting a service that provides functionality related to currency exchange.
const exchangeService = require('../services/exchange.service.js');
// Connecting a function for parsing data from a string.
const parseData = require('../helpers/parseData.js');
// Connection class to generate API errors.
const ApiError = require('../exceptions/api-error.js');

/**
  * The ExchangeController class is responsible for processing requests related to currency exchange.
  */
class ExchangeController {
    // Handles loading data from a file and inserting it into the database.
    async insertDataFromFile(req, res, next) {
        try {
            if (!req.file) throw ApiError.BadRequest("No file uploaded");
            const lines = req.file.buffer.toString('utf-8');
            const parsedData = await parseData(lines);
            const insertDataService = await exchangeService.insertData(parsedData)
            res.status(200).json(insertDataService)
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ExchangeController();