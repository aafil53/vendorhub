const express = require('express');
const router  = express.Router();
const { Invoice, Order, Bid, RFQ, Equipment, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// ── helpers ───────────────────────────────────────────────────────────────────
function generateInvoiceNumber() {
  return `INV-${Date.now()}`;
}

async function buildFullInvoice(inv) {
  const order = await Order.findByPk(inv.orderId, {
    include: [
      { model: Bid, as: 'bid',
        include: [{ model: RFQ, as: 'rfq',
          include: [{ model: Equipment, as: 'equipment' }] }] },
      { model: User, as: 'client', attributes: ['id','name','email','companyName','phone'] },
      { model: User, as: 'vendor', attributes: ['id','name','email','companyName','phone'] },
    ],
  });

  return {
    id:            inv.id,
    invoiceNumber: inv.invoiceNumber,
    status:        inv.status,
    dueDate:       inv.dueDate,
    notes:         inv.notes,
    lineItems:     inv.lineItems,
    subtotal:      parseFloat(inv.subtotal),
    taxRate:       parseFloat(inv.taxRate),
    taxAmount:     parseFloat(inv.taxAmount),
    discount:      parseFloat(inv.discount),
    totalAmount:   parseFloat(inv.totalAmount),
    createdAt:     inv.createdAt,
    orderId:       inv.orderId,
    poNumber:      order?.poDetails?.poNumber || `PO-${inv.orderId}`,
    orderStatus:   order?.status,
    orderDate:     order?.createdAt,
    equipmentName: order?.bid?.rfq?.equipment?.name || 'Equipment',
    client: {
      id:          order?.client?.id,
      name:        order?.client?.name || order?.client?.email || 'Client',
      email:       order?.client?.email,
      company:     order?.client?.companyName || order?.client?.name,
      phone:       order?.client?.phone,
    },
    vendor: {
      id:          order?.vendor?.id,
      name:        order?.vendor?.name || order?.vendor?.email || 'Vendor',
      email:       order?.vendor?.email,
      company:     order?.vendor?.companyName || order?.vendor?.name,
      phone:       order?.vendor?.phone,
    },
  };
}

// ─── POST /api/invoices/generate ─────────────────────────────────────────────
// Creates an invoice from an orderId. Idempotent — returns existing if already generated.
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { orderId, notes, taxRate = 15, discount = 0 } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    // Return existing invoice if already generated
    const existing = await Invoice.findOne({ where: { orderId } });
    if (existing) {
      return res.json(await buildFullInvoice(existing));
    }

    // Load order with full chain
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Bid, as: 'bid',
          include: [{ model: RFQ, as: 'rfq',
            include: [{ model: Equipment, as: 'equipment' }] }] },
        { model: User, as: 'client', attributes: ['id','name','email','companyName'] },
        { model: User, as: 'vendor', attributes: ['id','name','email','companyName'] },
      ],
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Access control: only client or vendor of the order can generate
    if (req.user.role === 'client' && order.clientId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });
    if (req.user.role === 'vendor' && order.vendorId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    const equipmentName = order.bid?.rfq?.equipment?.name || 'Equipment';
    const unitPrice     = parseFloat(order.bid?.price || 0);
    const quantity      = 1;
    const lineItems     = [
      {
        description: equipmentName,
        quantity,
        unitPrice,
        total: unitPrice * quantity,
      },
    ];

    const subtotal    = unitPrice * quantity;
    const discountAmt = parseFloat(discount) || 0;
    const taxAmt      = parseFloat(((subtotal - discountAmt) * (parseFloat(taxRate) / 100)).toFixed(2));
    const totalAmount = parseFloat((subtotal - discountAmt + taxAmt).toFixed(2));
    const dueDate     = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      orderId:       order.id,
      clientId:      order.clientId,
      vendorId:      order.vendorId,
      lineItems,
      subtotal,
      taxRate:       parseFloat(taxRate),
      taxAmount:     taxAmt,
      discount:      discountAmt,
      totalAmount,
      notes:         notes || null,
      status:        'draft',
      dueDate,
    });

    res.status(201).json(await buildFullInvoice(invoice));
  } catch (err) {
    console.error('[invoices] generate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/invoices/order/:orderId ────────────────────────────────────────
// Get invoice for a specific order
router.get('/order/:orderId', authMiddleware, async (req, res) => {
  try {
    const inv = await Invoice.findOne({ where: { orderId: req.params.orderId } });
    if (!inv) return res.status(404).json({ error: 'No invoice for this order' });

    // Access control
    if (req.user.role === 'client' && inv.clientId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });
    if (req.user.role === 'vendor' && inv.vendorId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    res.json(await buildFullInvoice(inv));
  } catch (err) {
    console.error('[invoices] get by order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/invoices ────────────────────────────────────────────────────────
// List all invoices for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'client')      where.clientId = req.user.id;
    else if (req.user.role === 'vendor') where.vendorId = req.user.id;
    // admin sees all

    const invoices = await Invoice.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    const result = await Promise.all(invoices.map(buildFullInvoice));
    res.json(result);
  } catch (err) {
    console.error('[invoices] list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
