const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer();

const exchangeController = require('../controllers/exchange-controller');
const { ctrlWrapper } = require('../middlewares/index.js');

// Downloads a data file and inserts it into the database.
router.post('/insert-data', upload.single('dataFile'), ctrlWrapper(exchangeController.insertData));
// Gets one exchanger with the highest profit from each country
router.get('/profitable-exchanges', ctrlWrapper(exchangeController.getExchangersWithHighestProfit));

module.exports = router;
