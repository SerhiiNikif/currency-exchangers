// Plugging in the dotenv library to load environment variables from an .env file.
require('dotenv').config();
const express = require('express');

const sequelizeSetup = require('./config/sequelizeSetup.js');
const router = require('./routes/exchange-route.js');
const { apiErrorHandler } = require('./middlewares/index.js');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use('/api', router);

// Using middleware to handle API errors
app.use((req, res) => res.status(404).json({ message: "Not found" }));
app.use(apiErrorHandler);

/**
 * An asynchronous function that authenticates with the database,
 * synchronization of models and starting the server on the specified port.
 */
const start = async () => {
    try {
        await sequelizeSetup.authenticate();
        await sequelizeSetup.sync();
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (error) {
        console.log(error);
    }
}

start();

module.exports = app;