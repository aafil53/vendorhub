const express = require('express');
const { RFQ, Equipment, User, Bid, Order, Notification } = require('../models');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getIo } = require('../socket');

// ── helpers ───────────────────────────────────────────────────────────────────
async function buildRfqResult(r) {
  const equipment = await Equipment.findByPk(r.equipmentId);
  const client    = await User.findByPk(r.clientId);
  const bidsRaw   = await Bid.findAll({ where: { rfqId: r.id } });

  // Find the winning bid (accepted) and its order
  let hasOrder      = false;
  let orderId       = null;
  let orderStatus   = null;
  let orderPONumber = null;
  let winningVendor = null;
  let winningPrice  = null;

  const bids = await Promise.all(bidsRaw.map(async b => {
    const vendor = await User.findByPk(b.vendorId);
    const order  = await Order.findOne({ where: { bidId: b.id } });
    if (order) {
      hasOrder      = true;
      orderId       = order.id;
      orderStatus   = order.status;
      orderPONumber = order.poDetails?.poNumber || `PO-${order.id}`;
      winningVendor = vendor?.name || vendor?.email || 'Vendor';
      winningPrice  = parseFloat(b.price);
    }
    return {
      id: b.id, rfqId: b.rfqId, vendorId: b.vendorId,
      vendorName: vendor?.name || vendor?.email || 'Vendor',
      price: parseFloat(b.price), certFile: b.certFile,
      availability: b.availability, status: b.status, submittedAt: b.createdAt,
    };
  }));

  return {
    id: r.id, equipmentId: r.equipmentId,
    equipmentName: equipment?.name || 'Unknown',
    clientName:    client?.name || client?.email || 'Client',
    vendors:      r.vendors,
    bids:         bids || [],
    status:       r.status,
    deadline:     r.deadline,
    // PO / award details
    hasOrder,
    orderId,
    orderStatus,      // pending | completed | cancelled
    orderPONumber,    // e.g. "PO-1234567890"
    winningVendor,    // vendor name who won the bid
    winningPrice,     // their bid price
    createdAt:    r.createdAt,
    updatedAt:    r.updatedAt,
  };
}

// ─── GET /api/rfqs ────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where  = {};
    const status = req.query.status;
    if (status) where.status = status;

    if (req.user.role === 'client')      where.clientId = req.user.id;
    else if (req.user.role !== 'admin' && req.user.role !== 'vendor')
      return res.status(403).json({ error: 'Access denied' });

    const rfqs = await RFQ.findAll({ where, order: [['createdAt', 'DESC']] });

    let filteredRfqs = rfqs;
    if (req.user.role === 'vendor') {
      filteredRfqs = rfqs.filter(r => {
        let vList = r.vendors;
        if (typeof vList === 'string') { try { vList = JSON.parse(vList); } catch { vList = []; } }
        return Array.isArray(vList) && vList.map(String).includes(String(req.user.id));
      });
    }

    const result = await Promise.all(filteredRfqs.map(buildRfqResult));
    res.json(result);
  } catch (err) {
    console.error('Fetch RFQs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/rfqs/:id/cancel (client only) ────────────────────────────────
router.patch('/:id/cancel', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    if (rfq.clientId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });
    if (rfq.status === 'cancelled')
      return res.status(400).json({ error: 'RFQ is already cancelled' });
    if (rfq.status === 'awarded')
      return res.status(400).json({ error: 'Cannot cancel an awarded RFQ — a PO has already been issued' });

    await rfq.update({ status: 'cancelled' });

    const io = getIo();
    let vendorIds = rfq.vendors;
    if (typeof vendorIds === 'string') { try { vendorIds = JSON.parse(vendorIds); } catch { vendorIds = []; } }
    if (Array.isArray(vendorIds) && io) {
      const equipment = await Equipment.findByPk(rfq.equipmentId);
      const equipName = equipment?.name || `RFQ #${rfq.id}`;
      for (const vendorId of vendorIds) {
        Notification.create({
          userId: vendorId, type: 'new_rfq',
          title:   `RFQ Cancelled: ${equipName}`,
          message: `${req.user.name || req.user.email} has cancelled RFQ #${String(rfq.id).padStart(4,'0')} (${equipName}).`,
          rfqId: rfq.id, read: false,
        }).catch(() => {});
        io.to(`user:${vendorId}`).emit('notification:new', {
          type: 'rfq_cancelled', rfqId: rfq.id,
          message: `RFQ #${String(rfq.id).padStart(4,'0')} (${equipName}) has been cancelled.`,
        });
      }
    }
    res.json({ ok: true, rfqId: rfq.id, status: 'cancelled' });
  } catch (err) {
    console.error('[rfqs] cancel error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/rfqs/:id/reopen (client only) ────────────────────────────────
router.patch('/:id/reopen', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    if (rfq.clientId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });
    if (rfq.status === 'open')
      return res.status(400).json({ error: 'RFQ is already open' });
    if (rfq.status === 'awarded') {
      // Only allow reopen if the order was cancelled
      const acceptedBid = await Bid.findOne({ where: { rfqId: rfq.id, status: 'accepted' } });
      if (acceptedBid) {
        const order = await Order.findOne({ where: { bidId: acceptedBid.id } });
        if (order && order.status !== 'cancelled')
          return res.status(400).json({ error: 'Cannot reopen — the active PO must be cancelled first' });
      }
    }

    const updates = { status: 'open' };
    const deadlineCleared = rfq.deadline && new Date() > new Date(rfq.deadline);
    if (deadlineCleared) updates.deadline = null;
    await rfq.update(updates);

    const io = getIo();
    let vendorIds = rfq.vendors;
    if (typeof vendorIds === 'string') { try { vendorIds = JSON.parse(vendorIds); } catch { vendorIds = []; } }
    if (Array.isArray(vendorIds) && io) {
      const equipment = await Equipment.findByPk(rfq.equipmentId);
      const equipName = equipment?.name || `RFQ #${rfq.id}`;
      for (const vendorId of vendorIds) {
        Notification.create({
          userId: vendorId, type: 'new_rfq',
          title:   `RFQ Reopened: ${equipName}`,
          message: `${req.user.name || req.user.email} has reopened RFQ #${String(rfq.id).padStart(4,'0')} (${equipName}). You can now submit a bid.`,
          rfqId: rfq.id, read: false,
        }).catch(() => {});
        io.to(`user:${vendorId}`).emit('notification:new', {
          type: 'new_rfq', rfqId: rfq.id,
          title: `RFQ Reopened: ${equipName}`,
          message: `RFQ #${String(rfq.id).padStart(4,'0')} (${equipName}) is open again — submit your bid now.`,
        });
      }
    }
    res.json({ ok: true, rfqId: rfq.id, status: 'open', deadlineCleared: !!deadlineCleared });
  } catch (err) {
    console.error('[rfqs] reopen error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
