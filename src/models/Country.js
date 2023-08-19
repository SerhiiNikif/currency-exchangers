const {DataTypes} = require('sequelize');
const sequelize = require('../config/sequelizeSetup.js');

const Country = sequelize.define('country', {
    code: DataTypes.STRING,
    name: DataTypes.STRING,
}, { timestamps: false });

module.exports = Country;