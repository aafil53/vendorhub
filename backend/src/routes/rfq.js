const express = require('express');
const router = express.Router();
const { RFQ, Equipment, User, Bid, Notification } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const { getIo } = require('../socket');

// ── helpers ───────────────────────────────────────────────────────────────────
function parseDeadline(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

// ─── POST /api/rfq/create (client only) ──────────────────────────────────────
router.post('/create', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const { equipmentId, vendorIds, quantity, deadline } = req.body;
    if (!equipmentId || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) return res.status(400).json({ error: 'Invalid equipment' });

    const deadlineDate = parseDeadline(deadline);

    const rfq = await RFQ.create({
      clientId:   req.user.id,
      equipmentId,
      vendors:    vendorIds,
      status:     'open',
      deadline:   deadlineDate,
    });

    const client = await User.findByPk(req.user.id, { attributes: ['name', 'email'] });
    const clientLabel = client?.name || client?.email || 'A client';
    const deadlineStr = deadlineDate
      ? ` Deadline: ${deadlineDate.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}.`
      : '';

    await Notification.bulkCreate(
      vendorIds.map(vendorId => ({
        userId:  vendorId,
        type:    'new_rfq',
        title:   `New RFQ: ${equipment.name}`,
        message: `${clientLabel} has sent you an RFQ for ${equipment.name}. Submit your bid now.${deadlineStr}`,
        rfqId:   rfq.id,
        read:    false,
      }))
    ).catch(e => console.error('Notification error:', e));

    const io = getIo();
    if (io) {
      vendorIds.forEach(vendorId => {
        io.to(`user:${vendorId}`).emit('notification:new', {
          type:     'new_rfq',
          title:    `New RFQ: ${equipment.name}`,
          message:  `${clientLabel} sent you an RFQ for ${equipment.name}.${deadlineStr}`,
          rfqId:    rfq.id,
          deadline: deadlineDate?.toISOString() || null,
        });
      });
    }

    res.json({ ...rfq.toJSON(), equipmentName: equipment.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/rfq/create-by-category (client only) ──────────────────────────
router.post('/create-by-category', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const { category, vendorIds, specs, deadline } = req.body;
    if (!category || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: 'Missing fields: category and vendorIds required' });
    }

    let [equipment] = await Equipment.findOrCreate({
      where:    { name: category, category },
      defaults: { name: category, category, specs: specs || null, certReq: false, rentalPeriod: 30 },
    });

    const validVendors = await User.findAll({
      where:      { id: { [Op.in]: vendorIds }, role: 'vendor' },
      attributes: ['id'],
    });
    if (validVendors.length === 0)
      return res.status(400).json({ error: 'No valid vendors selected' });
    const validIds = validVendors.map(v => v.id);

    const deadlineDate = parseDeadline(deadline);

    const rfq = await RFQ.create({
      clientId:    req.user.id,
      equipmentId: equipment.id,
      vendors:     validIds,
      status:      'open',
      deadline:    deadlineDate,
    });

    const client = await User.findByPk(req.user.id, { attributes: ['name', 'email'] });
    const clientLabel = client?.name || client?.email || 'A client';
    const deadlineStr = deadlineDate
      ? ` Deadline: ${deadlineDate.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}.`
      : '';

    await Notification.bulkCreate(
      validIds.map(vendorId => ({
        userId:  vendorId,
        type:    'new_rfq',
        title:   `New RFQ: ${equipment.name}`,
        message: `${clientLabel} has sent you an RFQ for ${equipment.name}. Submit your bid now.${deadlineStr}`,
        rfqId:   rfq.id,
        read:    false,
      }))
    ).catch(e => console.error('Notification error:', e));

    const io = getIo();
    if (io) {
      validIds.forEach(vendorId => {
        io.to(`user:${vendorId}`).emit('notification:new', {
          type:     'new_rfq',
          title:    `New RFQ: ${equipment.name}`,
          message:  `${clientLabel} sent you an RFQ for ${equipment.name}.${deadlineStr}`,
          rfqId:    rfq.id,
          deadline: deadlineDate?.toISOString() || null,
        });
      });
    }

    res.json({
      ...rfq.toJSON(),
      equipmentName: equipment.name,
      message: `RFQ sent to ${validIds.length} vendor${validIds.length !== 1 ? 's' : ''}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/rfq/rfqs ────────────────────────────────────────────────────────
router.get('/rfqs', authMiddleware, async (req, res) => {
  try {
    const status = req.query.status;
    const where  = {};
    if (status) where.status = status;

    if (req.user.role === 'client')      where.clientId = req.user.id;
    else if (req.user.role === 'vendor') where.status   = 'open';

    const rfqs = await RFQ.findAll({ where, order: [['createdAt', 'DESC']] });

    let visibleRfqs = rfqs;
    if (req.user.role === 'vendor') {
      visibleRfqs = rfqs.filter(r => {
        let vList = r.vendors;
        if (typeof vList === 'string') { try { vList = JSON.parse(vList); } catch { vList = []; } }
        return Array.isArray(vList) && vList.map(String).includes(String(req.user.id));
      });
    }

    const result = await Promise.all(visibleRfqs.map(async r => {
      const equipment = await Equipment.findByPk(r.equipmentId);
      const client    = await User.findByPk(r.clientId);
      const bidsRaw   = await Bid.findAll({ where: { rfqId: r.id } });
      const bids = await Promise.all(bidsRaw.map(async b => {
        const vendor = await User.findByPk(b.vendorId);
        return {
          id: b.id, rfqId: b.rfqId, vendorId: b.vendorId,
          vendorName: vendor?.name || vendor?.email || 'Vendor',
          price: parseFloat(b.price), certFile: b.certFile,
          availability: b.availability, status: b.status, createdAt: b.createdAt,
        };
      }));
      return {
        id: r.id, equipmentId: r.equipmentId,
        equipmentName: equipment?.name || 'Unknown',
        clientName:    client?.name || client?.email || 'Client',
        vendors: r.vendors, bids, status: r.status,
        deadline: r.deadline, createdAt: r.createdAt,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/rfq/vendor-rfqs ─────────────────────────────────────────────────
router.get('/vendor-rfqs', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const allRfqs  = await RFQ.findAll({ where: { status: 'open' }, order: [['createdAt', 'DESC']] });
    const vendorId = req.user.id;

    const myRfqs = allRfqs.filter(r => {
      let vList = r.vendors;
      if (typeof vList === 'string') { try { vList = JSON.parse(vList); } catch { vList = []; } }
      return Array.isArray(vList) && vList.map(Number).includes(Number(vendorId));
    });

    const result = await Promise.all(myRfqs.map(async r => {
      const equipment   = await Equipment.findByPk(r.equipmentId);
      const client      = await User.findByPk(r.clientId, { attributes: ['name', 'email'] });
      const existingBid = await Bid.findOne({ where: { rfqId: r.id, vendorId } });

      let parsedAcceptedVendors = r.acceptedVendors;
      if (typeof parsedAcceptedVendors === 'string') {
        try { parsedAcceptedVendors = JSON.parse(parsedAcceptedVendors); } catch { parsedAcceptedVendors = []; }
      }
      if (!Array.isArray(parsedAcceptedVendors)) parsedAcceptedVendors = [];

      return {
        id: r.id, equipmentId: r.equipmentId,
        equipmentName: equipment?.name || 'Unknown',
        clientName:    client?.name || client?.email || 'Client',
        status: r.status, createdAt: r.createdAt,
        deadline: r.deadline,              // ← include deadline for countdown
        acceptedVendors: parsedAcceptedVendors,
        myBid: existingBid ? {
          id: existingBid.id, price: parseFloat(existingBid.price),
          availability: existingBid.availability, status: existingBid.status,
        } : null,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/rfq/:id ─────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await RFQ.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });

    if (req.user.role === 'client' && r.clientId !== req.user.id)
      return res.status(403).json({ error: 'Access denied: You do not own this RFQ' });

    if (req.user.role === 'vendor') {
      let vList = r.vendors;
      if (typeof vList === 'string') { try { vList = JSON.parse(vList); } catch { vList = []; } }
      if (!Array.isArray(vList) || !vList.map(String).includes(String(req.user.id)))
        return res.status(403).json({ error: 'Access denied: You are not invited to this RFQ' });
    }

    const equipment = await Equipment.findByPk(r.equipmentId);
    const client    = await User.findByPk(r.clientId, { attributes: ['name', 'email', 'companyName'] });
    const bids      = await Bid.findAll({ where: { rfqId: r.id } });
    res.json({ rfq: r, equipment, client, bids });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/rfq/:id/accept (vendor) ───────────────────────────────────────
router.post('/:id/accept', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

    // Reject if deadline has passed
    if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
      return res.status(400).json({ error: 'This RFQ has expired — deadline has passed' });
    }

    let accepted = rfq.acceptedVendors;
    if (typeof accepted === 'string') { try { accepted = JSON.parse(accepted); } catch { accepted = []; } }
    if (!Array.isArray(accepted)) accepted = [];

    const vendorId = req.user.id;
    if (!accepted.includes(vendorId)) {
      accepted.push(vendorId);
      rfq.acceptedVendors = JSON.stringify(accepted);
      await rfq.save();
    }

    const io = getIo();
    if (io) {
      io.to(`user:${rfq.clientId}`).emit('rfq:accepted', {
        rfqId: rfq.id, vendorId,
        vendorName: req.user.name,
        message: `${req.user.name} accepted your RFQ #${rfq.id}.`,
      });
    }

    res.json({ success: true, acceptedVendors: accepted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;