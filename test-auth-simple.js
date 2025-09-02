const axios = require('axios');

const API_BASE = 'https://api.mangiee.com/api';

async function testAuthEndpoint() {
  console.log('🧪 Testing Updated Auth Endpoint (Phone Only)\n');

  try {
    // Test 1: Send OTP with just phone number
    console.log('📱 Test 1: Sending OTP with phone number only');
    const sendOTPResponse = await axios.post(`${API_BASE}/user/auth`, {
      phone: '9876543210'
    });
    
    console.log('✅ Send OTP Response:', {
      success: sendOTPResponse.data.success,
      message: sendOTPResponse.data.message,
      isNewUser: sendOTPResponse.data.data?.isNewUser,
      needsProfileCompletion: sendOTPResponse.data.data?.needsProfileCompletion
    });

    // Test 2: Verify OTP
    console.log('\n🔐 Test 2: Verifying OTP');
    const verifyOTPResponse = await axios.post(`${API_BASE}/user/auth`, {
      phone: '9876543210',
      otp: '123456'
    });
    
    console.log('✅ Verify OTP Response:', {
      success: verifyOTPResponse.data.success,
      message: verifyOTPResponse.data.message,
      isNewUser: verifyOTPResponse.data.data?.isNewUser,
      needsProfileCompletion: verifyOTPResponse.data.data?.needsProfileCompletion,
      hasToken: !!verifyOTPResponse.data.data?.token,
      userPhone: verifyOTPResponse.data.data?.user?.phone
    });

    // Test 3: Try to send OTP to same number again (should work for existing user)
    console.log('\n📱 Test 3: Sending OTP to existing user');
    const resendOTPResponse = await axios.post(`${API_BASE}/user/auth`, {
      phone: '9876543210'
    });
    
    console.log('✅ Resend OTP Response:', {
      success: resendOTPResponse.data.success,
      message: resendOTPResponse.data.message,
      isNewUser: resendOTPResponse.data.data?.isNewUser,
      needsProfileCompletion: resendOTPResponse.data.data?.needsProfileCompletion
    });

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Auth endpoint now only requires phone number initially');
    console.log('- OTP is automatically set to 123456');
    console.log('- User details (firstName, lastName) are collected later during profile creation');
    console.log('- The system uses isProfile field to determine user routing');
    console.log('- If isProfile is false → user goes to personal info screen');
    console.log('- If isProfile is true → user goes to dashboard');
    console.log('- Profile completion automatically sets isProfile to true');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAuthEndpoint();
