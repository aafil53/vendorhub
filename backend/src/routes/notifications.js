const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// GET /api/notifications — fetch current user's notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, unread } = req.query;
    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (unread === 'true') where.read = false;

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, read: false }
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { id: req.params.id, userId: req.user.id } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id, read: false } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
