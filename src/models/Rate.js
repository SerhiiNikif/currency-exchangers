const {DataTypes} = require('sequelize');
const sequelize = require('../config/sequelizeSetup.js');

const Rate = sequelize.define('rate', {
    from: DataTypes.STRING,
    to: DataTypes.STRING,
    in: DataTypes.FLOAT,
    out: DataTypes.FLOAT,
    reserve: DataTypes.INTEGER,
    date: DataTypes.DATE,
});

module.exports = Rate;