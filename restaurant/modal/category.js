const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  image: {
    type: String // S3 URL for category image
  },

  // Restaurant Reference
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Statistics
  itemCount: {
    type: Number,
    default: 0
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ restaurant: 1, isActive: 1 });

// Virtual for complete category info
categorySchema.virtual('completeInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    image: this.image,
    isActive: this.isActive,
    itemCount: this.itemCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Method to update item count
categorySchema.methods.updateItemCount = async function() {
  const Item = require('./item');
  this.itemCount = await Item.countDocuments({ 
    category: this._id, 
    isActive: true 
  });
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema);
