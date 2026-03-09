const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSecurity() {
  console.log('--- STARTING SECURITY VERIFICATION ---');

  // 1. Test Unauthenticated Access to Secured Route
  try {
    console.log('1. Testing unauthenticated access to /api/rfqs...');
    await axios.get(`${BASE_URL}/rfqs`);
    console.log('❌ FAIL: /api/rfqs accessible without token');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✅ PASS: /api/rfqs returned 401 Unauthorized');
    } else {
      console.log(`⚠️ UNKNOWN: /api/rfqs returned ${err.response?.status}`);
    }
  }

  // 2. Test Unauthenticated Access to RFQ Detail
  try {
    console.log('2. Testing unauthenticated access to /api/rfq/1...');
    await axios.get(`${BASE_URL}/rfq/1`);
    console.log('❌ FAIL: /api/rfq/1 accessible without token');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✅ PASS: /api/rfq/1 returned 401 Unauthorized');
    } else {
      console.log(`⚠️ UNKNOWN: /api/rfq/1 returned ${err.response?.status}`);
    }
  }

  // 3. Test Public Route Accessibility
  try {
    console.log('3. Testing access to public route /api/auth/login...');
    // We expect a 400 because we're not sending data, but it should NOT be 401
    await axios.post(`${BASE_URL}/auth/login`, {});
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ PASS: /api/auth/login is public (returned 400 Bad Request instead of 401)');
    } else if (err.response?.status === 401) {
      console.log('❌ FAIL: /api/auth/login returned 401 (should be public)');
    } else {
      console.log(`⚠️ INFO: /api/auth/login returned ${err.response?.status}`);
    }
  }

  // 4. Test Multi-tenant isolation (requires tokens - would need more setup for a full automated test)
  console.log('4. Multi-tenant isolation requires valid tokens for different users.');
  console.log('   Please perform manual verification as per implementation_plan.md.');

  console.log('--- SECURITY VERIFICATION COMPLETE ---');
}

testSecurity();
