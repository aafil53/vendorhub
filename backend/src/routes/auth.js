const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'vendorhub_secret';

// ── Auth middleware ────────────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error('User not found');
    req.user  = user;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      email, password, name, role,
      // Core vendor fields
      companyName, contactName, phone,
      // Extended profile
      companyType, founded, employees, website, about,
      address, region, country,
      // JSON fields
      certifications, categories, operatingRegions, keyContacts, bankDetails,
      // Metrics
      experienceYears,
    } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ error: 'Missing required fields: email, password, name' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const isVendor       = role === 'vendor';

    const user = await User.create({
      email, hashedPassword, name,
      role: role || 'vendor',

      // Vendor-only fields
      companyName:      isVendor ? (companyName || null)      : null,
      contactName:      isVendor ? (contactName || null)      : null,
      phone:            isVendor ? (phone || null)            : null,
      companyType:      isVendor ? (companyType || null)      : null,
      founded:          isVendor ? (founded || null)          : null,
      employees:        isVendor ? (employees || null)        : null,
      website:          isVendor ? (website || null)          : null,
      about:            isVendor ? (about || null)            : null,
      address:          isVendor ? (address || null)          : null,
      region:           isVendor ? (region || null)           : null,
      country:          isVendor ? (country || 'Saudi Arabia'): null,
      certifications:   isVendor ? (certifications || [])     : [],
      categories:       isVendor ? (categories || [])         : [],
      operatingRegions: isVendor ? (operatingRegions || [])   : [],
      keyContacts:      isVendor ? (keyContacts || [])        : [],
      bankDetails:      isVendor ? (bankDetails || null)      : null,
      experienceYears:  isVendor ? (experienceYears || 0)     : 0,
      rating:           isVendor ? 0.00                       : null,
      ordersCount:      isVendor ? 0                          : null,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.hashedPassword);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/auth/profile ─────────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['hashedPassword'] },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profile fetch failed' });
  }
});

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const allowed = [
      'name', 'companyName', 'contactName', 'phone',
      'companyType', 'founded', 'employees', 'website', 'about',
      'address', 'region', 'country',
      'certifications', 'categories', 'operatingRegions', 'keyContacts', 'bankDetails',
      'experienceYears', 'rating', 'ordersCount',
    ];
    const updates = Object.keys(req.body).filter(k => allowed.includes(k));
    updates.forEach(k => req.user[k] = req.body[k]);
    await req.user.save();
    res.json(sanitizeUser(req.user));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── helper ────────────────────────────────────────────────────────────────────
function sanitizeUser(user) {
  const u = user.toJSON ? user.toJSON() : { ...user };
  delete u.hashedPassword;
  return u;
}

module.exports = router;
