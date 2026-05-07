'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Migration: Extend Bid model with new status enums and declineReason field
     * - Extends status ENUM from ('pending','accepted','rejected') 
     *   to include ('draft','submitted','revised','withdrawn','declined','expired')
     * - Adds declineReason STRING field for structured decline tracking
     */

    // Step 1: Add declineReason column if it doesn't exist
    try {
      await queryInterface.addColumn('Bids', 'declineReason', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Reason for RFQ decline (stock_unavailable, lead_time_incompatible, pricing_not_feasible, compliance_mismatch, or custom text)'
      });
      console.log('Added declineReason column to Bids table');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('declineReason column already exists, skipping');
      } else {
        throw err;
      }
    }

    // Step 2: Extend status ENUM
    // Note: Sequelize doesn't have great support for modifying ENUMs. 
    // If database is PostgreSQL or MySQL, you may need raw SQL instead.
    // For now, we'll try the sequelize approach which works on some databases.
    try {
      const dialect = queryInterface.sequelize.options.dialect;

      if (dialect === 'mysql' || dialect === 'mariadb') {
        // MySQL approach: Use raw SQL to modify ENUM
        await queryInterface.sequelize.query(
          `ALTER TABLE Bids MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'revised',
            'accepted',
            'rejected',
            'withdrawn',
            'declined',
            'expired'
          ) NOT NULL DEFAULT 'draft'`
        );
        console.log('Extended Bid status ENUM for MySQL');
      } else if (dialect === 'postgres') {
        // PostgreSQL approach: Create new type and use it
        await queryInterface.sequelize.query(
          `ALTER TYPE enum_Bids_status ADD VALUE 'draft' BEFORE 'pending'`
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE enum_Bids_status ADD VALUE 'submitted' BEFORE 'accepted'`
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE enum_Bids_status ADD VALUE 'revised' AFTER 'submitted'`
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE enum_Bids_status ADD VALUE 'withdrawn' AFTER 'rejected'`
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE enum_Bids_status ADD VALUE 'declined' AFTER 'withdrawn'`
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE enum_Bids_status ADD VALUE 'expired' AFTER 'declined'`
        );
        console.log('Extended Bid status ENUM for PostgreSQL');
      } else if (dialect === 'sqlite') {
        // SQLite: Recreate table with new schema
        // This is more complex and typically done via raw SQL
        console.log('SQLite: Manual migration may be needed. See docs for ENUM handling.');
      }
    } catch (err) {
      console.warn('ENUM migration warning:', err.message);
      console.log('If ENUM extension failed, you may need to apply manual SQL:');
      console.log(`
        -- For MySQL:
        ALTER TABLE Bids MODIFY COLUMN status ENUM(
          'draft', 'submitted', 'revised', 'accepted', 'rejected', 'withdrawn', 'declined', 'expired'
        ) NOT NULL DEFAULT 'draft';

        -- For PostgreSQL:
        ALTER TYPE enum_Bids_status ADD VALUE 'draft';
        ALTER TYPE enum_Bids_status ADD VALUE 'submitted';
        ALTER TYPE enum_Bids_status ADD VALUE 'revised';
        ALTER TYPE enum_Bids_status ADD VALUE 'withdrawn';
        ALTER TYPE enum_Bids_status ADD VALUE 'declined';
        ALTER TYPE enum_Bids_status ADD VALUE 'expired';
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Rollback migration
     */
    try {
      await queryInterface.removeColumn('Bids', 'declineReason');
      console.log('Removed declineReason column from Bids table');
    } catch (err) {
      console.log('declineReason removal skipped:', err.message);
    }

    // Note: Rolling back ENUM changes is complex and typically manual
    // PostgreSQL: You'd need to drop and recreate the type
    // MySQL: You'd recreate the ENUM without the new values
    console.log('Note: ENUM rollback may require manual SQL execution');
  }
};
