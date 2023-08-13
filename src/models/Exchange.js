const {DataTypes} = require('sequelize');
const sequelize = require('../config/sequelizeSetup.js');

const Exchange = sequelize.define('exchange', {
    from: DataTypes.STRING,
    to: DataTypes.STRING,
    ask: DataTypes.INTEGER,
    date: DataTypes.DATE,
});

module.exports = Exchange;