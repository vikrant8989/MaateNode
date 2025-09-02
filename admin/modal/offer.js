const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Offer title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Offer description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Visual Elements
  backgroundColor: {
    type: String,
    default: '#FFFFFF',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Background color must be a valid hex color code'
    }
  },
  
  image: {
    type: String,
    required: [true, 'Offer image is required']
  },
  
  // Coupon Details
  couponCode: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Coupon code can only contain uppercase letters and numbers']
  },
  
  // Value and Discount
  maximumOrderValue: {
    type: Number,
    required: [true, 'Maximum order value is required'],
    min: [0, 'Maximum order value cannot be negative']
  },
  
  discountType: {
    type: String,
    enum: ['flat', 'percentage'],
    required: [true, 'Discount type is required']
  },
  
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  
  // Validation: If percentage, discount cannot exceed 100%
  validate: {
    validator: function() {
      if (this.discountType === 'percentage' && this.discountValue > 100) {
        return false;
      }
      return true;
    },
    message: 'Percentage discount cannot exceed 100%'
  },
  
  // Time Constraints
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(endDate) {
        return endDate > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  
  // Usage Limits
  perUserLimit: {
    type: Number,
    required: [true, 'Per user limit is required'],
    min: [1, 'Per user limit must be at least 1'],
    default: 1
  },
  
  totalUsageLimit: {
    type: Number,
    required: [true, 'Total usage limit is required'],
    min: [1, 'Total usage limit must be at least 1']
  },
  
  // Usage Tracking
  totalUsed: {
    type: Number,
    default: 0,
    min: [0, 'Total used cannot be negative']
  },
  
  userUsage: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative']
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status and Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Restaurant Association
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  
  // Categories and Items (optional targeting)
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }],
  
  // Minimum order amount
  minimumOrderAmount: {
    type: Number,
    required: [true, 'Minimum order amount is required'],
    min: [0, 'Minimum order amount cannot be negative']
  },
  
  // Priority (for multiple offers)
  priority: {
    type: Number,
    default: 1,
    min: [1, 'Priority must be at least 1']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
offerSchema.index({ couponCode: 1 });
offerSchema.index({ restaurantId: 1 });
offerSchema.index({ isActive: 1 });
offerSchema.index({ isVisible: 1 });
offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ 'userUsage.userId': 1 });

// Virtual for checking if offer is currently valid
offerSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.isVisible && 
         now >= this.startDate && 
         now <= this.endDate && 
         this.totalUsed < this.totalUsageLimit;
});

// Virtual for remaining usage
offerSchema.virtual('remainingUsage').get(function() {
  return Math.max(0, this.totalUsageLimit - this.totalUsed);
});

// Virtual for discount amount calculation
offerSchema.virtual('discountAmount').get(function() {
  if (this.discountType === 'flat') {
    return this.discountValue;
  } else if (this.discountType === 'percentage') {
    return (this.maximumOrderValue * this.discountValue) / 100;
  }
  return 0;
});

// Method to check if user can use this offer
offerSchema.methods.canUserUseOffer = function(userId) {
  // Check if offer is valid
  if (!this.isValid) {
    return { canUse: false, reason: 'Offer is not valid' };
  }
  
  // Check total usage limit
  if (this.totalUsed >= this.totalUsageLimit) {
    return { canUse: false, reason: 'Offer usage limit reached' };
  }
  
  // Check per user limit
  const userUsage = this.userUsage.find(usage => usage.userId.toString() === userId.toString());
  if (userUsage && userUsage.usageCount >= this.perUserLimit) {
    return { canUse: false, reason: 'User usage limit reached' };
  }
  
  return { canUse: true, reason: 'Offer can be used' };
};

// Method to record offer usage
offerSchema.methods.recordUsage = function(userId) {
  // Check if user can use the offer
  const usageCheck = this.canUserUseOffer(userId);
  if (!usageCheck.canUse) {
    throw new Error(usageCheck.reason);
  }
  
  // Update total usage
  this.totalUsed += 1;
  
  // Update user usage
  let userUsage = this.userUsage.find(usage => usage.userId.toString() === userId.toString());
  if (userUsage) {
    userUsage.usageCount += 1;
    userUsage.lastUsed = new Date();
  } else {
    this.userUsage.push({
      userId: userId,
      usageCount: 1,
      lastUsed: new Date()
    });
  }
  
  return this.save();
};

// Method to validate order for offer
offerSchema.methods.validateOrder = function(orderAmount, orderItems = []) {
  // Check minimum order amount
  if (orderAmount < this.minimumOrderAmount) {
    return { 
      isValid: false, 
      reason: `Minimum order amount required: ₹${this.minimumOrderAmount}` 
    };
  }
  
  // Check maximum order value
  if (orderAmount > this.maximumOrderValue) {
    return { 
      isValid: false, 
      reason: `Maximum order value exceeded: ₹${this.maximumOrderValue}` 
    };
  }
  
  // Check if items are applicable (if specified)
  if (this.applicableItems.length > 0 || this.applicableCategories.length > 0) {
    const hasApplicableItems = orderItems.some(item => {
      return this.applicableItems.includes(item.itemId) || 
             this.applicableCategories.includes(item.categoryId);
    });
    
    if (!hasApplicableItems) {
      return { 
        isValid: false, 
        reason: 'No applicable items in order for this offer' 
      };
    }
  }
  
  return { isValid: true, reason: 'Order is valid for this offer' };
};

// Method to calculate final discount
offerSchema.methods.calculateDiscount = function(orderAmount) {
  if (this.discountType === 'flat') {
    return Math.min(this.discountValue, orderAmount);
  } else if (this.discountType === 'percentage') {
    const discountAmount = (orderAmount * this.discountValue) / 100;
    return Math.min(discountAmount, orderAmount);
  }
  return 0;
};

// Pre-save middleware to ensure end date is after start date
offerSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Offer', offerSchema);
