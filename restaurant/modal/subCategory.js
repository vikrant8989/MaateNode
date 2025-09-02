const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    maxlength: [50, 'Subcategory name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  image: {
    type: String // Base64 image
  },
  icon: {
    type: String,
    trim: true
  },

  // References
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  // Status and Ordering
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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
  timestamps: true
});

// Indexes
subCategorySchema.index({ restaurant: 1, category: 1, isActive: 1 });
subCategorySchema.index({ restaurant: 1, category: 1, sortOrder: 1 });

// Virtual for complete subcategory info
subCategorySchema.virtual('completeInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    image: this.image,
    icon: this.icon,
    category: this.category,
    isActive: this.isActive,
    sortOrder: this.sortOrder,
    itemCount: this.itemCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Method to update item count
subCategorySchema.methods.updateItemCount = async function() {
  const Item = require('./item');
  this.itemCount = await Item.countDocuments({ 
    subCategory: this._id, 
    isActive: true 
  });
  return this.save();
};

module.exports = mongoose.model('SubCategory', subCategorySchema);
