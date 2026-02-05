// Import models to ensure they are registered with the sequelize instance
const sequelize = require('../config/database');

const User = require('./User');
const Equipment = require('./Equipment');
const RFQ = require('./RFQ');
const Bid = require('./Bid');
const Order = require('./Order');

// Associations
User.hasMany(RFQ, { foreignKey: 'clientId', as: 'rfqs' });
RFQ.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

Equipment.hasMany(RFQ, { foreignKey: 'equipmentId', as: 'rfqs' });
RFQ.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

User.hasMany(Bid, { foreignKey: 'vendorId', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

RFQ.hasMany(Bid, { foreignKey: 'rfqId', as: 'bids' });
Bid.belongsTo(RFQ, { foreignKey: 'rfqId', as: 'rfq' });

// Order associations
Order.belongsTo(Bid, { foreignKey: 'bidId', as: 'bid' });
Bid.hasOne(Order, { foreignKey: 'bidId', as: 'order' });

Order.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
User.hasMany(Order, { foreignKey: 'clientId', as: 'clientOrders' });

Order.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
User.hasMany(Order, { foreignKey: 'vendorId', as: 'vendorOrders' });

module.exports = {
  sequelize,
  User,
  Equipment,
  RFQ,
  Bid,
  Order,
};
