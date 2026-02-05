const express = require('express');
const router = express.Router();
const { RFQ, Equipment, User, Bid } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

// POST /api/rfq/create (client only)
router.post('/create', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const { equipmentId, vendorIds, quantity } = req.body;
    if (!equipmentId || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) return res.status(400).json({ error: 'Invalid equipment' });
    const rfq = await RFQ.create({ clientId: req.user.id, equipmentId, vendors: vendorIds, status: 'open' });
    res.json(rfq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/rfqs?status=open
router.get('/rfqs', authMiddleware, async (req, res) => {
  try {
    const status = req.query.status;
    const where = {};
    if (status) where.status = status;

    // Filter by role
    if (req.user.role === 'client') {
      where.clientId = req.user.id;
    }
    // For vendors, usually check if they are in the target list (simplified here to show Open RFQs)
    else if (req.user.role === 'vendor') {
      where.status = 'open';
      // In a real app, check if req.user.id is in r.vendors array
    }

    const rfqs = await RFQ.findAll({ where, order: [['createdAt', 'DESC']] });

    // Post-filter for vendors if needed (JSON query in SQLite is tricky, doing in JS for safety)
    let visibleRfqs = rfqs;
    if (req.user.role === 'vendor') {
      visibleRfqs = rfqs.filter(r => {
        // If vendors list is empty/null, maybe it's public? Assuming private for now.
        // If vendors is stored as [1, 2], check inclusion.
        if (!r.vendors) return false;
        // Handle both stringified JSON or actual array depending on DB adapter
        let vList = r.vendors;
        if (typeof vList === 'string') {
          try { vList = JSON.parse(vList); } catch (e) { vList = []; }
        }
        if (Array.isArray(vList)) {
          // Check if vendor ID is in the list
          // Ensure comparison matches types (string vs number)
          return vList.map(String).includes(String(req.user.id));
        }
        return false;
      });
    }

    const result = await Promise.all(visibleRfqs.map(async (r) => {
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
          createdAt: b.createdAt,
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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/rfq/:id (detailed)
router.get('/:id', async (req, res) => {
  try {
    const r = await RFQ.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    const equipment = await Equipment.findByPk(r.equipmentId);
    const client = await User.findByPk(r.clientId);
    const bids = await Bid.findAll({ where: { rfqId: r.id } });
    res.json({ rfq: r, equipment, client, bids });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;