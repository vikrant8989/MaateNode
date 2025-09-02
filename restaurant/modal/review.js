const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Review Identification
  reviewDate: {
    type: Date,
    required: [true, 'Review date is required'],
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
  customerImage: {
    type: String // Base64 image
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
  restaurantLocation: {
    type: String,
    trim: true,
    maxlength: [200, 'Restaurant location cannot exceed 200 characters']
  },

  // Order Information
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required']
  },
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    trim: true
  },
  orderDate: {
    type: Date,
    required: [true, 'Order date is required']
  },

  // Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  review: {
    type: String,
    required: [true, 'Review text is required'],
    trim: true,
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },

  // Review Analytics
  helpfulCount: {
    type: Number,
    default: 0,
    min: [0, 'Helpful count cannot be negative']
  },
  unhelpfulCount: {
    type: Number,
    default: 0,
    min: [0, 'Unhelpful count cannot be negative']
  },
  reportCount: {
    type: Number,
    default: 0,
    min: [0, 'Report count cannot be negative']
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },

  // Review Visibility & Moderation
  isVisible: {
    type: Boolean,
    default: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    trim: true
  },
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  flaggedAt: {
    type: Date
  },

  // Review Tags
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],

  // Review Sentiment
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  sentimentScore: {
    type: Number,
    min: [-1, 'Sentiment score cannot be less than -1'],
    max: [1, 'Sentiment score cannot exceed 1']
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
reviewSchema.index({ restaurant: 1, rating: -1 });
reviewSchema.index({ restaurant: 1, reviewDate: -1 });
reviewSchema.index({ customer: 1, reviewDate: -1 });
reviewSchema.index({ order: 1 });
reviewSchema.index({ isVisible: 1 });
reviewSchema.index({ isFlagged: 1 });
reviewSchema.index({ restaurant: 1, isVisible: 1 });

// Virtual for complete review info
reviewSchema.virtual('completeInfo').get(function() {
  return {
    id: this._id,
    reviewDate: this.reviewDate,
    customer: this.customer,
    customerName: this.customerName,
    customerImage: this.customerImage,
    restaurant: this.restaurant,
    restaurantName: this.restaurantName,
    restaurantLocation: this.restaurantLocation,
    order: this.order,
    orderNumber: this.orderNumber,
    orderDate: this.orderDate,
    rating: this.rating,
    review: this.review,
    helpfulCount: this.helpfulCount,
    unhelpfulCount: this.unhelpfulCount,
    reportCount: this.reportCount,
    viewCount: this.viewCount,
    isVisible: this.isVisible,
    isFlagged: this.isFlagged,
    flagReason: this.flagReason,
    flaggedBy: this.flaggedBy,
    flaggedAt: this.flaggedAt,
    tags: this.tags,
    sentiment: this.sentiment,
    sentimentScore: this.sentimentScore,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Virtual for review age
reviewSchema.virtual('reviewAge').get(function() {
  const now = new Date();
  const reviewTime = this.reviewDate;
  const diffTime = Math.abs(now - reviewTime);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Virtual for review sentiment
reviewSchema.virtual('sentimentLabel').get(function() {
  if (this.rating >= 4) return 'positive';
  if (this.rating >= 3) return 'neutral';
  return 'negative';
});

// Method to mark review as helpful/unhelpful
reviewSchema.methods.markHelpful = function(isHelpful = true) {
  if (isHelpful) {
    this.helpfulCount += 1;
  } else {
    this.unhelpfulCount += 1;
  }
  return this.save();
};

// Method to report review
reviewSchema.methods.reportReview = function() {
  this.reportCount += 1;
  return this.save();
};

// Method to increment view count
reviewSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to add review tags
reviewSchema.methods.addTags = function(newTags) {
  const uniqueTags = [...new Set([...this.tags, ...newTags])];
  this.tags = uniqueTags.slice(0, 10); // Limit to 10 tags
  return this.save();
};

// Method to remove review tags
reviewSchema.methods.removeTags = function(tagsToRemove) {
  this.tags = this.tags.filter(tag => !tagsToRemove.includes(tag));
  return this.save();
};

// Method to calculate sentiment score
reviewSchema.methods.calculateSentimentScore = function() {
  // Simple sentiment calculation based on rating
  if (this.rating >= 4.5) {
    this.sentimentScore = 1.0;
    this.sentiment = 'positive';
  } else if (this.rating >= 3.5) {
    this.sentimentScore = 0.5;
    this.sentiment = 'positive';
  } else if (this.rating >= 2.5) {
    this.sentimentScore = 0.0;
    this.sentiment = 'neutral';
  } else if (this.rating >= 1.5) {
    this.sentimentScore = -0.5;
    this.sentiment = 'negative';
  } else {
    this.sentimentScore = -1.0;
    this.sentiment = 'negative';
  }
  return this.save();
};

// Method to toggle review visibility
reviewSchema.methods.toggleVisibility = function() {
  this.isVisible = !this.isVisible;
  return this.save();
};

// Method to flag review
reviewSchema.methods.flagReview = function(reason, flaggedBy) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.flaggedBy = flaggedBy;
  this.flaggedAt = new Date();
  return this.save();
};

// Method to unflag review
reviewSchema.methods.unflagReview = function() {
  this.isFlagged = false;
  this.flagReason = undefined;
  this.flaggedBy = undefined;
  this.flaggedAt = undefined;
  return this.save();
};

module.exports = mongoose.model('Review', reviewSchema);
