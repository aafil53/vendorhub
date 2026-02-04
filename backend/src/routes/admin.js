const express = require('express');
const router = express.Router();

// GET /api/admin/bids
router.get('/bids', async (req, res) => {
  // For demo purposes return flattened mock bids. In production this should aggregate from Bids and RFQs.
  const mock = [
    { id: 1, vendorName: 'Vendor One', price: 5000, certFile: null, availability: 'Immediate', equipmentName: 'Excavator 3000', rfqId: 101 },
    { id: 2, vendorName: 'Vendor Two', price: 4500, certFile: 'cert-123.pdf', availability: '2 days', equipmentName: 'Crane Pro X', rfqId: 102 }
  ];
  res.json(mock);
});

module.exports = router;
