const axios = require('axios');

async function testCategoryNormalization() {
  try {
    // Frontend sends Singular usually
    const categories = ['Excavator', 'Crane', 'Forklift', 'Spaceship'];
    
    for (const cat of categories) {
      console.log(`Testing frontend category: "${cat}"`);
      const res = await axios.get(`http://localhost:5000/api/equipment/vendors?category=${cat}`);
      console.log(`Vendors found: ${res.data.length}`);
      
      const isFallback = res.data.some(v => v.isFallback);
      if (isFallback) {
          console.log(' -> (Fallback List returned)');
      } else {
          res.data.forEach(v => console.log(` - ${v.companyName} [${v.categories}]`));
      }
      console.log('---');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCategoryNormalization();
