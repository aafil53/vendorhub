// backend/src/routes/orders.js  — REPLACE ENTIRE FILE
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Order, Bid, RFQ, User, Equipment, Notification } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getIo } = require('../socket');

// ─── POST /api/orders/create (client only) ────────────────────────────────────
router.post('/create', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) return res.status(400).json({ error: 'Bid ID is required' });

    const bid = await Bid.findByPk(bidId, { include: [{ model: RFQ, as: 'rfq' }] });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.rfq.clientId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized to create order for this bid' });

    // Only block if an ACTIVE (non-cancelled) order already exists
    const existingOrder = await Order.findOne({ where: { bidId } });
    if (existingOrder && existingOrder.status !== 'cancelled') {
      return res.status(400).json({ error: 'An active order already exists for this bid' });
    }

    const now = new Date();
    const poNumber = `PO-${Date.now()}`;

    const order = await Order.create({
      bidId,
      clientId: req.user.id,
      vendorId: bid.vendorId,
      status: 'pending',
      poDetails: { poNumber, generatedAt: now, price: bid.price },
      history: [{ status: 'pending', date: now, note: 'PO Created' }],
    });

    // Mark winning bid as accepted, RFQ as awarded
    await bid.update({ status: 'accepted' });
    await bid.rfq.update({ status: 'awarded' });

    // Reject all other pending bids on this RFQ
    await Bid.update(
      { status: 'rejected' },
      { where: { rfqId: bid.rfq.id, id: { [Op.ne]: bidId }, status: 'pending' } }
    );

    // Notify vendor
    const io = getIo();
    if (io) {
      const clientName = req.user.name || req.user.email || 'A client';
      io.to(`user:${bid.vendorId}`).emit('order:created', {
        orderId: order.id,
        poNumber,
        price: parseFloat(bid.price),
        message: `🎉 ${clientName} awarded you PO ${poNumber} — $${parseFloat(bid.price).toLocaleString()}!`,
      });
    }

    res.json(order);
  } catch (err) {
    console.error('[orders] create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/orders/:id/complete (client only) ────────────────────────────
router.patch('/:id/complete', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Bid, as: 'bid',
          include: [{ model: RFQ, as: 'rfq', include: [{ model: Equipment, as: 'equipment' }] }],
        },
        { model: User, as: 'vendor', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.clientId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (order.status === 'completed') return res.status(400).json({ error: 'Order is already completed' });
    if (order.status === 'cancelled') return res.status(400).json({ error: 'Cannot complete a cancelled order' });

    const history = Array.isArray(order.history) ? order.history : [];
    history.push({ status: 'completed', date: new Date(), note: 'Marked complete by client' });
    await order.update({ status: 'completed', history });

    const equipmentName = order.bid?.rfq?.equipment?.name || 'Equipment';
    const poNumber = order.poDetails?.poNumber || `PO-${order.id}`;
    const price = parseFloat(order.bid?.price || 0);

    Notification.create({
      userId: order.vendorId,
      type: 'order_completed',
      title: `Order Completed: ${equipmentName}`,
      message: `${req.user.name || req.user.email} has marked ${poNumber} as completed. Payment of $${price.toLocaleString()} is confirmed.`,
      rfqId: order.bid?.rfqId || null,
      read: false,
    }).catch(e => console.error('Notification error:', e));

    const io = getIo();
    if (io) {
      io.to(`user:${order.vendorId}`).emit('order:completed', {
        orderId: order.id, poNumber, price, equipmentName,
        message: `✅ ${poNumber} has been marked complete — $${price.toLocaleString()} confirmed!`,
      });
    }

    res.json({ ok: true, orderId: order.id, status: 'completed' });
  } catch (err) {
    console.error('[orders] complete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/orders/:id/cancel (client only) ──────────────────────────────
router.patch('/:id/cancel', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Bid, as: 'bid',
          include: [{ model: RFQ, as: 'rfq' }],
        },
      ],
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.clientId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (order.status !== 'pending')
      return res.status(400).json({ error: `Cannot cancel an order with status: ${order.status}` });

    const history = Array.isArray(order.history) ? order.history : [];
    history.push({ status: 'cancelled', date: new Date(), note: 'Cancelled by client' });
    await order.update({ status: 'cancelled', history });

    // ── Atomic chain reset ───────────────────────────────────────────────────
    // 1. Reset winning bid → pending (can be re-awarded)
    if (order.bid) {
      await order.bid.update({ status: 'pending' });
    }
    // 2. Reset RFQ → closed (bids exist, awaiting new award decision)
    if (order.bid?.rfq) {
      await order.bid.rfq.update({ status: 'closed' });
    }
    // ────────────────────────────────────────────────────────────────────────

    const io = getIo();
    if (io) {
      io.to(`user:${order.vendorId}`).emit('notification:new', {
        type: 'order_update',
        title: 'Order Cancelled',
        message: `${req.user.name || req.user.email} has cancelled the purchase order. The RFQ is back in review.`,
      });
    }

    res.json({ ok: true, orderId: order.id, status: 'cancelled' });
  } catch (err) {
    console.error('[orders] cancel error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/orders/history ──────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'client') where.clientId = req.user.id;
    else if (req.user.role === 'vendor') where.vendorId = req.user.id;
    else if (req.user.role === 'admin') { /* sees all */ }
    else return res.status(403).json({ error: 'Unauthorized' });

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Bid, as: 'bid',
          include: [{ model: RFQ, as: 'rfq', include: [{ model: Equipment, as: 'equipment' }] }],
        },
        { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'vendor', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(orders);
  } catch (err) {
    console.error('[orders] history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;