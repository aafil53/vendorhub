// backend/src/cron/rfqAutoClose.js
//
// Runs every minute. Finds all open RFQs whose deadline has passed,
// closes them, notifies each invited vendor via socket + DB notification.
//
// Registration: call startRfqAutoClose() once from server.js after setIo().

const cron  = require('node-cron');
const { Op } = require('sequelize');
const { RFQ, Equipment, User, Notification } = require('../models');
const { getIo } = require('../socket');

async function closeExpiredRfqs() {
  try {
    const now = new Date();

    // Find all open RFQs whose deadline is in the past
    const expired = await RFQ.findAll({
      where: {
        status: 'open',
        deadline: { [Op.lt]: now, [Op.ne]: null },
      },
    });

    if (expired.length === 0) return;

    console.log(`[AutoClose] Found ${expired.length} expired RFQ(s) — closing…`);

    for (const rfq of expired) {
      // Close the RFQ
      await rfq.update({ status: 'closed' });

      // Resolve vendor list
      let vendorIds = rfq.vendors;
      if (typeof vendorIds === 'string') {
        try { vendorIds = JSON.parse(vendorIds); } catch { vendorIds = []; }
      }
      if (!Array.isArray(vendorIds)) vendorIds = [];

      const equipment = await Equipment.findByPk(rfq.equipmentId);
      const equipName = equipment?.name || `RFQ #${rfq.id}`;

      const io = getIo();

      // Notify each vendor
      for (const vendorId of vendorIds) {
        // DB notification
        Notification.create({
          userId:  vendorId,
          type:    'rfq_expired',
          title:   `RFQ Closed: ${equipName}`,
          message: `The deadline for RFQ #${String(rfq.id).padStart(4, '0')} (${equipName}) has passed and it is now closed. No further bids are accepted.`,
          rfqId:   rfq.id,
          read:    false,
        }).catch(e => console.error('[AutoClose] Notification error:', e));

        // Real-time socket push
        if (io) {
          io.to(`user:${vendorId}`).emit('rfq:expired', {
            rfqId:    rfq.id,
            equipName,
            message: `⏰ RFQ #${String(rfq.id).padStart(4,'0')} (${equipName}) has expired and is now closed.`,
          });
          // Also emit notification:new so the unread badge increments
          io.to(`user:${vendorId}`).emit('notification:new', {
            type:  'rfq_expired',
            title: `RFQ Closed: ${equipName}`,
            rfqId: rfq.id,
          });
        }
      }

      // Also notify the client that their RFQ auto-closed
      if (io) {
        io.to(`user:${rfq.clientId}`).emit('rfq:expired', {
          rfqId:    rfq.id,
          equipName,
          message: `⏰ Your RFQ #${String(rfq.id).padStart(4,'0')} (${equipName}) has expired and was automatically closed.`,
        });
      }

      console.log(`[AutoClose] RFQ #${rfq.id} (${equipName}) closed. Notified ${vendorIds.length} vendor(s).`);
    }
  } catch (err) {
    console.error('[AutoClose] Error during sweep:', err.message);
  }
}

function startRfqAutoClose() {
  // Run every minute — catches deadlines within 60s of expiry
  cron.schedule('* * * * *', closeExpiredRfqs, { timezone: 'UTC' });
  console.log('[AutoClose] RFQ auto-close cron started (every 1 min, UTC)');

  // Also run immediately on startup to catch any missed deadlines
  closeExpiredRfqs();
}

module.exports = { startRfqAutoClose };
