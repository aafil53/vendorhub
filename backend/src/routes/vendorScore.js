const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { requireRole } = require('../middleware/auth');

// ─── helpers ─────────────────────────────────────────────────────────────────
function gradeFromScore(score) {
  if (score >= 90) return { grade: 'S', label: 'Elite',       color: '#7c3aed' };
  if (score >= 75) return { grade: 'A', label: 'Excellent',   color: '#059669' };
  if (score >= 60) return { grade: 'B', label: 'Good',        color: '#2563eb' };
  if (score >= 45) return { grade: 'C', label: 'Average',     color: '#d97706' };
  return              { grade: 'D', label: 'Needs Work',   color: '#dc2626' };
}

// ─── core compute function ────────────────────────────────────────────────────
// Returns an array of score objects for one or more vendorIds.
// Pass vendorIds = null to compute for ALL vendors.
async function computeScores(vendorIds = null) {
  const whereClause = vendorIds && vendorIds.length > 0
    ? `WHERE u.id IN (${vendorIds.map(() => '?').join(',')})`
    : `WHERE u.role = 'vendor'`;
  const replacements = vendorIds && vendorIds.length > 0 ? vendorIds : [];

  const rows = await sequelize.query(`
    SELECT
      u.id                                              AS vendorId,
      u.name,
      u.companyName,
      u.experienceYears,
      u.rating                                          AS manualRating,

      /* ── Bid acceptance rate (40 pts) ──────────────────── */
      COUNT(DISTINCT b.id)                              AS totalBids,
      COUNT(DISTINCT CASE WHEN b.status = 'accepted'
            THEN b.id END)                              AS acceptedBids,

      /* ── PO completion rate (35 pts) ───────────────────── */
      COUNT(DISTINCT o.id)                              AS totalOrders,
      COUNT(DISTINCT CASE WHEN o.status = 'completed'
            THEN o.id END)                              AS completedOrders,

      /* ── RFQ response rate (15 pts) ────────────────────── */
      /* Count RFQs this vendor was invited to (vendors JSON contains vendorId) */
      (
        SELECT COUNT(*)
        FROM   RFQs r
        WHERE  JSON_CONTAINS(r.vendors, CAST(u.id AS JSON), '$')
      )                                                 AS rfqsInvited,

      COUNT(DISTINCT b.rfqId)                           AS rfqsResponded

    FROM  Users u
    LEFT JOIN Bids   b ON b.vendorId = u.id
    LEFT JOIN Orders o ON o.vendorId = u.id
    ${whereClause}
    GROUP BY u.id, u.name, u.companyName, u.experienceYears, u.rating
  `, { type: QueryTypes.SELECT, replacements });

  return rows.map(r => {
    const totalBids       = Number(r.totalBids)      || 0;
    const acceptedBids    = Number(r.acceptedBids)   || 0;
    const totalOrders     = Number(r.totalOrders)    || 0;
    const completedOrders = Number(r.completedOrders)|| 0;
    const rfqsInvited     = Number(r.rfqsInvited)    || 0;
    const rfqsResponded   = Number(r.rfqsResponded)  || 0;
    const expYears        = Number(r.experienceYears)|| 0;

    // Component scores (each normalised 0→their max points)
    const bidAcceptance  = totalBids > 0
      ? (acceptedBids / totalBids) * 40
      : 20; // neutral default for new vendors

    const poCompletion   = totalOrders > 0
      ? (completedOrders / totalOrders) * 35
      : 17.5; // neutral

    const responseRate   = rfqsInvited > 0
      ? Math.min(rfqsResponded / rfqsInvited, 1) * 15
      : 7.5; // neutral

    const experienceBonus = Math.min(expYears / 10, 1) * 10;

    const rawScore = bidAcceptance + poCompletion + responseRate + experienceBonus;
    const score    = Math.round(Math.min(rawScore, 100));
    const { grade, label, color } = gradeFromScore(score);

    return {
      vendorId:       r.vendorId,
      name:           r.name,
      companyName:    r.companyName,
      score,
      grade,
      gradeLabel:     label,
      gradeColor:     color,
      breakdown: {
        bidAcceptance:  { pts: Math.round(bidAcceptance),  max: 40, pct: totalBids > 0 ? Math.round((acceptedBids/totalBids)*100) : null },
        poCompletion:   { pts: Math.round(poCompletion),   max: 35, pct: totalOrders > 0 ? Math.round((completedOrders/totalOrders)*100) : null },
        responseRate:   { pts: Math.round(responseRate),   max: 15, pct: rfqsInvited > 0 ? Math.round((rfqsResponded/rfqsInvited)*100) : null },
        experienceBonus:{ pts: Math.round(experienceBonus),max: 10, years: expYears },
      },
      meta: { totalBids, acceptedBids, totalOrders, completedOrders, rfqsInvited, rfqsResponded },
    };
  });
}

// ─── GET /api/vendor-scores ──────────────────────────────────────────────────
// Returns scores for ALL vendors. Admin/client only.
router.get('/', requireRole(['admin', 'client']), async (req, res) => {
  try {
    const scores = await computeScores(null);
    // Sort by score desc by default
    scores.sort((a, b) => b.score - a.score);
    res.json(scores);
  } catch (err) {
    console.error('[VendorScore] GET / error:', err.message);
    res.status(500).json({ error: 'Failed to compute vendor scores', details: err.message });
  }
});

// ─── GET /api/vendor-scores/:vendorId ───────────────────────────────────────
// Returns score + full breakdown for one vendor.
// Vendors can see their own score; admins/clients can see any.
router.get('/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const requesterId  = req.user.id;
    const requesterRole = req.user.role;

    // Vendors can only view their own score
    if (requesterRole === 'vendor' && Number(vendorId) !== Number(requesterId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const scores = await computeScores([Number(vendorId)]);
    if (!scores.length) return res.status(404).json({ error: 'Vendor not found' });
    res.json(scores[0]);
  } catch (err) {
    console.error('[VendorScore] GET /:id error:', err.message);
    res.status(500).json({ error: 'Failed to compute score', details: err.message });
  }
});

// ─── GET /api/vendor-scores/batch ───────────────────────────────────────────
// POST body: { vendorIds: [1, 2, 3] }
// Used by VendorSelection to score a filtered list efficiently.
router.post('/batch', requireRole(['admin', 'client']), async (req, res) => {
  try {
    const { vendorIds } = req.body;
    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: 'vendorIds array required' });
    }
    const scores = await computeScores(vendorIds);
    // Return as a map { vendorId → scoreObj } for O(1) frontend lookup
    const map = {};
    for (const s of scores) map[s.vendorId] = s;
    res.json(map);
  } catch (err) {
    console.error('[VendorScore] POST /batch error:', err.message);
    res.status(500).json({ error: 'Failed to compute scores', details: err.message });
  }
});

module.exports = router;
module.exports.computeScores = computeScores; // export for use in other routes
