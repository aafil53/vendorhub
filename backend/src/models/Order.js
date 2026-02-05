const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  poDetails: {
    type: DataTypes.JSON, // Stores generated PO number, date, terms, etc.
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  history: {
    type: DataTypes.JSON, // Log of status changes
    defaultValue: [],
  },
  // Foreign keys are handled by associations in index.js
}, {
  timestamps: true,
});

module.exports = Order;
