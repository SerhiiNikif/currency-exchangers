const ApiError = require('../exceptions/api-error.js');
const multer = require('multer');

module.exports = function (err, req, res, next) {
    console.log(err);
    if (err instanceof ApiError) {
        return res.status(err.status).json({message: err.message})
    }
    if (err instanceof multer.MulterError && err.field !== 'dataFile') {
        return res.status(400).json({ error: 'Invalid file field name. Make sure you use "dataFile".' });
    }
    return res.status(500).json({message: 'Unexpected error'})
};
