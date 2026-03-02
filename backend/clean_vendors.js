const { User } = require('./src/models');
const { Op } = require('sequelize');

async function cleanVendors() {
  try {
    console.log('Cleaning fake vendors...');
    const result = await User.destroy({
      where: {
        role: 'vendor',
        companyName: null
      }
    });
    console.log(`Deleted ${result} fake vendors.`);
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning vendors:', error);
    process.exit(1);
  }
}

cleanVendors();
