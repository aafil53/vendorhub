const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'new_rfq',
      'bid_accepted',
      'bid_rejected',
      'order_update',
      'order_completed',   // used by orders.js PATCH /complete
      'rfq_expired'        // used by rfqAutoClose cron
    ),
    allowNull: false,
    defaultValue: 'new_rfq',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rfqId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Notification;
