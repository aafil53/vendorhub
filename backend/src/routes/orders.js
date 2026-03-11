const express = require('express');
const router = express.Router();
const { Order, Bid, RFQ, User, Equipment } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getIo } = require('../socket');                // ← NEW

// POST /api/orders/create (client only)
router.post('/create', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) return res.status(400).json({ error: 'Bid ID is required' });

    const bid = await Bid.findByPk(bidId, { include: [{ model: RFQ, as: 'rfq' }] });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.rfq.clientId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized to create order for this bid' });

    const existingOrder = await Order.findOne({ where: { bidId } });
    if (existingOrder) return res.status(400).json({ error: 'Order already exists for this bid' });

    const order = await Order.create({
      bidId,
      clientId: req.user.id,
      vendorId: bid.vendorId,
      status: 'pending',
      poDetails: {
        poNumber: `PO-${Date.now()}`,
        generatedAt: new Date(),
        price: bid.price,
      },
      history: [{ status: 'pending', date: new Date(), note: 'PO Created' }]
    });

    await bid.update({ status: 'accepted' });
    await bid.rfq.update({ status: 'closed' });

    // ← NEW: notify vendor their bid was awarded (PO created)
    const io = getIo();
    if (io) {
      const clientName = req.user.name || req.user.email || 'A client';
      io.to(`user:${bid.vendorId}`).emit('order:created', {
        orderId: order.id,
        poNumber: order.poDetails.poNumber,
        price: parseFloat(bid.price),
        message: `🎉 ${clientName} awarded you PO ${order.poDetails.poNumber} — $${parseFloat(bid.price).toLocaleString()}!`,
      });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/orders/history (unchanged)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'client') where.clientId = req.user.id;
    else if (req.user.role === 'vendor') where.vendorId = req.user.id;
    else if (req.user.role === 'admin') { /* admin sees all */ }
    else return res.status(403).json({ error: 'Unauthorized' });

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Bid, as: 'bid',
          include: [{ model: RFQ, as: 'rfq', include: [{ model: Equipment, as: 'equipment' }] }]
        },
        { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'vendor', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
