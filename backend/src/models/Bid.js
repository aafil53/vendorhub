const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bid = sequelize.define('Bid', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  rfqId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  certFile: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  availability: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(
      'draft',        // Bid started but not submitted
      'submitted',    // Bid sent to buyer (decision pending)
      'revised',      // Bid resubmitted after changes
      'accepted',     // Bid won
      'rejected',     // Bid lost
      'withdrawn',    // Vendor canceled bid after submission
      'declined',     // Vendor declined RFQ (never submitted)
      'expired'       // RFQ deadline passed, bid not submitted
    ),
    allowNull: false,
    defaultValue: 'draft',
  },
  declineReason: {
    type: DataTypes.STRING,
    allowNull: true,
    // Values: 'stock_unavailable', 'lead_time_incompatible', 'pricing_not_feasible', 'compliance_mismatch', or custom text
  },
});

module.exports = Bid;