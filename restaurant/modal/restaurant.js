const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  // Authentication
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  otp: {
    type: String,
    default: '1234' // Hardcoded OTP for now
  },
  otpExpiry: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Personal Details
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },

  // Business Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  pinCode: {
    type: String,
    required: [true, 'Pin code is required'],
    trim: true,
    match: [/^[0-9]{6}$/, 'Pin code must be 6 digits']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Veg', 'Non Veg', 'Mix'],
    default: 'Veg'
  },
  specialization: {
    type: String,
    trim: true,
    maxlength: [500, 'Specialization cannot exceed 500 characters']
  },

  // Bank Details
  bankName: {
    type: String,
    trim: true
  },
  bankBranch: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  accountHolder: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  customerId: {
    type: String,
    trim: true
  },
  bankPhoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },

  // Document Uploads
  profileImage: {
    type: String
  },
  messImages: [{
    type: String
  }],
  qrCode: {
    type: String
  },
  passbook: {
    type: String
  },
  aadharCard: {
    type: String
  },
  panCard: {
    type: String
  },

  // Admin Verification
  isActive: {
    type: Boolean,
    default: false // Restaurant starts as inactive until admin approves
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },

  // Status and Activity
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  isProfile: {
    type: Boolean,
    default: false // Track if profile is completed
  },
  isOnline: {
    type: Boolean,
    default: false // Track if restaurant is online/offline
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
restaurantSchema.index({ phone: 1 });
restaurantSchema.index({ email: 1 });
restaurantSchema.index({ status: 1 });

// Virtual for complete profile
restaurantSchema.virtual('completeProfile').get(function() {
  return {
    id: this._id,
    phone: this.phone,
    firstName: this.firstName,
    lastName: this.lastName,
    dateOfBirth: this.dateOfBirth,
    businessName: this.businessName,
    email: this.email,
    address: this.address,
    city: this.city,
    pinCode: this.pinCode,
    state: this.state,
    category: this.category,
    specialization: this.specialization,
    bankDetails: {
      bankPhoneNumber: this.bankPhoneNumber, // Use the actual bank phone number field
      bankName: this.bankName,
      bankBranch: this.bankBranch,
      accountNumber: this.accountNumber,
      accountHolder: this.accountHolder,
      ifscCode: this.ifscCode,
      customerId: this.customerId
    },
    documents: {
      profileImage: this.profileImage,
      messImages: this.messImages,
      qrCode: this.qrCode,
      passbook: this.passbook,
      aadharCard: this.aadharCard,
      panCard: this.panCard
    },
    status: this.status,
    isActive: this.isActive,
    isApproved: this.isApproved,
    isVerified: this.isVerified,
    isProfile: this.isProfile,
    isOnline: this.isOnline,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
});

// Method to verify OTP
restaurantSchema.methods.verifyOTP = function(otp) {
  return this.otp === otp && this.otpExpiry > Date.now();
};

// Method to generate new OTP
restaurantSchema.methods.generateOTP = function() {
  this.otp = '1234'; // Hardcoded for now
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return this.save();
};

// Method to update last login
restaurantSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to approve restaurant
restaurantSchema.methods.approve = function(adminId) {
  this.isActive = true;
  this.isApproved = true;
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  return this.save();
};

// Method to reject restaurant
restaurantSchema.methods.reject = function(adminId, reason) {
  this.isActive = false;
  this.isApproved = false;
  this.status = 'rejected';
  this.rejectionReason = reason;
  return this.save();
};

// Method to toggle online/offline status
restaurantSchema.methods.toggleOnlineStatus = function() {
  this.isOnline = !this.isOnline;
  return this.save();
};

module.exports = mongoose.model('Restaurant', restaurantSchema); 