const axios = require('axios');

async function verifyStandardization() {
  try {
    // Now querying with Plural (as stored in DB for equipment)
    const tests = [
        { input: 'Excavators', expected: 2 }, 
        { input: 'Cranes', expected: 2 },
        { input: 'Bulldozers', expected: 2 },
        { input: 'Forklifts', expected: 1 },
        { input: 'Concrete Pumps', expected: 0 }, // No vendors yet
    ];
    
    for (const t of tests) {
      console.log(`Testing standardized category: "${t.input}"...`);
      const res = await axios.get(`http://localhost:5000/api/equipment/vendors?category=${t.input}`);
      
      const count = res.data.length;
      const isFallback = res.data[0]?.isFallback;
      
      if (isFallback && t.expected > 0) {
          console.log(`❌ Fallback triggered (Found ${count}) - Expected Strict Match`);
      } else if (count === t.expected) {
          console.log(`✅ MATCH! Found ${count} vendors.`);
      } else {
          // If 0 expected and 0 found (or fallback for 0), strict check
          if(t.expected === 0 && (count === 0 || isFallback)) {
             console.log(`✅ MATCH! Correctly found 0 (or fallback).`);
          } else {
             console.log(`⚠️ Partial/Unexpected Match? Found ${count}, expected ${t.expected}.`);
          }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

verifyStandardization();
