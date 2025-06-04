const axios = require('axios');
const { expect } = require('chai');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';
let refreshToken = '';
let userId = '';

// Test data
const testUser = {
    phone: process.env.TEST_PHONE || '+918077759300',
    name: 'Test User',
    email: 'test@example.com'
};

const testSociety = {
    name: 'Test Society',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456'
};

const testVisitor = {
    visitorName: 'Test Visitor',
    visitorPhone: '+919876543210',
    purpose: 'Meeting',
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
};

const testNotice = {
    title: 'Test Notice',
    content: 'This is a test notice',
    priority: 'HIGH',
    type: 'GENERAL'
};

const testEmergency = {
    type: 'FIRE',
    location: 'Block A',
    description: 'Test emergency'
};

async function runTests() {
    console.log('🚀 Starting Backend Validation Tests...\n');

    try {
        // 1. Authentication Flow
        console.log('1️⃣ Testing Authentication Flow');
        
        // Request OTP
        console.log('\n📱 Testing OTP Request');
        try {
            const otpResponse = await axios.post(`${BASE_URL}/auth/send-otp`, {
                phoneNumber: testUser.phone
            });
            console.log('✅ OTP Request successful');
            expect(otpResponse.data.success).to.be.true;
        } catch (error) {
            console.error('❌ OTP Request failed:', error.response?.data || error.message);
            throw error;
        }

        // Verify OTP (using test OTP)
        console.log('\n🔐 Testing OTP Verification');
        try {
            const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
                phoneNumber: testUser.phone,
                otp: process.env.TEST_OTP || '123456'
            });
            authToken = verifyResponse.data.data.accessToken;
            refreshToken = verifyResponse.data.data.refreshToken;
            userId = verifyResponse.data.data.user.id;
            console.log('✅ OTP Verification successful');
            expect(verifyResponse.data.success).to.be.true;
            expect(authToken).to.be.a('string');
        } catch (error) {
            console.error('❌ OTP Verification failed:', error.response?.data || error.message);
            throw error;
        }

        // 2. User Management
        console.log('\n2️⃣ Testing User Management');
        
        // Update Profile
        console.log('\n👤 Testing Profile Update');
        try {
            const updateResponse = await axios.put(
                `${BASE_URL}/users/profile`,
                {
                    name: testUser.name,
                    email: testUser.email
                },
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            console.log('✅ Profile Update successful');
            expect(updateResponse.data.success).to.be.true;
        } catch (error) {
            console.error('❌ Profile Update failed:', error.response?.data || error.message);
            throw error;
        }

        // 3. Society Management
        console.log('\n3️⃣ Testing Society Management');
        
        // Create Society (Admin only)
        console.log('\n🏢 Testing Society Creation');
        let societyId;
        try {
            const societyResponse = await axios.post(
                `${BASE_URL}/societies`,
                testSociety,
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            societyId = societyResponse.data.data.id;
            console.log('✅ Society Creation successful');
            expect(societyResponse.data.success).to.be.true;
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('ℹ️ Society Creation skipped (requires admin rights)');
            } else {
                console.error('❌ Society Creation failed:', error.response?.data || error.message);
                throw error;
            }
        }

        // 4. Visitor Management
        console.log('\n4️⃣ Testing Visitor Management');
        
        // Create Visitor Pass
        console.log('\n🎫 Testing Visitor Pass Creation');
        try {
            const visitorResponse = await axios.post(
                `${BASE_URL}/visitors`,
                testVisitor,
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            console.log('✅ Visitor Pass Creation successful');
            expect(visitorResponse.data.success).to.be.true;
        } catch (error) {
            console.error('❌ Visitor Pass Creation failed:', error.response?.data || error.message);
            throw error;
        }

        // 5. Notice Management
        console.log('\n5️⃣ Testing Notice Management');
        
        // Create Notice
        console.log('\n📢 Testing Notice Creation');
        try {
            const noticeResponse = await axios.post(
                `${BASE_URL}/notices`,
                testNotice,
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            console.log('✅ Notice Creation successful');
            expect(noticeResponse.data.success).to.be.true;
        } catch (error) {
            console.error('❌ Notice Creation failed:', error.response?.data || error.message);
            throw error;
        }

        // 6. Emergency Management
        console.log('\n6️⃣ Testing Emergency Management');
        
        // Create Emergency Alert
        console.log('\n🚨 Testing Emergency Alert Creation');
        try {
            const emergencyResponse = await axios.post(
                `${BASE_URL}/emergencies`,
                testEmergency,
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            console.log('✅ Emergency Alert Creation successful');
            expect(emergencyResponse.data.success).to.be.true;
        } catch (error) {
            console.error('❌ Emergency Alert Creation failed:', error.response?.data || error.message);
            throw error;
        }

        // 7. File Upload
        console.log('\n7️⃣ Testing File Upload');
        
        // Get Upload URL
        console.log('\n📁 Testing Upload URL Generation');
        try {
            const uploadResponse = await axios.post(
                `${BASE_URL}/upload-url`,
                {
                    fileName: 'test.jpg',
                    mimeType: 'image/jpeg',
                    type: 'profile'
                },
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            console.log('✅ Upload URL Generation successful');
            expect(uploadResponse.data.success).to.be.true;
        } catch (error) {
            console.error('❌ Upload URL Generation failed:', error.response?.data || error.message);
            throw error;
        }

        console.log('\n✅ All backend validation tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Backend validation tests failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(console.error); 