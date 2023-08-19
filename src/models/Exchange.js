const {DataTypes} = require('sequelize');
const sequelize = require('../config/sequelizeSetup.js');
const ExchangeOffice = require('./ExchangeOffice.js');

const Exchange = sequelize.define('exchange', {
    from: DataTypes.STRING,
    to: DataTypes.STRING,
    ask: DataTypes.INTEGER,
    date: DataTypes.DATE,
    exchangeOfficeId: DataTypes.INTEGER
}, { timestamps: false });

Exchange.belongsTo(ExchangeOffice, { foreignKey: 'exchangeOfficeId' });

module.exports = Exchange;