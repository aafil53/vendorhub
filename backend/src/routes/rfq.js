const express = require('express');
const router = express.Router();
const { RFQ, Equipment, User, Bid, Notification } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// POST /api/rfq/create (client only) - create RFQ by equipmentId
router.post('/create', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const { equipmentId, vendorIds, quantity } = req.body;
    if (!equipmentId || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) return res.status(400).json({ error: 'Invalid equipment' });
    const rfq = await RFQ.create({ clientId: req.user.id, equipmentId, vendors: vendorIds, status: 'open' });

    // Notify each selected vendor (fire-and-forget)
    const client = await User.findByPk(req.user.id, { attributes: ['name', 'email'] });
    const clientLabel = client?.name || client?.email || 'A client';
    Notification.bulkCreate(
      vendorIds.map(vendorId => ({
        userId: vendorId,
        type: 'new_rfq',
        title: `New RFQ: ${equipment.name}`,
        message: `${clientLabel} has sent you an RFQ for ${equipment.name}. Submit your bid now.`,
        rfqId: rfq.id,
        read: false,
      }))
    ).catch(e => console.error('Notification error:', e));

    res.json(rfq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// POST /api/rfq/create-by-category (client only)
// Creates RFQ from a vendor category. Finds or creates an Equipment entry for the category.
router.post('/create-by-category', authMiddleware, requireRole(['client']), async (req, res) => {
  try {
    const { category, vendorIds, specs } = req.body;
    if (!category || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: 'Missing fields: category and vendorIds required' });
    }

    // Find or create an equipment entry for this category
    let [equipment] = await Equipment.findOrCreate({
      where: { name: category, category: category },
      defaults: {
        name: category,
        category: category,
        specs: specs || null,
        certReq: false,
        rentalPeriod: 30
      }
    });

    // Verify all vendorIds actually exist and are vendors
    const validVendors = await User.findAll({
      where: { id: { [Op.in]: vendorIds }, role: 'vendor' },
      attributes: ['id']
    });
    if (validVendors.length === 0) {
      return res.status(400).json({ error: 'No valid vendors selected' });
    }
    const validIds = validVendors.map(v => v.id);

    const rfq = await RFQ.create({
      clientId: req.user.id,
      equipmentId: equipment.id,
      vendors: validIds,
      status: 'open'
    });

    // Notify each vendor (fire-and-forget)
    const client = await User.findByPk(req.user.id, { attributes: ['name', 'email'] });
    const clientLabel = client?.name || client?.email || 'A client';
    Notification.bulkCreate(
      validIds.map(vendorId => ({
        userId: vendorId,
        type: 'new_rfq',
        title: `New RFQ: ${equipment.name}`,
        message: `${clientLabel} has sent you an RFQ for ${equipment.name}. Submit your bid now.`,
        rfqId: rfq.id,
        read: false,
      }))
    ).catch(e => console.error('Notification error:', e));

    res.json({
      ...rfq.toJSON(),
      equipmentName: equipment.name,
      message: `RFQ sent to ${validIds.length} vendor${validIds.length !== 1 ? 's' : ''}`
    });

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

// GET /api/rfq/vendor-rfqs — RFQs addressed to the logged-in vendor
router.get('/vendor-rfqs', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    // Fetch all open RFQs and filter to those that include this vendor's ID
    const allRfqs = await RFQ.findAll({
      where: { status: 'open' },
      order: [['createdAt', 'DESC']],
    });

    const vendorId = req.user.id;
    const myRfqs = allRfqs.filter(r => {
      let vList = r.vendors;
      if (typeof vList === 'string') { try { vList = JSON.parse(vList); } catch { vList = []; } }
      if (!Array.isArray(vList)) return false;
      return vList.map(Number).includes(Number(vendorId));
    });

    const result = await Promise.all(myRfqs.map(async (r) => {
      const equipment = await Equipment.findByPk(r.equipmentId);
      const client = await User.findByPk(r.clientId, { attributes: ['name', 'email'] });
      // Check if this vendor already bid on this RFQ
      const existingBid = await Bid.findOne({ where: { rfqId: r.id, vendorId } });
      
      let parsedAcceptedVendors = r.acceptedVendors;
      if (typeof parsedAcceptedVendors === 'string') {
        try { parsedAcceptedVendors = JSON.parse(parsedAcceptedVendors); } catch { parsedAcceptedVendors = []; }
      }
      if (!Array.isArray(parsedAcceptedVendors)) parsedAcceptedVendors = [];

      return {
        id: r.id,
        equipmentId: r.equipmentId,
        equipmentName: equipment?.name || 'Unknown',
        clientName: client?.name || client?.email || 'Client',
        status: r.status,
        createdAt: r.createdAt,
        acceptedVendors: parsedAcceptedVendors,
        myBid: existingBid ? {
          id: existingBid.id,
          price: parseFloat(existingBid.price),
          availability: existingBid.availability,
          status: existingBid.status,
        } : null,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/rfq/:id (detailed) - SECURED
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await RFQ.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });

    // Authorization Check
    if (req.user.role === 'client' && r.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this RFQ' });
    }
    
    if (req.user.role === 'vendor') {
      let vList = r.vendors;
      if (typeof vList === 'string') {
        try { vList = JSON.parse(vList); } catch (e) { vList = []; }
      }
      if (!Array.isArray(vList) || !vList.map(String).includes(String(req.user.id))) {
        return res.status(403).json({ error: 'Access denied: You are not invited to this RFQ' });
      }
    }

    const equipment = await Equipment.findByPk(r.equipmentId);
    const client = await User.findByPk(r.clientId, { attributes: ['name', 'email', 'companyName'] });
    const bids = await Bid.findAll({ where: { rfqId: r.id } });
    
    res.json({ rfq: r, equipment, client, bids });
  } catch (err) {
    console.error('Fetch RFQ detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/rfq/:id/accept — Vendor accepts the RFQ
router.post('/:id/accept', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

    let accepted = rfq.acceptedVendors;
    if (typeof accepted === 'string') { try { accepted = JSON.parse(accepted); } catch { accepted = []; } }
    if (!Array.isArray(accepted)) accepted = [];

    const vendorId = req.user.id;
    if (!accepted.includes(vendorId)) {
      accepted.push(vendorId);
      rfq.acceptedVendors = JSON.stringify(accepted);
      await rfq.save();
    }

    res.json({ success: true, acceptedVendors: accepted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;