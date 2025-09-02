const mongoose = require('mongoose');
const Driver = require('../driver/modal/driver');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const approveDriver = async (phoneNumber) => {
  try {
    console.log('🔍 Looking for driver with phone:', phoneNumber);
    
    const driver = await Driver.findOne({ phone: phoneNumber });
    
    if (!driver) {
      console.log('❌ Driver not found with phone:', phoneNumber);
      return;
    }
    
    console.log('👤 Found driver:', {
      id: driver._id,
      phone: driver.phone,
      firstName: driver.firstName,
      lastName: driver.lastName,
      isApproved: driver.isApproved,
      isRegistrationComplete: driver.isRegistrationComplete
    });
    
    // Approve the driver
    driver.isApproved = true;
    await driver.save();
    
    console.log('✅ Driver approved successfully:', {
      id: driver._id,
      phone: driver.phone,
      isApproved: driver.isApproved
    });
    
  } catch (error) {
    console.error('💥 Error approving driver:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Get phone number from command line argument
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.log('❌ Please provide a phone number as argument');
  console.log('Usage: node approveDriver.js <phone_number>');
  process.exit(1);
}

approveDriver(phoneNumber);
