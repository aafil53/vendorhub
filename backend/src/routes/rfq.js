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

    const now = new Date();
    const activeRfqs = [];
    for (const r of myRfqs) {
      // Drop expired RFQs — they belong to Quotation history
      if (r.deadline && new Date(r.deadline) < now) continue;
      // Drop RFQs the vendor has already bid on — they belong to Quotation history
      const alreadyBid = await Bid.findOne({ where: { rfqId: r.id, vendorId } });
      if (alreadyBid) continue;
      activeRfqs.push(r);
    }

    const result = await Promise.all(activeRfqs.map(async r => {
      const equipment   = await Equipment.findByPk(r.equipmentId);
      const client      = await User.findByPk(r.clientId, { attributes: ['name', 'email'] });

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
        myBid: null,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/rfq/vendor-bids ─────────────────────────────────────────────────
// Returns the vendor's full bid history (Submitted / Won / Lost)
router.get('/vendor-bids', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const vendorId = req.user.id;
    const bids = await Bid.findAll({
      where: { vendorId },
      order: [['createdAt', 'DESC']],
    });

    const result = await Promise.all(bids.map(async (b) => {
      const rfq = await RFQ.findByPk(b.rfqId);
      const equipment = rfq ? await Equipment.findByPk(rfq.equipmentId) : null;
      const client = rfq ? await User.findByPk(rfq.clientId, { attributes: ['name', 'email', 'companyName'] }) : null;

      // Status mapping
      let status = 'submitted';
      if (b.status === 'accepted') status = 'won';
      else if (b.status === 'rejected') status = 'lost';
      else if (rfq && (rfq.status === 'awarded' || rfq.status === 'closed')) status = 'lost';

      return {
        bidId: b.id,
        quoteId: `QT-${String(b.id).padStart(4, '0')}`,
        rfqId: b.rfqId,
        rfqRef: `RFQ-${String(b.rfqId).padStart(4, '0')}`,
        equipmentName: equipment?.name || 'Unknown',
        equipmentCategory: equipment?.category || '',
        buyerName: client?.companyName || client?.name || client?.email || 'Client',
        amount: parseFloat(b.price),
        availability: b.availability || '—',
        submittedAt: b.createdAt,
        validUntil: rfq?.deadline || null,
        status,
        rfqStatus: rfq?.status || 'unknown',
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('vendor-bids error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/rfq/bids/:bidId/pdf ─────────────────────────────────────────────
// Streams a PDF quotation for the given bid (vendor-only, owner-only)
router.get('/bids/:bidId/pdf', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const bid = await Bid.findByPk(req.params.bidId);
    if (!bid) return res.status(404).json({ error: 'Quotation not found' });
    if (Number(bid.vendorId) !== Number(req.user.id))
      return res.status(403).json({ error: 'Access denied' });

    const rfq = await RFQ.findByPk(bid.rfqId);
    const equipment = rfq ? await Equipment.findByPk(rfq.equipmentId) : null;
    const client = rfq ? await User.findByPk(rfq.clientId, { attributes: ['name', 'email', 'companyName'] }) : null;
    const vendor = await User.findByPk(req.user.id, { attributes: ['name', 'email', 'companyName'] });

    const quoteId = `QT-${String(bid.id).padStart(4, '0')}`;
    const rfqRef  = `RFQ-${String(bid.rfqId).padStart(4, '0')}`;

    let status = 'Submitted';
    if (bid.status === 'accepted') status = 'Won';
    else if (bid.status === 'rejected') status = 'Lost';
    else if (rfq && (rfq.status === 'awarded' || rfq.status === 'closed')) status = 'Lost';

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Quotation-${quoteId}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header band
    doc.rect(0, 0, doc.page.width, 90).fill('#4F46E5');
    doc.fillColor('#ffffff').fontSize(22).text('QUOTATION', 50, 32, { align: 'left' });
    doc.fontSize(11).text(quoteId, 50, 60);
    doc.fontSize(10).text(`Status: ${status}`, 0, 38, { align: 'right', width: doc.page.width - 50 });
    doc.fontSize(10).text(`Issued: ${fmt(bid.createdAt)}`, 0, 56, { align: 'right', width: doc.page.width - 50 });

    doc.fillColor('#111827').moveDown(4);

    // Parties
    const yStart = 120;
    doc.fontSize(9).fillColor('#6B7280').text('FROM (VENDOR)', 50, yStart);
    doc.fontSize(11).fillColor('#111827').text(vendor?.companyName || vendor?.name || 'Vendor', 50, yStart + 14);
    doc.fontSize(9).fillColor('#6B7280').text(vendor?.email || '', 50, yStart + 30);

    doc.fontSize(9).fillColor('#6B7280').text('TO (BUYER)', 320, yStart);
    doc.fontSize(11).fillColor('#111827').text(client?.companyName || client?.name || 'Client', 320, yStart + 14);
    doc.fontSize(9).fillColor('#6B7280').text(client?.email || '', 320, yStart + 30);

    // Reference box
    const refY = yStart + 70;
    doc.roundedRect(50, refY, doc.page.width - 100, 56, 6).fillAndStroke('#F9FAFB', '#E5E7EB');
    doc.fillColor('#6B7280').fontSize(9).text('RFQ REFERENCE', 65, refY + 10);
    doc.fillColor('#111827').fontSize(12).text(rfqRef, 65, refY + 24);
    doc.fillColor('#6B7280').fontSize(9).text('VALID UNTIL', 320, refY + 10);
    doc.fillColor('#111827').fontSize(12).text(fmt(rfq?.deadline), 320, refY + 24);

    // Line item table
    const tableY = refY + 90;
    doc.fillColor('#111827').fontSize(11).text('Quotation Details', 50, tableY);
    const rowY = tableY + 24;
    doc.rect(50, rowY, doc.page.width - 100, 28).fill('#F3F4F6');
    doc.fillColor('#374151').fontSize(9)
      .text('EQUIPMENT', 60, rowY + 10)
      .text('CATEGORY', 240, rowY + 10)
      .text('AVAILABILITY', 360, rowY + 10)
      .text('AMOUNT', 470, rowY + 10, { width: 80, align: 'right' });

    const cellY = rowY + 38;
    doc.fillColor('#111827').fontSize(11)
      .text(equipment?.name || '—', 60, cellY, { width: 170 })
      .text(equipment?.category || '—', 240, cellY, { width: 110 })
      .text(bid.availability || '—', 360, cellY, { width: 100 })
      .text(`$${Number(bid.price).toLocaleString()}`, 470, cellY, { width: 80, align: 'right' });

    // Total
    const totalY = cellY + 60;
    doc.moveTo(50, totalY).lineTo(doc.page.width - 50, totalY).strokeColor('#E5E7EB').stroke();
    doc.fillColor('#6B7280').fontSize(10).text('Total Quoted Amount', 50, totalY + 14);
    doc.fillColor('#4F46E5').fontSize(18).text(`$${Number(bid.price).toLocaleString()}`, 0, totalY + 8, {
      align: 'right', width: doc.page.width - 50,
    });

    // Footer
    doc.fontSize(8).fillColor('#9CA3AF').text(
      'This quotation is system-generated and valid until the RFQ deadline above. Subject to standard terms and conditions.',
      50, doc.page.height - 70, { width: doc.page.width - 100, align: 'center' }
    );

    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' });
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