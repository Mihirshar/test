const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_PHONE = '+918077759300';

async function testAuthentication() {
  console.log('🔐 MANUAL AUTHENTICATION TEST\n');
  
  try {
    // Step 1: Health Check
    console.log('STEP 1: Health Check');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server Health:', health.data);
    
    // Step 2: Send OTP
    console.log('\nSTEP 2: Sending OTP');
    try {
      const otpResponse = await axios.post(`${BASE_URL}/auth/send-otp`, {
        phoneNumber: TEST_PHONE
      });
      console.log('✅ OTP Response:', otpResponse.data);
    } catch (otpError) {
      console.log('❌ OTP Error:', otpError.response?.data || otpError.message);
      console.log('📝 Note: This is expected if Twilio credentials are invalid');
      console.log('🔧 In development mode, you can still verify with OTP: 123456');
    }
    
    // Step 3: Verify OTP (This should work with mock OTP)
    console.log('\nSTEP 3: Verifying OTP (Mock)');
    try {
      const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        phoneNumber: TEST_PHONE,
        otp: '123456',
        role: 'resident',
        fcmToken: 'test_fcm_token',
        deviceInfo: {
          deviceId: 'test_device',
          deviceName: 'Test Device',
          deviceType: 'mobile'
        }
      });
      console.log('✅ Verification Success:', verifyResponse.data);
      
      if (verifyResponse.data.accessToken) {
        console.log('🎉 Authentication successful! Access token received.');
        
        // Step 4: Test authenticated endpoint
        console.log('\nSTEP 4: Testing Authenticated Endpoint');
        const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${verifyResponse.data.accessToken}`
          }
        });
        console.log('✅ Profile Response:', profileResponse.data);
      }
      
    } catch (verifyError) {
      console.log('❌ Verification Error:', verifyError.response?.data || verifyError.message);
    }
    
  } catch (error) {
    console.log('❌ Test Failed:', error.message);
  }
}

testAuthentication(); 