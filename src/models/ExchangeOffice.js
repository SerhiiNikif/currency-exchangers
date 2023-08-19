const {DataTypes} = require('sequelize');
const sequelize = require('../config/sequelizeSetup.js');

const ExchangeOffice = sequelize.define('exchange_office', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: DataTypes.STRING,
    country: DataTypes.STRING
}, { timestamps: false });

module.exports = ExchangeOffice;

