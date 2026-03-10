const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { requireRole } = require('../middleware/auth');

// All /api/admin/* routes require admin role
// Global JWT auth already handled by server.js app.use('/api', authMiddleware)
router.use(requireRole(['admin']));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {

    // ── 1. KPI Totals ─────────────────────────────────────────────────────────
    const kpiRows = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM Users  WHERE role = 'client') AS totalClients,
        (SELECT COUNT(*) FROM Users  WHERE role = 'vendor') AS totalVendors,
        (SELECT COUNT(*) FROM RFQs)                         AS totalRFQs,
        (SELECT COUNT(*) FROM Bids)                         AS totalBids,
        (SELECT COUNT(*) FROM Orders)                       AS totalOrders,
        (
          SELECT COALESCE(SUM(b.price), 0)
          FROM   Orders o
          INNER  JOIN Bids b ON b.id = o.bidId
          WHERE  o.status IN ('pending', 'completed')
        ) AS totalOrderValue
    `, { type: QueryTypes.SELECT });

    const totals = kpiRows[0];

    // ── 2. RFQs per week (last 8 weeks) ──────────────────────────────────────
    const rfqsByWeek = await sequelize.query(`
      SELECT
        DATE_FORMAT(MIN(createdAt), '%b %d') AS label,
        COUNT(*)                              AS count
      FROM  RFQs
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY YEARWEEK(createdAt, 1)
      ORDER BY YEARWEEK(createdAt, 1) ASC
    `, { type: QueryTypes.SELECT });

    // ── 3. Bid status pie ─────────────────────────────────────────────────────
    const bidStatus = await sequelize.query(`
      SELECT status, COUNT(*) AS count
      FROM   Bids
      GROUP  BY status
    `, { type: QueryTypes.SELECT });

    // ── 4. Top 5 vendors by total order value ─────────────────────────────────
    const topVendors = await sequelize.query(`
      SELECT
        u.name                    AS vendor,
        COUNT(o.id)               AS orderCount,
        COALESCE(SUM(b.price), 0) AS totalValue
      FROM  Users u
      LEFT  JOIN Bids   b ON b.vendorId = u.id
      LEFT  JOIN Orders o ON o.bidId    = b.id
        AND o.status IN ('pending', 'completed')
      WHERE u.role = 'vendor'
      GROUP BY u.id, u.name
      ORDER BY totalValue DESC
      LIMIT 5
    `, { type: QueryTypes.SELECT });

    // ── 5. RFQ pipeline funnel ────────────────────────────────────────────────
    const rfqFunnel = await sequelize.query(`
      SELECT
        status,
        COUNT(*) AS count
      FROM  RFQs
      GROUP BY status
      ORDER BY FIELD(status, 'open', 'closed', 'awarded', 'cancelled')
    `, { type: QueryTypes.SELECT });

    // ── 6. Monthly order value trend (last 6 months) ──────────────────────────
    const orderTrend = await sequelize.query(`
      SELECT
        DATE_FORMAT(o.createdAt, '%b %Y')      AS month,
        DATE_FORMAT(MIN(o.createdAt), '%Y-%m') AS sortKey,
        COALESCE(SUM(b.price), 0)              AS value
      FROM   Orders o
      INNER  JOIN Bids b ON b.id = o.bidId
      WHERE  o.createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND  o.status IN ('pending', 'completed')
      GROUP  BY DATE_FORMAT(o.createdAt, '%b %Y'),
                DATE_FORMAT(o.createdAt, '%Y-%m')
      ORDER  BY sortKey ASC
    `, { type: QueryTypes.SELECT });

    // ── 7. Activity feed (last 10 events across RFQs, Bids, Orders) ──────────
    // Wrapped UNION in a derived table — avoids MySQL UNION + ORDER BY scope issues
    const recentActivity = await sequelize.query(`
      SELECT action, actor, ts
      FROM (
        (
          SELECT 'RFQ Created'   AS action,
                 u.name          AS actor,
                 r.createdAt     AS ts
          FROM   RFQs r
          INNER  JOIN Users u ON u.id = r.clientId
          ORDER  BY r.createdAt DESC
          LIMIT  4
        )
        UNION ALL
        (
          SELECT 'Bid Submitted' AS action,
                 u.name          AS actor,
                 b.createdAt     AS ts
          FROM   Bids b
          INNER  JOIN Users u ON u.id = b.vendorId
          ORDER  BY b.createdAt DESC
          LIMIT  3
        )
        UNION ALL
        (
          SELECT 'Order Created' AS action,
                 u.name          AS actor,
                 o.createdAt     AS ts
          FROM   Orders o
          INNER  JOIN Users u ON u.id = o.clientId
          ORDER  BY o.createdAt DESC
          LIMIT  3
        )
      ) AS combined
      ORDER BY ts DESC
      LIMIT 10
    `, { type: QueryTypes.SELECT });

    // ── 8. Order status breakdown ─────────────────────────────────────────────
    const orderStatus = await sequelize.query(`
      SELECT status, COUNT(*) AS count
      FROM   Orders
      GROUP  BY status
    `, { type: QueryTypes.SELECT });

    res.json({
      totals,
      rfqsByWeek,
      bidStatus,
      topVendors,
      rfqFunnel,
      orderTrend,
      recentActivity,
      orderStatus,
    });

  } catch (err) {
    console.error('[Admin Analytics] /stats error:', err.message);
    res.status(500).json({ error: 'Failed to load analytics', details: err.message });
  }
});

module.exports = router;
