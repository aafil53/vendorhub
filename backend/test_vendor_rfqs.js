require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function testRfqStatus() {
  try {
    const res = await axios.get('http://localhost:5000/api/rfq/vendor-rfqs', {
      headers: {
        Authorization: `Bearer ${process.env.VENDORS_TOKEN_OR_SIMILAR}`
      }
    });
    console.log("RFQs:", JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error("Error fetching RFQs:", error.response ? error.response.data : error.message);
  }
}

testRfqStatus();
