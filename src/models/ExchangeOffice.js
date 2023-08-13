const {DataTypes} = require('sequelize');
const sequelize = require('../config/sequelizeSetup.js');
const Exchange = require('./Exchange.js');
const Rate = require('./Rate.js');

const ExchangeOffice = sequelize.define('exchange_office', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: DataTypes.STRING,
    country: DataTypes.STRING
});

ExchangeOffice.hasMany(Exchange, {
    as: 'exchanges',
    foreignKey: 'exchangeOfficeId',
});
  
ExchangeOffice.hasMany(Rate, {
    as: 'rates',
    foreignKey: 'exchangeOfficeId',
});

module.exports = ExchangeOffice;

