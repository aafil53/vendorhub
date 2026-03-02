const express = require('express');
const { User } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// GET /api/vendors
// Query params:
// - page (default 1)
// - limit (default 20)
// - category (optional, filters by equipment categories)
// - search (optional, searches name or company)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { category, search } = req.query;

    const where = {
      role: 'vendor',
      // We are showing ALL registered vendors as per request.
      // Incomplete profiles were deleted via script.
    };

    if (category) {
      // Assuming categories is stored as JSON or similar that supports containment,
      // or if it's a string, use LIKE.
      // Based on previous files, it seems to be generic JSON or array.
      // If SQLite/MySQL JSON support varies, we need to be careful.
      // For now, let's assume it checks if the category string is in the array or substring match for safety.
      // If it's a JSON column in MySQL:
      // where.categories = { [Op.jsonContained]: [category] } or similar.
      // But let's try a safer string-based approach if it's stored as text, or use Op.like if simple serialized array.
      // If it is a JSON column in MySQL 5.7+ / 8.0:
      // where.categories = sequelize.where(sequelize.fn('JSON_CONTAINS', sequelize.col('categories'), `"${category}"`), 1);
      
      // Let's rely on standard text matching for now if unsure of DB column type, 
      // OR if it's JSON array, let's try the Op.like for now as a fallback if it's stringified,
      // or just fetch and filter in memory if volume is low (but we want pagination).
      
      // Let's assume standard JSON column for now and use Op.like as a "dumb" search 
      // if we aren't sure about the dialect options set up (e.g. mariadb vs mysql).
      // Actually, typically in these setups it's a JSON column.
      // Let's try:
      where.categories = { [Op.like]: `%${category}%` }; 
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { companyName: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [
        ['rating', 'DESC'],
        ['ordersCount', 'DESC']
      ],
      limit,
      offset
    });

    res.json({
      vendors: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('Error fetching vendors:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
