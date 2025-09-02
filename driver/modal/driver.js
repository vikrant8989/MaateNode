const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  // Authentication
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  otp: {
    type: String,
    default: '123456' // Hardcoded OTP for now
  },
  otpExpiry: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Registration Progress
  registrationStep: {
    type: Number,
    default: 1,
    enum: [1, 2, 3, 4, 5, 6, 7] // 1=Personal, 2=Bank, 3=Aadhar, 4=DL, 5=Vehicle, 6=Documents, 7=Complete
  },
  isRegistrationComplete: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Step 1: Personal Details (from first image)
  profileImage: {
    type: String // S3 URL for profile image
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  dob: {
    type: Date
  },
  state: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },

  // Step 2: Bank Details (from second image)
  bankName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  branch: {
    type: String,
    trim: true
  },
  passbookImage: {
    type: String // S3 URL for passbook image
  },
  panCardImage: {
    type: String // S3 URL for PAN card image
  },

  // Step 3: Aadhar Verification (from third image)
  aadharNumber: {
    type: String,
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    trim: true,
    enum: ['Male', 'Female', 'Other']
  },
  aadharFrontImage: {
    type: String // S3 URL for Aadhar front image
  },
  aadharBackImage: {
    type: String // S3 URL for Aadhar back image
  },

  // Step 4: Driving License Details and Images
  dlNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  dlFullName: {
    type: String,
    trim: true
  },
  dlDateOfIssue: {
    type: Date
  },
  dlDateOfExpiry: {
    type: Date
  },
  dlIssuingAuthority: {
    type: String,
    trim: true
  },
  dlAddress: {
    type: String,
    trim: true
  },
  dlFrontImage: {
    type: String // S3 URL for driving license front image
  },
  dlBackImage: {
    type: String // S3 URL for driving license back image
  },

  // Step 5: Vehicle Details (from fifth image)
  vehicleNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  vehicleOwnerName: {
    type: String,
    trim: true
  },
  vehicleType: {
    type: String,
    trim: true
  },
  vehicleRegistrationDate: {
    type: Date
  },
  rcFrontImage: {
    type: String // S3 URL for RC front image
  },
  rcBackImage: {
    type: String // S3 URL for RC back image
  },

  // Online/Offline Status
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
driverSchema.index({ phone: 1 });
driverSchema.index({ isOnline: 1 });

// Method to verify OTP
driverSchema.methods.verifyOTP = function(otp) {
  console.log('🔐 DRIVER MODEL - verifyOTP called:', { 
    driverId: this._id, 
    phone: this.phone, 
    inputOtp: otp, 
    storedOtp: this.otp, 
    otpExpiry: this.otpExpiry,
    currentTime: new Date()
  });
  
  const isValid = this.otp === otp && this.otpExpiry > Date.now();
  console.log('🔐 DRIVER MODEL - OTP verification result:', { isValid, otpMatch: this.otp === otp, notExpired: this.otpExpiry > Date.now() });
  
  return isValid;
};

// Method to generate new OTP
driverSchema.methods.generateOTP = function() {
  console.log('🔐 DRIVER MODEL - generateOTP called for driver:', { id: this._id, phone: this.phone });
  
  this.otp = '123456'; // Hardcoded for now
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  console.log('🔐 DRIVER MODEL - OTP generated:', { 
    otp: this.otp, 
    expiry: this.otpExpiry,
    expiryTime: new Date(Date.now() + 10 * 60 * 1000)
  });
  
  return this.save().then(() => {
    console.log('🔐 DRIVER MODEL - OTP saved successfully');
    return this;
  }).catch((error) => {
    console.error('🔐 DRIVER MODEL - Error saving OTP:', error);
    throw error;
  });
};

// Method to update registration step
driverSchema.methods.updateRegistrationStep = function(step) {
  console.log('📝 DRIVER MODEL - updateRegistrationStep called:', { 
    driverId: this._id, 
    phone: this.phone, 
    currentStep: this.registrationStep, 
    newStep: step 
  });
  
  this.registrationStep = step;
  if (step === 7) {
    this.isRegistrationComplete = true;
    console.log('✅ DRIVER MODEL - Registration marked as complete');
  }
  
  console.log('📝 DRIVER MODEL - Updated registration step:', { 
    registrationStep: this.registrationStep, 
    isRegistrationComplete: this.isRegistrationComplete 
  });
  
  return this.save().then(() => {
    console.log('📝 DRIVER MODEL - Registration step saved successfully');
  return this;
  }).catch((error) => {
    console.error('📝 DRIVER MODEL - Error saving registration step:', error);
    throw error;
  });
};

