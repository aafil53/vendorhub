const express = require('express');
const router = express.Router();
const { Order, Bid, RFQ, User, Equipment } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

// POST /api/orders/create (Client only)
router.post('/create', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) return res.status(400).json({ error: 'Bid ID is required' });

    // Validate Bid
    const bid = await Bid.findByPk(bidId, {
      include: [{ model: RFQ, as: 'rfq' }]
    });

    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.rfq.clientId !== req.user.id) return res.status(403).json({ error: 'Unauthorized to create order for this bid' });

    // Check if order already exists
    const existingOrder = await Order.findOne({ where: { bidId } });
    if (existingOrder) return res.status(400).json({ error: 'Order already exists for this bid' });

    // Create Order
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

    // Update Bid Status
    await bid.update({ status: 'accepted' });
    
    // Check if RFQ should be closed (simplification: close if order created)
    await bid.rfq.update({ status: 'closed' });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/orders/history (Client & Vendor)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'client') {
      where.clientId = req.user.id;
    } else if (req.user.role === 'vendor') {
      where.vendorId = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin sees all
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const orders = await Order.findAll({
      where,
      include: [
        { 
          model: Bid, 
          as: 'bid',
          include: [
            { model: RFQ, as: 'rfq', include: [{ model: Equipment, as: 'equipment' }] }
          ]
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
