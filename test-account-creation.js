const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test with your real Twilio number
const TEST_PHONE = '+918077759300';

class AccountCreationTester {
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

  async runTests() {
    console.log('🚀 Testing Account Creation & Profile Management Flow\n');
    
    try {
      // Test 1: Health Check
      await this.testHealthCheck();
      
      // Test 2: Test account creation for different roles
      await this.testAccountCreation();
      
      // Test 3: Test profile completion
      await this.testProfileCompletion();
      
      // Test 4: Test existing account login
      await this.testExistingAccountLogin();
      
      console.log('\n🎉 Account Creation Tests Completed!');
      
    } catch (error) {
      console.error('\n❌ Test Failed:', error.message);
    }
  }

  async testHealthCheck() {
    console.log('📋 TEST 1: Health Check');
    const response = await this.axios.get('/health');
    this.log(`Server: ${response.data.service} v${response.data.version}`, 'success');
  }

  async testAccountCreation() {
    console.log('\n🆕 TEST 2: Account Creation Flow');
    
    const roles = ['resident', 'guard', 'admin'];
    
    for (const role of roles) {
      try {
        this.log(`\n--- Testing ${role.toUpperCase()} Account Creation ---`);
        
        // Step 1: Send OTP
        this.log(`Sending OTP for ${role} account creation...`);
        const otpResponse = await this.axios.post('/auth/send-otp', {
          phoneNumber: TEST_PHONE
        });
        
        if (otpResponse.data.success) {
          this.log('OTP sent successfully', 'success');
        }
        
        // Step 2: Verify OTP and create account
        this.log(`Creating new ${role} account...`);
        const verifyResponse = await this.axios.post('/auth/verify-otp', {
          phoneNumber: TEST_PHONE,
          otp: '123456', // Mock OTP for development
          role: role,
          fcmToken: `test_fcm_${role}_${Date.now()}`,
          deviceInfo: {
            deviceId: `test_device_${role}_${Date.now()}`,
            deviceName: `Test Device ${role}`,
            deviceType: 'mobile',
            platform: 'test',
            version: '1.0.0'
          }
        });

        if (verifyResponse.data.success) {
          const userData = verifyResponse.data.data;
          this.log(`${role} account created/accessed successfully!`, 'success');
          this.log(`User ID: ${userData.user.id}`, 'info');
          this.log(`Phone: ${userData.user.phoneNumber}`, 'info');
          this.log(`Role: ${userData.user.role}`, 'info');
          this.log(`Is New User: ${userData.isNewUser}`, 'info');
          this.log(`Profile Complete: ${userData.user.isProfileComplete}`, 'info');
          
          // Log next steps
          if (userData.nextSteps) {
            this.log('Next Steps Required:', 'warning');
            if (userData.nextSteps.completeProfile) this.log('  - Complete profile (name, etc.)', 'warning');
            if (userData.nextSteps.assignSociety) this.log('  - Assign to society', 'warning');
            if (userData.nextSteps.assignFlat) this.log('  - Assign to flat', 'warning');
          }
          
          // Store token for next tests
          this.authToken = userData.accessToken;
          this.userId = userData.user.id;
        }
        
      } catch (error) {
        if (error.response) {
          this.log(`${role} account creation failed: ${error.response.data.error || error.response.data.message}`, 'error');
        } else {
          this.log(`${role} account creation failed: ${error.message}`, 'error');
        }
      }
    }
  }

  async testProfileCompletion() {
    console.log('\n👤 TEST 3: Profile Completion');
    
    if (!this.authToken) {
      this.log('No auth token available, skipping profile completion test', 'warning');
      return;
    }
    
    try {
      // Get current profile
      this.log('Getting current profile...');
      const profileResponse = await this.axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (profileResponse.data.success) {
        this.log('Current profile retrieved', 'success');
        const currentUser = profileResponse.data.data;
        this.log(`Name: ${currentUser.name || 'Not set'}`, 'info');
        this.log(`Email: ${currentUser.email || 'Not set'}`, 'info');
        this.log(`Society: ${currentUser.societyId || 'Not assigned'}`, 'info');
        this.log(`Flat: ${currentUser.flatId || 'Not assigned'}`, 'info');
      }
      
      // Update profile
      this.log('Updating profile with complete information...');
      const updateData = {
        name: `Test User ${Date.now()}`,
        email: `testuser${Date.now()}@example.com`,
        preferences: {
          notifications: true,
          darkMode: true,
          language: 'en'
        }
      };
      
      const updateResponse = await this.axios.put('/users/profile', updateData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (updateResponse.data.success) {
        this.log('Profile updated successfully!', 'success');
        this.log(`Name set to: ${updateData.name}`, 'success');
        this.log(`Email set to: ${updateData.email}`, 'success');
      }
      
    } catch (error) {
      this.log('Profile completion failed: ' + (error.response?.data?.error || error.message), 'error');
    }
  }

  async testExistingAccountLogin() {
    console.log('\n🔄 TEST 4: Existing Account Login');
    
    try {
      // Try to login with existing account
      this.log('Testing login with existing account...');
      
      // Send OTP
      const otpResponse = await this.axios.post('/auth/send-otp', {
        phoneNumber: TEST_PHONE
      });
      
      if (otpResponse.data.success) {
        this.log('OTP sent to existing account', 'success');
      }
      
      // Verify OTP (should login to existing account)
      const verifyResponse = await this.axios.post('/auth/verify-otp', {
        phoneNumber: TEST_PHONE,
        otp: '123456',
        role: 'resident', // Try with same role
        fcmToken: `existing_account_fcm_${Date.now()}`,
        deviceInfo: {
          deviceId: `existing_device_${Date.now()}`,
          deviceName: 'Existing Test Device',
          deviceType: 'mobile',
          platform: 'test',
          version: '1.0.0'
        }
      });

      if (verifyResponse.data.success) {
        const userData = verifyResponse.data.data;
        this.log('Existing account login successful!', 'success');
        this.log(`User ID: ${userData.user.id}`, 'info');
        this.log(`Is New User: ${userData.isNewUser}`, 'info');
        this.log(`Profile Complete: ${userData.user.isProfileComplete}`, 'info');
        this.log(`Name: ${userData.user.name || 'Not set'}`, 'info');
      }
      
    } catch (error) {
      this.log('Existing account login failed: ' + (error.response?.data?.error || error.message), 'error');
    }
  }
}

// Run the account creation tests
const tester = new AccountCreationTester();
tester.runTests(); 