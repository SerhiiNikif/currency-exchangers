const ApiError = require('../exceptions/api-error.js');

/**
 * Checks the file format and content of the first line for a text file with a list of exchange points.
 * @param {string} lines - Lines of file content
 * @param {string} fileName - The name of the file
 * @returns {string[]} - An array of strings of the file's contents if the format is correct
 * @throws {ApiError} - Throws a syntax error if the format is incorrect
 */
module.exports = function (lines, fileName) {
    lines = lines.split('\n');
    if (hasExtension(fileName, 'txt')) {
        if (lines[0].trim() === 'exchange-offices') return lines
        else throw ApiError.SyntaxError('The file format is incorrect') 
    } else {
        throw ApiError.SyntaxError('The file format is incorrect') 
    }
}

/**
 * Checks if the file has the specified extension.
 * @param {string} fileName - The name of the file
 * @param {string} ext - File extension (without dot)
 * @returns {boolean} - true if the extension matches, false otherwise
 */
function hasExtension(fileName, ext) {
    return fileName.toLowerCase().endsWith(`.${ext}`);
}
