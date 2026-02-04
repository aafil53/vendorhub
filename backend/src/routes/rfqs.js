const express = require('express');
const { RFQ, Equipment, User, Bid } = require('../models');
const router = express.Router();

// GET /api/rfqs?status=open
router.get('/', async (req, res) => {
  try {
    const status = req.query.status;
    const where = {};
    if (status) where.status = status;
    const rfqs = await RFQ.findAll({ where, order: [['createdAt', 'DESC']] });

    const result = await Promise.all(rfqs.map(async (r) => {
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
          certification: b.certFile ? 'Provided' : 'Missing',
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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
