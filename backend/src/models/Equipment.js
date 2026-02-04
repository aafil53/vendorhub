const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  specs: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  certReq: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  rentalPeriod: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Equipment;