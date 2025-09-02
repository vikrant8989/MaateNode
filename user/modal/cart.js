const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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
    min: [1, 'Quantity must be at least 1'],
    default: 1
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
cartItemSchema.pre('save', function(next) {
  if (this.price !== undefined && this.quantity !== undefined) {
    this.itemTotal = this.price * this.quantity;
  }
  next();
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required'],
    index: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
cartSchema.index({ userId: 1, restaurantId: 1 });

// Virtual for cart summary
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to calculate cart totals
cartSchema.methods.calculateTotals = function() {
  console.log('🛒 [CART_MODEL] Calculating totals for cart:', this._id);
  
  // Calculate subtotal from items with safety checks
  this.subtotal = this.items.reduce((sum, item) => {
    const itemTotal = item.itemTotal || (item.price * item.quantity) || 0;
    console.log('🛒 [CART_MODEL] Item total calculation:', {
      itemName: item.name,
      price: item.price,
      quantity: item.quantity,
      itemTotal: itemTotal
    });
    return sum + itemTotal;
  }, 0);
  
  // Total is same as subtotal (no delivery fee)
  this.total = this.subtotal;
  
  console.log('🛒 [CART_MODEL] Cart totals calculated:', {
    subtotal: this.subtotal,
    total: this.total
  });
  
  return {
    subtotal: this.subtotal,
    total: this.total
  };
};

// Method to add item to cart
cartSchema.methods.addItem = function(itemData) {
  console.log('🛒 [CART_MODEL] Adding item to cart:', {
    cartId: this._id,
    itemData: {
      name: itemData.name,
      price: itemData.price,
      quantity: itemData.quantity
    }
  });
  
  // Check if item already exists
  const existingItemIndex = this.items.findIndex(item => 
    item.itemId.toString() === itemData.itemId.toString()
  );
  
  if (existingItemIndex !== -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += itemData.quantity;
    // Recalculate itemTotal for existing item
    this.items[existingItemIndex].itemTotal = this.items[existingItemIndex].price * this.items[existingItemIndex].quantity;
    console.log('🛒 [CART_MODEL] Updated existing item quantity:', {
      itemName: this.items[existingItemIndex].name,
      newQuantity: this.items[existingItemIndex].quantity,
      newItemTotal: this.items[existingItemIndex].itemTotal
    });
  } else {
    // Add new item with calculated itemTotal
    const newItem = {
      itemId: itemData.itemId,
      name: itemData.name,
      description: itemData.description,
      price: itemData.price,
      quantity: itemData.quantity,
      image: itemData.image,
      category: itemData.category,
      itemTotal: itemData.price * itemData.quantity // Calculate itemTotal here
    };
    this.items.push(newItem);
    console.log('🛒 [CART_MODEL] Added new item to cart:', {
      name: itemData.name,
      itemTotal: newItem.itemTotal
    });
  }
  
  // Recalculate totals
  this.calculateTotals();
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, newQuantity) {
  console.log('🛒 [CART_MODEL] Updating item quantity:', {
    cartId: this._id,
    itemId,
    newQuantity
  });
  
  const itemIndex = this.items.findIndex(item => 
    item.itemId.toString() === itemId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  if (newQuantity <= 0) {
    // Remove item
    this.items.splice(itemIndex, 1);
    console.log('🛒 [CART_MODEL] Removed item from cart');
  } else {
    // Update quantity and recalculate itemTotal
    this.items[itemIndex].quantity = newQuantity;
    this.items[itemIndex].itemTotal = this.items[itemIndex].price * newQuantity;
    console.log('🛒 [CART_MODEL] Updated item quantity:', {
      itemName: this.items[itemIndex].name,
      newQuantity,
      newItemTotal: this.items[itemIndex].itemTotal
    });
  }
  
  // Recalculate totals
  this.calculateTotals();
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  console.log('🛒 [CART_MODEL] Clearing cart:', this._id);
  this.items = [];
  this.subtotal = 0;
  this.total = 0;
  return this.save();
};

// Static method to find active cart for user and restaurant
cartSchema.statics.findActiveCart = function(userId, restaurantId) {
  console.log('🛒 [CART_MODEL] Finding active cart for user:', {
    userId,
    restaurantId
  });
  
  return this.findOne({
    userId,
    restaurantId
  });
};

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    // Ensure all items have itemTotal calculated
    this.items.forEach(item => {
      if (item.price !== undefined && item.quantity !== undefined && !item.itemTotal) {
        item.itemTotal = item.price * item.quantity;
      }
    });
    this.calculateTotals();
  }
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
