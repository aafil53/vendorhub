const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  hashedPassword: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('client', 'vendor', 'admin'),
    allowNull: false,
    defaultValue: 'vendor',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // 👇 NEW VENDOR PROFILE FIELDS
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,  // Only vendors
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  certifications: {
    type: DataTypes.JSON,  // ["ARAMCO", "Third-Party"]
    defaultValue: [],
  },
  categories: {
    type: DataTypes.JSON,  // ["Lifting", "Earthmoving"]
    defaultValue: [],
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 4.8,
  },
  ordersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  experienceYears: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = User;
