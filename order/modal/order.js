const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item ID is required']
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  image: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  itemTotal: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Calculate item total
orderItemSchema.pre('save', function(next) {
  this.itemTotal = this.price * this.quantity;
  next();
});

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true,
    trim: true
  },
  orderDate: {
    type: Date,
    required: [true, 'Order date is required'],
    default: Date.now
  },

  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },

  // Restaurant Information
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant is required']
  },
  restaurantName: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot exceed 100 characters']
  },

  // Order Items
  items: [orderItemSchema],

  // Pricing Information
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },

  // Delivery Information
  deliveryAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters']
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    }
  },

  // Time Information
  estimatedDelivery: {
    type: String,
    required: [true, 'Estimated delivery time is required'],
    default: 'N/A'
  },
  orderTime: {
    type: Date,
    required: [true, 'Order time is required'],
    default: Date.now
  },

  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // Tracking Information (Set to N/A as requested)
  trackingStatus: {
    type: String,
    default: 'N/A'
  },
  driverName: {
    type: String,
    default: 'N/A'
  },
  driverPhone: {
    type: String,
    default: 'N/A'
  },
  currentLocation: {
    type: String,
    default: 'N/A'
  },

  // Payment Information (Set to N/A as requested)
  paymentMethod: {
    type: String,
    default: 'N/A'
  },
  paymentStatus: {
    type: String,
    default: 'N/A'
  },
  transactionId: {
    type: String,
    default: 'N/A'
  },

  // Order Details
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Special instructions cannot exceed 500 characters']
  },

  // Cancellation Information
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  cancelledBy: {
    type: String,
    enum: ['customer', 'restaurant', 'system']
  },
  cancellationTime: {
    type: Date
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ customer: 1, orderDate: -1 });
orderSchema.index({ restaurant: 1, orderDate: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to calculate order totals
orderSchema.methods.calculateTotals = function() {
  console.log('📦 [ORDER_MODEL] Calculating totals for order:', this._id);
  
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => {
    const itemTotal = item.itemTotal || (item.price * item.quantity);
    console.log('📦 [ORDER_MODEL] Item total calculation:', {
      itemName: item.name,
      price: item.price,
      quantity: item.quantity,
      itemTotal: itemTotal
    });
    return sum + itemTotal;
  }, 0);
  
  // Total is same as subtotal (no delivery fee for now)
  this.totalAmount = this.subtotal;
  
  console.log('📦 [ORDER_MODEL] Order totals calculated:', {
    subtotal: this.subtotal,
    totalAmount: this.totalAmount
  });
  
  return {
    subtotal: this.subtotal,
    totalAmount: this.totalAmount
  };
};

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus) {
  console.log('📦 [ORDER_MODEL] Updating order status:', {
    orderId: this._id,
    oldStatus: this.status,
    newStatus: newStatus
  });
  
  this.status = newStatus;
  this.updatedAt = new Date();
  
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancelOrder = function(reason, cancelledBy) {
  console.log('📦 [ORDER_MODEL] Cancelling order:', {
    orderId: this._id,
    reason: reason,
    cancelledBy: cancelledBy
  });
  
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  this.cancellationTime = new Date();
  this.updatedAt = new Date();
  
  return this.save();
};

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  console.log('📦 [ORDER_MODEL] Pre-save middleware triggered');
  console.log('📦 [ORDER_MODEL] Current values before calculation:', {
    subtotal: this.subtotal,
    totalAmount: this.totalAmount,
    itemsCount: this.items.length
  });
  
  // Only calculate totals if they are not already set or if items are modified
  if (this.subtotal === undefined || this.totalAmount === undefined || this.isModified('items')) {
    console.log('📦 [ORDER_MODEL] Calculating totals in pre-save middleware');
    this.calculateTotals();
  } else {
    console.log('📦 [ORDER_MODEL] Totals already set, skipping calculation');
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  console.log('📦 [ORDER_MODEL] Pre-save completed with final values:', {
    subtotal: this.subtotal,
    totalAmount: this.totalAmount
  });
  
  next();
});

// Generate unique order number
orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp.slice(-6)}${random}`;
};

module.exports = mongoose.model('Order', orderSchema);
