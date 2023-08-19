const {DataTypes} = require('sequelize');
const sequelize = require('../config/sequelizeSetup.js');
const ExchangeOffice = require('./ExchangeOffice.js');

const Rate = sequelize.define('rate', {
    from: DataTypes.STRING,
    to: DataTypes.STRING,
    in: DataTypes.FLOAT,
    out: DataTypes.FLOAT,
    reserve: DataTypes.INTEGER,
    date: DataTypes.DATE,
    exchangeOfficeId: DataTypes.INTEGER 
}, { timestamps: false });

Rate.belongsTo(ExchangeOffice, { foreignKey: 'exchangeOfficeId' });

module.exports = Rate;