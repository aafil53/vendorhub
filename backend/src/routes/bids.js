const express = require('express');
const router = express.Router();
const { Bid, RFQ, User, Equipment } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getIo } = require('../socket');                // ← NEW

// POST /api/bids/submit (vendor only)
router.post('/submit', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const { rfqId, price, certFile, availability } = req.body;
    const rfq = await RFQ.findByPk(rfqId);
    if (!rfq) return res.status(400).json({ error: 'Invalid RFQ' });
    if (rfq.status !== 'open') return res.status(400).json({ error: 'RFQ not open' });

    const bid = await Bid.create({
      rfqId, vendorId: req.user.id, price,
      certFile: certFile || null, availability: availability || null, status: 'submitted'
    });

    const io = getIo();
    if (io) {
      io.to(`user:${rfq.clientId}`).emit('bid:submitted', {
        rfqId,
        bidId: bid.id,
        vendorName: req.user.name || req.user.email,
        price: parseFloat(price),
        message: `${req.user.name || 'A vendor'} submitted a bid of $${parseFloat(price).toLocaleString()} on RFQ #${rfqId}.`,
      });
    }

    res.json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/bids/draft (vendor only) - Save bid as draft
router.post('/draft', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const { rfqId, price, certFile, availability } = req.body;
    const rfq = await RFQ.findByPk(rfqId);
    if (!rfq) return res.status(400).json({ error: 'Invalid RFQ' });
    if (rfq.status !== 'open') return res.status(400).json({ error: 'RFQ not open' });

    const vendorId = req.user.id;

    // Check if draft already exists for this RFQ+vendor
    let bid = await Bid.findOne({
      where: { rfqId, vendorId, status: 'draft' }
    });

    if (bid) {
      // Update existing draft
      bid.price = price || bid.price;
      bid.certFile = certFile || bid.certFile;
      bid.availability = availability || bid.availability;
      await bid.save();
    } else {
      // Create new draft
      bid = await Bid.create({
        rfqId, vendorId, price, certFile: certFile || null,
        availability: availability || null, status: 'draft'
      });
    }

    res.json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/bids/:id (vendor only) - Update a draft bid
router.patch('/:id', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const bid = await Bid.findByPk(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (Number(bid.vendorId) !== Number(req.user.id))
      return res.status(403).json({ error: 'Access denied' });
    if (bid.status !== 'draft')
      return res.status(400).json({ error: 'Only draft bids can be updated' });

    const { price, certFile, availability } = req.body;
    if (price !== undefined) bid.price = price;
    if (certFile !== undefined) bid.certFile = certFile;
    if (availability !== undefined) bid.availability = availability;

    await bid.save();
    res.json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/bids/:id/decline (vendor only) - Decline an RFQ with reason
router.post('/:id/decline', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const { declineReason } = req.body;
    const rfqId = req.body.rfqId; // Optional: pass RFQ ID to auto-create decline bid

    if (req.params.id === 'new' || req.params.id === 'null') {
      // Creating a new decline bid (vendor never started bidding)
      if (!rfqId) return res.status(400).json({ error: 'rfqId required for new decline' });

      const rfq = await RFQ.findByPk(rfqId);
      if (!rfq) return res.status(400).json({ error: 'Invalid RFQ' });

      const bid = await Bid.create({
        rfqId,
        vendorId: req.user.id,
        price: 0,
        status: 'declined',
        declineReason: declineReason || null
      });

      return res.json(bid);
    }

    // Updating existing bid to declined
    const bid = await Bid.findByPk(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (Number(bid.vendorId) !== Number(req.user.id))
      return res.status(403).json({ error: 'Access denied' });

    bid.status = 'declined';
    bid.declineReason = declineReason || null;
    await bid.save();

    res.json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/bids/:id/withdraw (vendor only) - Withdraw submitted bid
router.post('/:id/withdraw', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const bid = await Bid.findByPk(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (Number(bid.vendorId) !== Number(req.user.id))
      return res.status(403).json({ error: 'Access denied' });
    if (bid.status !== 'submitted')
      return res.status(400).json({ error: 'Only submitted bids can be withdrawn' });

    bid.status = 'withdrawn';
    await bid.save();

    const rfq = await RFQ.findByPk(bid.rfqId);
    const io = getIo();
    if (io && rfq) {
      io.to(`user:${rfq.clientId}`).emit('bid:withdrawn', {
        rfqId: bid.rfqId,
        bidId: bid.id,
        vendorName: req.user.name || req.user.email,
        message: `${req.user.name || 'A vendor'} withdrew their bid on RFQ #${bid.rfqId}.`,
      });
    }

    res.json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bids/rfq/:rfqId (unchanged)
router.get('/rfq/:rfqId', async (req, res) => {
  try {
    const bids = await Bid.findAll({ where: { rfqId: req.params.rfqId } });
    const result = await Promise.all(bids.map(async (b) => {
      const vendor = await User.findByPk(b.vendorId);
      return {
        id: b.id, rfqId: b.rfqId, vendorId: b.vendorId,
        vendorName: vendor?.name || vendor?.email || 'Vendor',
        price: parseFloat(b.price), certFile: b.certFile,
        availability: b.availability, status: b.status, createdAt: b.createdAt,
      };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bids/admin (unchanged)
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
      id: b.id, vendorName: b.vendor?.name || b.vendor?.email,
      price: b.price, certFile: b.certFile, availability: b.availability,
      equipmentName: b.rfq?.equipment?.name || 'Unknown',
      status: b.status, createdAt: b.createdAt
    }));
    res.json(formattedBids);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/bids/:id/approve (unchanged)
router.post('/:id/approve', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const bid = await Bid.findByPk(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    bid.status = 'accepted';
    await bid.save();
    const rfq = await RFQ.findByPk(bid.rfqId);
    if (rfq) { rfq.status = 'awarded'; await rfq.save(); }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;