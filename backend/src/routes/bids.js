const express = require('express');
const router = express.Router();
const { Bid, RFQ, User, Equipment } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Create a bid (vendor only) - POST /api/bid/submit
router.post('/submit', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const { rfqId, price, certFile, availability } = req.body;
    const rfq = await RFQ.findByPk(rfqId);
    if (!rfq) return res.status(400).json({ error: 'Invalid RFQ' });
    if (rfq.status !== 'open') return res.status(400).json({ error: 'RFQ not open' });
    const bid = await Bid.create({ rfqId, vendorId: req.user.id, price, certFile: certFile || null, availability: availability || null, status: 'pending' });
    res.json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List bids for a given RFQ - GET /api/bids/rfq/:rfqId
router.get('/rfq/:rfqId', async (req, res) => {
  try {
    const bids = await Bid.findAll({ where: { rfqId: req.params.rfqId } });
    const result = await Promise.all(bids.map(async (b) => {
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
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bids/admin - List all bids for admin
router.get('/admin', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const bids = await Bid.findAll({
      include: [
        { model: RFQ, as: 'rfq', include: [{ model: Equipment, as: 'equipment' }] },
        { model: User, as: 'vendor', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedBids = bids.map(b => ({
      id: b.id,
      vendorName: b.vendor?.name || b.vendor?.email,
      price: b.price,
      certFile: b.certFile,
      availability: b.availability,
      equipmentName: b.rfq?.equipment?.name || 'Unknown',
      status: b.status,
      createdAt: b.createdAt
    }));

    res.json(formattedBids);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin approves a bid: POST /api/bids/:id/approve
router.post('/:id/approve', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const bid = await Bid.findByPk(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    bid.status = 'accepted';
    await bid.save();
    // Close RFQ
    const rfq = await RFQ.findByPk(bid.rfqId);
    if (rfq) {
      rfq.status = 'awarded';
      await rfq.save();
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;