const axios = require('axios');

// Test script to debug Twilio configuration
console.log('🔍 Debugging Twilio Configuration\n');

// Check environment variables (from the running process perspective)
console.log('📋 Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET (length: ' + process.env.TWILIO_ACCOUNT_SID.length + ')' : 'NOT SET');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET (length: ' + process.env.TWILIO_AUTH_TOKEN.length + ')' : 'NOT SET');
console.log('TWILIO_VERIFY_SERVICE_SID:', process.env.TWILIO_VERIFY_SERVICE_SID ? 'SET (length: ' + process.env.TWILIO_VERIFY_SERVICE_SID.length + ')' : 'NOT SET');

// Try a simple API call to check server connectivity
const testServerConnection = async () => {
  try {
    console.log('\n🌐 Testing Server Connection...');
    const response = await axios.get('http://localhost:3000/api/v1/health', { timeout: 5000 });
    console.log('✅ Server is responding:', response.data.service);
    
    // Let's also try to get some debug info from the server if there's an endpoint
    try {
      const configResponse = await axios.get('http://localhost:3000/api/v1/health', { timeout: 5000 });
      console.log('✅ Health check successful');
    } catch (configError) {
      console.log('ℹ️ No debug endpoint available');
    }
    
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
  }
};

testServerConnection(); 