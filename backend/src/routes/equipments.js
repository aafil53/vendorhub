const express = require('express');
const { Equipment } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const equipments = await Equipment.findAll();
    res.json(equipments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
