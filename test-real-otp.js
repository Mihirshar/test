const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_PHONE = '+918077759300'; // Your real Twilio testing number

class RealOTPTester {
  constructor() {
    this.axios = axios.create({
      baseURL: BASE_URL,
      timeout: 10000
    });
  }

  async log(message, type = 'info') {
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async testRealOTP() {
    console.log('📱 Testing REAL OTP Functionality\n');
    
    try {
      // Test 1: Health Check
      console.log('📋 STEP 1: Health Check');
      const healthResponse = await this.axios.get('/health');
      this.log(`Server: ${healthResponse.data.service} v${healthResponse.data.version}`, 'success');

      // Test 2: Send Real OTP
      console.log('\n📲 STEP 2: Sending REAL OTP');
      this.log(`Sending real OTP to ${TEST_PHONE}...`);
      
      const otpResponse = await this.axios.post('/auth/send-otp', {
        phoneNumber: TEST_PHONE
      });
      
      if (otpResponse.data.success) {
        this.log('✨ REAL OTP SENT SUCCESSFULLY! ✨', 'success');
        this.log('📱 Check your phone for the SMS with OTP code', 'success');
        
        console.log('\n🔐 STEP 3: Instructions for OTP Verification');
        this.log('1. Check your phone (+918077759300) for SMS', 'warning');
        this.log('2. Use the received OTP code in your app/tests', 'warning');
        this.log('3. The OTP is valid for a few minutes', 'warning');
        
        console.log('\n📋 Example API call to verify OTP:');
        console.log(`POST ${BASE_URL}/auth/verify-otp`);
        console.log(JSON.stringify({
          phoneNumber: TEST_PHONE,
          otp: "ENTER_RECEIVED_OTP_HERE", 
          role: "resident",
          fcmToken: "test_fcm_token",
          deviceInfo: {
            deviceId: "test_device",
            deviceName: "Test Device",
            deviceType: "mobile"
          }
        }, null, 2));
        
      } else {
        this.log('Failed to send OTP', 'error');
      }
      
    } catch (error) {
      if (error.response) {
        this.log(`OTP sending failed: ${error.response.data.error || error.response.data.message}`, 'error');
        
        if (error.response.status === 429) {
          this.log('Rate limit reached. Wait a moment and try again.', 'warning');
        }
      } else {
        this.log(`Network error: ${error.message}`, 'error');
      }
    }
  }
}

// Run the real OTP test
const tester = new RealOTPTester();
tester.testRealOTP(); 