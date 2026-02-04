const express = require('express');
const { User } = require('../models');
const router = express.Router();

// GET /api/users?role=vendor
router.get('/', async (req, res) => {
  try {
    const role = req.query.role;
    const where = {};
    if (role) where.role = role;
    const users = await User.findAll({
      where,
      attributes: ['id', 'email', 'role', 'name'],
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
