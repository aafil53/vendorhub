const { User } = require('./src/models');

async function debugVendors() {
  try {
    const vendors = await User.findAll({
      where: { role: 'vendor' },
      attributes: ['id', 'email', 'companyName', 'categories']
    });
    
    console.log('--- RAW VENDORS ---');
    console.log(JSON.stringify(vendors, null, 2));
    console.log('-------------------');
    
    // Test simple find
    /*
    const excavators = await User.findAll({
        where: {
            role: 'vendor',
            categories: { [require('sequelize').Op.like]: '%Excava%' }
        }
    });
    console.log('Like %Excava% result count:', excavators.length);
    */
   
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

debugVendors();
