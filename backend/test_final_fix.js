const axios = require('axios');

async function testFinalFix() {
  try {
    const tests = [
        { input: 'Crane', expected: 2 },     // Hitachi, Arabian
        { input: 'Dozer', expected: 2 },     // Gulf, Arabian (Bulldozers)
        { input: 'Excavator', expected: 2 }, // Hitachi, Gulf
        { input: 'Forklift', expected: 1 }   // Arabian
    ];
    
    for (const t of tests) {
      console.log(`Testing: "${t.input}"...`);
      const res = await axios.get(`http://localhost:5000/api/equipment/vendors?category=${t.input}`);
      
      const count = res.data.length;
      const isFallback = res.data[0]?.isFallback;
      
      if (isFallback) {
          console.log(`❌ Fallback triggered (Found ${count}) - Expected Strict Match`);
      } else if (count === t.expected) {
          console.log(`✅ MATCH! Found ${count} vendors.`);
      } else {
          console.log(`⚠️ Partial Match? Found ${count}, expected ${t.expected}.`);
      }
      res.data.forEach(v => console.log(`   - ${v.companyName} [${v.categories}]`));
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFinalFix();
