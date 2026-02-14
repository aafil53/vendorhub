const express = require('express');
const router = express.Router();  // ← THIS WAS MISSING!
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Register - FIXED WITH VENDOR FIELDS
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, companyName, contactName, phone, certifications, categories } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      hashedPassword,
      name,
      role: role || 'vendor',
      companyName: role === 'vendor' ? companyName : null,
      contactName: role === 'vendor' ? contactName : null,
      phone: role === 'vendor' ? phone : null,
      certifications: role === 'vendor' ? (certifications || []) : [],
      categories: role === 'vendor' ? (categories || []) : [],
      rating: role === 'vendor' ? 4.8 : null,
      ordersCount: role === 'vendor' ? 0 : null
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: user.companyName
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vendorhub_secret');
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error();
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

// Get Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['hashedPassword'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Profile fetch failed' });
  }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'companyName', 'contactName', 'phone', 'certifications', 'categories', 'experienceYears', 'rating', 'ordersCount'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates!' });
    }

    updates.forEach((update) => req.user[update] = req.body[update]);
    await req.user.save();
    res.json(req.user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login (Updated to return full user object)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.hashedPassword);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET || 'vendorhub_secret', { expiresIn: '1h' });
    
    // Return all fields
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name,
        companyName: user.companyName,
        contactName: user.contactName,
        phone: user.phone,
        certifications: user.certifications,
        categories: user.categories,
        experienceYears: user.experienceYears,
        ordersCount: user.ordersCount,
        rating: user.rating
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