// Method to update online status
driverSchema.methods.updateOnlineStatus = function(isOnline) {
  console.log('🌐 DRIVER MODEL - updateOnlineStatus called:', { 
    driverId: this._id, 
    phone: this.phone, 
    currentStatus: this.isOnline, 
    newStatus: isOnline 
  });
  
  this.isOnline = isOnline;
  this.lastActive = new Date();
  
  console.log('🌐 DRIVER MODEL - Updated online status:', { 
    isOnline: this.isOnline, 
    lastActive: this.lastActive 
  });
  
  return this.save().then(() => {
    console.log('🌐 DRIVER MODEL - Online status saved successfully');
    return this;
  }).catch((error) => {
    console.error('🌐 DRIVER MODEL - Error saving online status:', error);
    throw error;
  });
};

// Method to approve driver
driverSchema.methods.approveDriver = function() {
  console.log('✅ DRIVER MODEL - approveDriver called for driver:', { id: this._id, phone: this.phone });
  
  this.isApproved = true;
  
  console.log('✅ DRIVER MODEL - Driver approved:', { isApproved: this.isApproved });
  
  return this.save().then(() => {
    console.log('✅ DRIVER MODEL - Driver approval saved successfully');
    return this;
  }).catch((error) => {
    console.error('✅ DRIVER MODEL - Error saving driver approval:', error);
    throw error;
  });
};

// Method to deactivate driver
driverSchema.methods.deactivateDriver = function() {
  console.log('❌ DRIVER MODEL - deactivateDriver called for driver:', { id: this._id, phone: this.phone });
  
  this.isApproved = false;
  this.isOnline = false;
  
  console.log('❌ DRIVER MODEL - Driver deactivated:', { 
    isApproved: this.isApproved, 
    isOnline: this.isOnline 
  });
  
  return this.save().then(() => {
    console.log('❌ DRIVER MODEL - Driver deactivation saved successfully');
  return this;
  }).catch((error) => {
    console.error('❌ DRIVER MODEL - Error saving driver deactivation:', error);
    throw error;
  });
};

// Method to cleanup S3 images before deletion
driverSchema.methods.cleanupS3Images = async function() {
  console.log('🗑️ DRIVER MODEL - cleanupS3Images called for driver:', { id: this._id, phone: this.phone });
  
  try {
    const { deleteFromS3 } = require('../../utils/s3Utils');
    const imagesToDelete = [
      this.profileImage,
      this.passbookImage,
      this.panCardImage,
      this.aadharFrontImage,
      this.aadharBackImage,
      this.dlFrontImage,
      this.dlBackImage,
      this.rcFrontImage,
      this.rcBackImage
    ].filter(Boolean); // Remove undefined/null values

    if (imagesToDelete.length > 0) {
      console.log('🗑️ DRIVER MODEL - Found images to delete:', imagesToDelete.length);
      await Promise.allSettled(imagesToDelete.map(imageUrl => deleteFromS3(imageUrl)));
      console.log('✅ DRIVER MODEL - S3 cleanup completed');
    } else {
      console.log('ℹ️ DRIVER MODEL - No images to clean up');
    }
  } catch (error) {
    console.error('❌ DRIVER MODEL - Error during S3 cleanup:', error);
    throw error;
  }
};

// Pre-save middleware to log changes
driverSchema.pre('save', function(next) {
  console.log('💾 DRIVER MODEL - Pre-save middleware triggered for driver:', { 
    id: this._id, 
    phone: this.phone,
    isNew: this.isNew,
    modifiedPaths: this.modifiedPaths()
  });
  next();
});

// Post-save middleware to log successful saves
driverSchema.post('save', function(doc) {
  console.log('💾 DRIVER MODEL - Post-save middleware - Driver saved successfully:', { 
    id: doc._id, 
    phone: doc.phone,
    isVerified: doc.isVerified,
    isRegistrationComplete: doc.isRegistrationComplete,
    isApproved: doc.isApproved,
    isOnline: doc.isOnline
  });
});

module.exports = mongoose.model('Driver', driverSchema); 