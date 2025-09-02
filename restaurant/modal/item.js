const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String // S3 URL for item image
  },

  // Category and Classification
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  itemCategory: {
    type: String,
    required: true,
    trim: true
  },

  // Pricing
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price cannot be negative']
  },

  // Availability
  availability: {
    type: String,
    enum: ['in-stock', 'out-of-stock', 'limited'],
    default: 'in-stock'
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Dietary Information
  isDietMeal: {
    type: Boolean,
    default: false
  },
  calories: {
    type: Number,
    min: [0, 'Calories cannot be negative']
  },

  // Restaurant Reference
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },

  // Ratings and Reviews
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },

  // Order tracking for best sellers
  totalOrder: {
    type: Number,
    default: 0,
    min: [0, 'Total order cannot be negative']
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

// Indexes
itemSchema.index({ restaurant: 1, isActive: 1 });
itemSchema.index({ restaurant: 1, category: 1, isActive: 1 });
itemSchema.index({ restaurant: 1, availability: 1 });
itemSchema.index({ restaurant: 1, itemCategory: 1 });
itemSchema.index({ restaurant: 1, totalOrder: 1 }); // Added index for best seller queries

// Virtual for complete item info
itemSchema.virtual('completeInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    image: this.image,
    category: this.category,
    itemCategory: this.itemCategory,
    price: this.price,
    availability: this.availability,
    isActive: this.isActive,
    isDietMeal: this.isDietMeal,
    calories: this.calories,
    rating: this.rating,
    totalRatings: this.totalRatings,
    totalReviews: this.totalReviews,
    totalOrder: this.totalOrder,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Virtual for availability status
itemSchema.virtual('availabilityStatus').get(function() {
  if (!this.isActive) return 'inactive';
  return this.availability;
});

// Method to update rating
itemSchema.methods.updateRating = function(newRating) {
  this.totalRatings += 1;
  this.rating = ((this.rating * (this.totalRatings - 1)) + newRating) / this.totalRatings;
  return this.save();
};

// Method to toggle availability
itemSchema.methods.toggleAvailability = function() {
  if (this.availability === 'in-stock') {
    this.availability = 'out-of-stock';
  } else if (this.availability === 'out-of-stock') {
    this.availability = 'limited';
  } else {
    this.availability = 'in-stock';
  }
  return this.save();
};

// Method to increment order count
itemSchema.methods.incrementOrderCount = function(quantity = 1) {
  this.totalOrder += quantity;
  return this.save();
};

// Method to decrement order count (for order cancellations)
itemSchema.methods.decrementOrderCount = function(quantity = 1) {
  this.totalOrder = Math.max(0, this.totalOrder - quantity);
  return this.save();
};

module.exports = mongoose.model('Item', itemSchema);
