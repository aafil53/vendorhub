const { User } = require('./src/models');
const { Op } = require('sequelize');

async function cleanIncompleteVendors() {
  try {
    console.log('Deleting incomplete vendors...');
    const result = await User.destroy({
      where: {
        role: 'vendor',
        [Op.or]: [
          { companyName: null },
          { phone: null },
          { categories: null }
        ]
      }
    });
    console.log(`Deleted ${result} incomplete vendor(s).`);
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning vendors:', error);
    process.exit(1);
  }
}

cleanIncompleteVendors();
