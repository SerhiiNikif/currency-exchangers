const ApiError = require('../exceptions/api-error.js');
/**
 * Parses data strings and converts them into a structured data object.
 * @param {string} lines - A text file containing the data to be parsed.
 * @returns {Object} - A structured data object with information about exchange points and countries.
 */
module.exports = async function (lines) {
    lines = lines.split('\n');
    if (lines[0].trim() !== 'exchange-offices') throw ApiError.SyntaxError('The file format is incorrect') 
    
    // An object in which structured information about exchange points and countries will be stored.
    const parsedData = { 'exchange-offices': [], countries: [] };
    let currentExchangeOffice = null;
    let currentCountry = null;
    let currentExchangesArray = null;
    let currentRatesArray = null;

    // Loop through each row of data to parse and create a structured object.
    lines.forEach((line) => {
        const parts = line.trim().split('=');
        const key = parts[0].trim();
        const value = parts[1]?.trim();

        switch (key) {
            case 'exchange-offices':
                currentExchangeOffice = null;
                break;
            case 'exchange-office':
                // Creates a new object for the exchange point and adds it to the list of exchange points.
                currentExchangeOffice = {
                    id: parseInt(value),
                    name: null,
                    country: null
                };
                currentExchangesArray = null;
                currentRatesArray = null;
                parsedData['exchange-offices'].push(currentExchangeOffice);
                break;
            case 'exchanges':
                currentRatesArray = null;
                currentExchangesArray = [];
                currentExchangeOffice.exchanges = currentExchangesArray;
                break;
            case 'exchange':
                // Adds a new exchange entry to the list of exchanges for the current exchange point.
                currentExchangesArray.push({ from: value });
                break;
            case 'rates':
                currentExchangesArray = null;
                currentRatesArray = [];
                currentExchangeOffice.rates = currentRatesArray;
                break;
            case 'rate':
                currentRatesArray.push({ from: value });
                break;
            case 'countries':
                currentExchangesArray = null;
                currentRatesArray = null;
                currentCountry = [];
                break;
            case 'country':
                if (currentCountry) {
                    currentCountry = {
                        code: null,
                        name: null
                    };
                    parsedData['countries'].push(currentCountry);
                    break;
                }
            default:
                if (currentExchangesArray && currentExchangesArray.length > 0 && !currentRatesArray) {
                    const lastExchange = currentExchangesArray[currentExchangesArray.length - 1];
                    lastExchange[key] = value;
                } else if (currentRatesArray && currentRatesArray.length > 0) {
                    const lastRate = currentRatesArray[currentRatesArray.length - 1];
                    lastRate[key] = value;
                } else if (currentExchangeOffice && !currentCountry) {
                    currentExchangeOffice[key] = value;
                }
                if (currentCountry) {
                    currentCountry[key] = value;
                }
                break
        }
    })
    
    return parsedData
}
