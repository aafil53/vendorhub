const express = require('express');
const router = express.Router();
const { User, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /api/equipment/categories
// Returns unique equipment categories from all registered vendors
router.get('/categories', async (req, res) => {
  try {
    const vendors = await User.findAll({
      where: {
        role: 'vendor',
        companyName: { [Op.ne]: null }
      },
      attributes: ['categories']
    });

    // Aggregate all categories with vendor counts
    const categoryMap = {};
    vendors.forEach(vendor => {
      let cats = vendor.categories;
      if (typeof cats === 'string') {
        try { cats = JSON.parse(cats); } catch (e) { cats = []; }
      }
      if (!Array.isArray(cats)) cats = [];
      cats.forEach(cat => {
        if (cat && typeof cat === 'string') {
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        }
      });
    });

    const categories = Object.entries(categoryMap)
      .map(([name, vendorCount]) => ({ name, vendorCount }))
      .sort((a, b) => b.vendorCount - a.vendorCount);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching equipment categories:', error);
    res.status(500).json({ error: 'Categories fetch failed' });
  }
});

// GET /api/equipment/vendors
// Query params:
// - category (required)
router.get('/vendors', async (req, res) => {
  try {
    const { category } = req.query;

    // 1. Try Strict Match (Now exact match since DB is standardized)
    let where = {
      role: 'vendor',
      companyName: { [Op.ne]: null }
    };

    if (category) {
      // Using JSON_CONTAINS via literal for MySQL safety
      // value must be a valid JSON string, so specific category needs quotes: '"Excavators"'
      const jsonCategory = JSON.stringify(category);
      where[Op.and] = [
        sequelize.literal(`JSON_CONTAINS(categories, '${jsonCategory}')`)
      ];
    }

    let vendors = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['rating', 'DESC']]
    });

    // 2. Fallback Mechanism
    if (vendors.length === 0) {
      console.log(`No strict match for ${category}, fetching fallback vendors.`);
      const fallbackVendors = await User.findAll({
        where: {
          role: 'vendor',
          companyName: { [Op.ne]: null }
        },
        limit: 5,
        attributes: { exclude: ['password'] },
        order: [['rating', 'DESC'], ['ordersCount', 'DESC']]
      });

      // Mark as fallback
      vendors = fallbackVendors.map(v => {
        const vJson = v.toJSON();
        vJson.isFallback = true;
        return vJson;
      });
    }

    res.json({ vendors });
  } catch (error) {
    console.error('Error fetching equipment vendors:', error);
    res.status(500).json({ error: 'Vendors fetch failed' });
  }
});

module.exports = router;
