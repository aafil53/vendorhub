const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RFQ = sequelize.define('RFQ', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  equipmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vendors: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('open','closed','awarded','cancelled'),
    allowNull: false,
    defaultValue: 'open',
  },
});

module.exports = RFQ;