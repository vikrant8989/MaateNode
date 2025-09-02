const axios = require('axios');

const BASE_URL = 'https://api.mangiee.com/api/user';

// Test data
const testUser = {
  phone: '9876543210',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com'
};

const hardcodedOTP = '123456';

async function testUserAPI() {
  console.log('🧪 Testing User API...\n');

  try {
    // Test 1: Send OTP (new user registration)
    console.log('📱 Test 1: Sending OTP for new user registration');
    const otpResponse = await axios.post(`${BASE_URL}/auth`, {
      phone: testUser.phone,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email
    });
    
    console.log('✅ OTP Response:', otpResponse.data);
    console.log('');

    // Test 2: Verify OTP and login
    console.log('🔍 Test 2: Verifying OTP and logging in');
    const loginResponse = await axios.post(`${BASE_URL}/auth`, {
      phone: testUser.phone,
      otp: hardcodedOTP
    });
    
    console.log('✅ Login Response:', loginResponse.data);
    const token = loginResponse.data.data.token;
    console.log('');

    // Test 3: Get user profile (authenticated)
    console.log('👤 Test 3: Getting user profile (authenticated)');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profile Response:', profileResponse.data);
    console.log('');

    // Test 4: Update user profile
    console.log('✏️ Test 4: Updating user profile');
    const updateResponse = await axios.put(`${BASE_URL}/profile`, {
      gender: 'male',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Update Response:', updateResponse.data);
    console.log('');

    // Test 5: Get dashboard
    console.log('📊 Test 5: Getting user dashboard');
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Dashboard Response:', dashboardResponse.data);
    console.log('');

    // Test 6: Logout
    console.log('🚪 Test 6: Logging out');
    const logoutResponse = await axios.post(`${BASE_URL}/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Logout Response:', logoutResponse.data);
    console.log('');

    console.log('🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testUserAPI();
}

module.exports = { testUserAPI };
