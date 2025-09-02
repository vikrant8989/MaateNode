const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
  isProfile: {
    type: Boolean,
    default: false
  },

  // Personal Details
  firstName: {
    type: String,
     trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
     trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  dateOfBirth: {
    type: Date
  },

  // Contact Information
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  // Addresses Array
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
      required: [true, 'Address type is required']
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address is required'],
      trim: true,
      maxlength: [500, 'Full address cannot exceed 500 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^[0-9]{6}$/, 'Pincode must be 6 digits']
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Legacy address fields (for backward compatibility)
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true,
    match: [/^[0-9]{6}$/, 'Pincode must be 6 digits']
  },

  // Profile
  profileImage: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Device and Session
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (!this.firstName && !this.lastName) {
    return 'User'; // Default name for incomplete profiles
  }
  if (!this.firstName) {
    return this.lastName;
  }
  if (!this.lastName) {
    return this.firstName;
  }
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for complete profile
userSchema.virtual('completeProfile').get(function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    phone: this.phone,
    email: this.email,
    dateOfBirth: this.dateOfBirth,
    addresses: this.addresses,
    address: this.address,
    city: this.city,
    state: this.state,
    pincode: this.pincode,
    profileImage: this.profileImage,
    gender: this.gender,
    isVerified: this.isVerified,
    isActive: this.isActive,
    lastActive: this.lastActive,
    createdAt: this.createdAt
  };
});

// Virtual for default address
userSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(addr => addr.isDefault && addr.isActive) || this.addresses.find(addr => addr.isActive) || null;
});

// Virtual for active addresses
userSchema.virtual('activeAddresses').get(function() {
  return this.addresses.filter(addr => addr.isActive);
});

// Method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  console.log('🔍 Verifying OTP:', { inputOTP: otp, storedOTP: this.otp, expiry: this.otpExpiry });
  return this.otp === otp && this.otpExpiry > Date.now();
};

// Method to generate new OTP
userSchema.methods.generateOTP = function() {
  console.log('📱 Generating new OTP for phone:', this.phone);
  this.otp = '123456'; // Hardcoded for now
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return this.save();
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  console.log('🔄 Updating last login for user:', this.phone);
  this.lastActive = new Date();
  return this.save();
};

// Method to mark profile as complete
userSchema.methods.markProfileComplete = function() {
  console.log('✅ Marking profile as complete for user:', this.phone);
  this.isProfile = true;
  return this.save();
};

// Method to add new address
userSchema.methods.addAddress = function(addressData) {
  console.log('📍 Adding new address for user:', this.phone, addressData);
  
  // If this is the first address or user wants to set as default, make it default
  if (this.addresses.length === 0 || addressData.isDefault) {
    // Remove default from all other addresses
    this.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }
  
  const newAddress = {
    type: addressData.type || 'home',
    fullAddress: addressData.fullAddress,
    city: addressData.city,
    pincode: addressData.pincode,
    isDefault: addressData.isDefault || false,
    isActive: true,
    createdAt: new Date()
  };
  
  this.addresses.push(newAddress);
  return this.save();
};

// Method to update address
userSchema.methods.updateAddress = function(addressId, addressData) {
  console.log('✏️ Updating address:', addressId, 'for user:', this.phone);
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  // If setting as default, remove default from others
  if (addressData.isDefault) {
    this.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }
  
  // Update address fields
  Object.keys(addressData).forEach(key => {
    if (key !== '_id' && key !== 'createdAt' && key !== 'isActive') {
      address[key] = addressData[key];
    }
  });
  
  return this.save();
};

// Method to delete address
userSchema.methods.deleteAddress = function(addressId) {
  console.log('🗑️ Deleting address:', addressId, 'for user:', this.phone);
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  // If deleting default address, set another as default
  if (address.isDefault) {
    const otherAddresses = this.addresses.filter(addr => addr._id.toString() !== addressId && addr.isActive);
    if (otherAddresses.length > 0) {
      otherAddresses[0].isDefault = true;
    }
  }
  
  // Soft delete by setting isActive to false
  address.isActive = false;
  
  return this.save();
};

// Method to set default address
userSchema.methods.setDefaultAddress = function(addressId) {
  console.log('⭐ Setting default address:', addressId, 'for user:', this.phone);
  // Remove default from all addresses
  this.addresses.forEach(addr => {
    addr.isDefault = false;
  });
  
  // Set new default
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  address.isDefault = true;
  return this.save();
};

// Method to get address by type
userSchema.methods.getAddressByType = function(type) {
  return this.addresses.find(addr => addr.type === type && addr.isActive);
};

// Method to get addresses by type
userSchema.methods.getAddressesByType = function(type) {
  return this.addresses.filter(addr => addr.type === type && addr.isActive);
};

// Method to update entire profile (including image)
userSchema.methods.updateCompleteProfile = function(profileData, newProfileImage = null) {
  console.log('🔄 Updating complete profile for user:', this.phone);
  
  // Update basic profile fields
  if (profileData.firstName !== undefined) {
    this.firstName = profileData.firstName?.trim();
  }
  
  if (profileData.lastName !== undefined) {
    this.lastName = profileData.lastName?.trim();
  }
  
  if (profileData.dateOfBirth !== undefined) {
    try {
      const parsedDate = new Date(profileData.dateOfBirth);
      
      // Validate the parsed date
      if (isNaN(parsedDate.getTime())) {
        console.log('⚠️ Invalid date format provided, skipping date update');
      } else {
        // Additional validation for reasonable dates
        const currentYear = new Date().getFullYear();
        const birthYear = parsedDate.getFullYear();
        
        if (birthYear >= 1900 && birthYear <= currentYear && parsedDate <= new Date()) {
          this.dateOfBirth = parsedDate;
          console.log('✅ Date of birth updated:', parsedDate);
        } else {
          console.log('⚠️ Date out of reasonable range, skipping date update');
        }
      }
    } catch (dateError) {
      console.log('⚠️ Error parsing date, skipping date update:', dateError.message);
    }
  }
  
  if (profileData.email !== undefined) {
    this.email = profileData.email?.toLowerCase().trim();
  }
  
  if (profileData.address !== undefined) {
    this.address = profileData.address?.trim();
  }
  
  if (profileData.city !== undefined) {
    this.city = profileData.city?.trim();
  }
  
  if (profileData.state !== undefined) {
    this.state = profileData.state?.trim();
  }
  
  if (profileData.pincode !== undefined) {
    this.pincode = profileData.pincode;
  }
  
  if (profileData.gender !== undefined) {
    this.gender = profileData.gender;
  }
  
  // Update profile image if provided
  if (newProfileImage) {
    this.profileImage = newProfileImage;
  }
  
  // Check if profile is now complete (has firstName and lastName)
  if (this.firstName && this.lastName && !this.isProfile) {
    console.log('✅ Profile is now complete, marking isProfile as true');
    this.isProfile = true;
  }
  
  // Update last active timestamp
  this.lastActive = new Date();
  
  return this.save();
};

// Method to get profile update summary
userSchema.methods.getProfileUpdateSummary = function() {
  return {
    basicInfo: {
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      email: this.email,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      address: this.address,
      city: this.city,
      state: this.state,
      pincode: this.pincode
    },
    profileImage: this.profileImage,
    isProfile: this.isProfile,
    lastActive: this.lastActive,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', userSchema); 