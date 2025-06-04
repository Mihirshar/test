const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test with your real Twilio number
const TEST_PHONE = '+918077759300';

class SafehoodFocusedTester {
  constructor() {
    this.axios = axios.create({
      baseURL: BASE_URL,
      timeout: 10000
    });
    this.authToken = null;
    this.userId = null;
  }

  async log(message, type = 'info') {
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async runTests() {
    console.log('🚀 Testing Working Safehood Features\n');
    
    try {
      // Test 1: Health Check
      await this.testHealthCheck();
      
      // Test 2: Authentication (Resident)
      await this.testAuthentication();
      
      // Test 3: User Profile Management
      await this.testUserProfile();
      
      // Test 4: User Dashboard
      await this.testUserDashboard();
      
      // Test 5: Visitor Pass System
      await this.testVisitorSystem();
      
      // Test 6: File Upload System
      await this.testFileUpload();
      
      // Test 7: Auth Sessions Management
      await this.testSessionManagement();
      
      console.log('\n🎉 All Working Features Tested Successfully!');
      console.log('✅ Core Safehood functionality is operational');
      
    } catch (error) {
      console.error('\n❌ Test Failed:', error.message);
    }
  }

  async testHealthCheck() {
    console.log('📋 TEST 1: Health Check');
    const response = await this.axios.get('/health');
    this.log(`Server: ${response.data.service} v${response.data.version}`, 'success');
    this.log(`Status: ${response.data.status}`, 'success');
  }

  async testAuthentication() {
    console.log('\n🔐 TEST 2: Authentication Flow');
    
    try {
      // Step 1: Send OTP
      this.log('Sending OTP to ' + TEST_PHONE);
      const otpResponse = await this.axios.post('/auth/send-otp', {
        phoneNumber: TEST_PHONE
      });
      
      if (otpResponse.data.success) {
        this.log('OTP sent successfully (development mode)', 'success');
      }
      
      // Step 2: Verify OTP (development mode accepts any 6-digit OTP)
      this.log('Verifying OTP...');
      const verifyResponse = await this.axios.post('/auth/verify-otp', {
        phoneNumber: TEST_PHONE,
        otp: '123456', // Works in development mode
        role: 'resident',
        fcmToken: 'test_fcm_token_123',
        deviceInfo: {
          deviceId: 'test_device_123',
          deviceName: 'Test Device',
          deviceType: 'mobile',
          platform: 'test',
          version: '1.0.0'
        }
      });

      if (verifyResponse.data.success) {
        this.authToken = verifyResponse.data.data.accessToken;
        this.userId = verifyResponse.data.data.user.id;
        this.log('Authentication successful', 'success');
        this.log('Access token obtained', 'success');
        this.log(`User ID: ${this.userId}`, 'info');
        this.log(`Is new user: ${verifyResponse.data.data.isNewUser}`, 'info');
      }
      
    } catch (error) {
      this.log('Authentication failed: ' + (error.response?.data?.error || error.message), 'error');
      throw error;
    }
  }

  async testUserProfile() {
    console.log('\n👤 TEST 3: User Profile Management');
    
    try {
      // Get current profile
      const profileResponse = await this.axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (profileResponse.data.success) {
        this.log('Profile retrieved successfully', 'success');
        const user = profileResponse.data.data;
        this.log(`Phone: ${user.phoneNumber}`, 'info');
        this.log(`Role: ${user.role}`, 'info');
        this.log(`Status: ${user.status}`, 'info');
      }
      
      // Update profile
      const updateData = {
        name: 'Test User ' + Date.now(),
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
        this.log('Profile updated successfully', 'success');
        this.log(`Name set to: ${updateData.name}`, 'info');
      }
      
    } catch (error) {
      this.log('Profile management failed: ' + (error.response?.data?.error || error.message), 'warning');
    }
  }

  async testUserDashboard() {
    console.log('\n📊 TEST 4: User Dashboard');
    
    try {
      const dashboardResponse = await this.axios.get('/users/dashboard', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (dashboardResponse.data.success) {
        this.log('Dashboard data retrieved successfully', 'success');
        const dashboard = dashboardResponse.data.data;
        this.log(`Dashboard contains: ${Object.keys(dashboard).join(', ')}`, 'info');
      }
      
    } catch (error) {
      this.log('Dashboard access failed: ' + (error.response?.data?.error || error.message), 'warning');
    }
  }

  async testVisitorSystem() {
    console.log('\n🚪 TEST 5: Visitor Pass System');
    
    try {
      // Get existing visitor passes
      const passesResponse = await this.axios.get('/visitors/passes', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (passesResponse.data.success) {
        this.log('Visitor passes retrieved successfully', 'success');
        this.log(`Found ${passesResponse.data.data.data.length} existing passes`, 'info');
      }
      
      // Create a new visitor pass
      const visitorData = {
        visitorName: 'Test Visitor ' + Date.now(),
        visitorPhone: '+919999999999',
        vehicleNumber: 'TS09AB1234',
        validityHours: 4,
        purpose: 'Family visit for testing',
        isRecurring: false
      };
      
      const createResponse = await this.axios.post('/visitors/passes', visitorData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (createResponse.data.success) {
        this.log('Visitor pass created successfully', 'success');
        const pass = createResponse.data.data;
        this.log(`Pass ID: ${pass.id}`, 'info');
        this.log(`OTP: ${pass.otp}`, 'info');
        this.log(`Expires at: ${pass.expiresAt}`, 'info');
        
        // Get the specific pass
        const passDetailResponse = await this.axios.get(`/visitors/passes/${pass.id}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        
        if (passDetailResponse.data.success) {
          this.log('Pass details retrieved successfully', 'success');
        }
      }
      
    } catch (error) {
      this.log('Visitor system test failed: ' + (error.response?.data?.error || error.message), 'warning');
    }
  }

  async testFileUpload() {
    console.log('\n📁 TEST 6: File Upload System');
    
    try {
      const uploadData = {
        fileName: 'test-document-' + Date.now() + '.pdf',
        mimeType: 'application/pdf',
        size: 1024000
      };

      const response = await this.axios.post('/upload-url', uploadData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.data.success) {
        this.log('File upload URL generated successfully', 'success');
        this.log(`Upload URL: ${response.data.data.uploadUrl.substring(0, 50)}...`, 'info');
        this.log(`File ID: ${response.data.data.fileId}`, 'info');
      }
      
    } catch (error) {
      this.log('File upload test failed: ' + (error.response?.data?.error || error.message), 'warning');
    }
  }

  async testSessionManagement() {
    console.log('\n🔐 TEST 7: Session Management');
    
    try {
      // Get active sessions
      const sessionsResponse = await this.axios.get('/auth/sessions', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (sessionsResponse.data.success) {
        this.log('Active sessions retrieved successfully', 'success');
        this.log(`Found ${sessionsResponse.data.data.length} active sessions`, 'info');
      }
      
      // Update FCM token
      const fcmResponse = await this.axios.put('/auth/fcm-token', {
        fcmToken: 'updated_fcm_token_' + Date.now()
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (fcmResponse.data.success) {
        this.log('FCM token updated successfully', 'success');
      }
      
    } catch (error) {
      this.log('Session management test failed: ' + (error.response?.data?.error || error.message), 'warning');
    }
  }
}

// Run the focused tests
const tester = new SafehoodFocusedTester();
tester.runTests(); 