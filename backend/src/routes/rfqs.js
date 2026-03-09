const express = require('express');
const { RFQ, Equipment, User, Bid } = require('../models');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/rfqs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = {};
    const status = req.query.status;
    if (status) where.status = status;
    
    // Role-based filtering (Multi-tenant isolation)
    if (req.user.role === 'client') {
      where.clientId = req.user.id;
    } else if (req.user.role === 'vendor') {
      // In SQLite/Sequelize with JSON type, we might need to handle this carefully
      // If Sequelize dialect is sqlite, JSON is stored as string
      // For now, let's use a simpler approach that works across dialects or filter in JS if needed
      // But the user suggested [Op.contains] which is for Postgres.
      // For SQLite, we'll fetch and filter if necessary, or use Op.like if possible
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const rfqs = await RFQ.findAll({ 
      where, 
      order: [['createdAt', 'DESC']] 
    });

    // Post-filter for vendors if needed (SQLite JSON handling)
    let filteredRfqs = rfqs;
    if (req.user.role === 'vendor') {
      filteredRfqs = rfqs.filter(r => {
        let vList = r.vendors;
        if (typeof vList === 'string') {
          try { vList = JSON.parse(vList); } catch (e) { vList = []; }
        }
        return Array.isArray(vList) && vList.map(String).includes(String(req.user.id));
      });
    }

    const result = await Promise.all(filteredRfqs.map(async (r) => {
      const equipment = await Equipment.findByPk(r.equipmentId);
      const client = await User.findByPk(r.clientId);
      const bidsRaw = await Bid.findAll({ where: { rfqId: r.id } });
      const bids = await Promise.all(bidsRaw.map(async (b) => {
        const vendor = await User.findByPk(b.vendorId);
        return {
          id: b.id,
          rfqId: b.rfqId,
          vendorId: b.vendorId,
          vendorName: vendor?.name || vendor?.email || 'Vendor',
          price: parseFloat(b.price),
          certFile: b.certFile,
          availability: b.availability,
          status: b.status,
          submittedAt: b.createdAt,
        };
      }));

      return {
        id: r.id,
        equipmentId: r.equipmentId,
        equipmentName: equipment?.name || 'Unknown',
        clientName: client?.name || client?.email || 'Client',
        vendors: r.vendors,
        bids: bids || [],
        status: r.status,
        createdAt: r.createdAt,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Fetch RFQs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
