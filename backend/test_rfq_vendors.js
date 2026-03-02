const axios = require('axios');

async function testEquipmentVendors() {
  try {
    const categories = ['Excavators', 'Cranes', 'Bulldozers', 'Spaceships'];
    
    for (const cat of categories) {
      console.log(`Testing category: ${cat}`);
      const res = await axios.get(`http://localhost:5000/api/equipment/vendors?category=${cat}`);
      console.log(`Vendors found: ${res.data.length}`);
      res.data.forEach(v => console.log(` - ${v.name} (${v.companyName}) [${v.categories}]`));
      console.log('---');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if(error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testEquipmentVendors();
