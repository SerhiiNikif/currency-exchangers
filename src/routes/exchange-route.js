const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer();

const exchangeController = require('../controllers/exchange-controller');
const { ctrlWrapper } = require('../middlewares/index.js');

// Downloads a data file and inserts it into the database.
router.post('/insert-data', upload.single('dataFile'), ctrlWrapper(exchangeController.insertDataFromFile));

module.exports = router;
