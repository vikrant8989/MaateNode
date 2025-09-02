const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const planSchema = new mongoose.Schema({
  // Basic Plan Information
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [100, 'Plan name cannot exceed 100 characters']
  },

  // Restaurant Reference
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },

  // Pricing
  pricePerWeek: {
    type: Number,
    required: [true, 'Plan price per week is required'],
    min: [0, 'Price cannot be negative']
  },

  // Plan Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Features - simplified to array of strings
  features: [{
    type: String,
    trim: true,
    maxlength: [200, 'Feature cannot exceed 200 characters']
  }],

  // Weekly Meal Plan
  weeklyMeals: {
    sunday: {
      breakfast: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      lunch: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      dinner: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }]
    },
    monday: {
      breakfast: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      lunch: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      dinner: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }]
    },
    tuesday: {
      breakfast: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      lunch: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      dinner: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }]
    },
    wednesday: {
      breakfast: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      lunch: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      dinner: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }]
    },
    thursday: {
      breakfast: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      lunch: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      dinner: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }]
    },
    friday: {
      breakfast: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      lunch: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      dinner: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }]
    },
    saturday: {
      breakfast: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      lunch: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }],
      dinner: [{
        name: {
          type: String,
          trim: true,
          maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        calories: {
          type: Number,
          min: [0, 'Calories cannot be negative']
        }
      }]
    }
  },

  // Plan Statistics
  totalSubscribers: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0
  },

  // Plan Settings
  isRecommended: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  maxSubscribers: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  isAvailable: {
    type: Boolean,
    default: true
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
planSchema.index({ restaurant: 1, isActive: 1 });
planSchema.index({ restaurant: 1, isRecommended: 1 });
planSchema.index({ restaurant: 1, isPopular: 1 });

// Add pagination plugin
planSchema.plugin(mongoosePaginate);

// Virtual for complete plan info
planSchema.virtual('completeInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    pricePerWeek: this.pricePerWeek,
    isActive: this.isActive,
    features: this.features,
    weeklyMeals: this.weeklyMeals,
    totalSubscribers: this.totalSubscribers,
    totalRevenue: this.totalRevenue,
    averageRating: this.averageRating,
    totalRatings: this.totalRatings,
    isRecommended: this.isRecommended,
    isPopular: this.isPopular,
    maxSubscribers: this.maxSubscribers,
    isAvailable: this.isAvailable,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Virtual for total weekly calories
planSchema.virtual('totalWeeklyCalories').get(function() {
  let total = 0;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  days.forEach(day => {
    const dayMeals = this.weeklyMeals[day];
    if (dayMeals) {
      // Handle breakfast meals array
      if (dayMeals.breakfast && Array.isArray(dayMeals.breakfast)) {
        dayMeals.breakfast.forEach(meal => {
          if (meal && meal.calories) {
            total += meal.calories;
          }
        });
      }
      // Handle lunch meals array
      if (dayMeals.lunch && Array.isArray(dayMeals.lunch)) {
        dayMeals.lunch.forEach(meal => {
          if (meal && meal.calories) {
            total += meal.calories;
          }
        });
      }
      // Handle dinner meals array
      if (dayMeals.dinner && Array.isArray(dayMeals.dinner)) {
        dayMeals.dinner.forEach(meal => {
          if (meal && meal.calories) {
            total += meal.calories;
          }
        });
      }
    }
  });
  
  return total;
});

// Virtual for average daily calories
planSchema.virtual('averageDailyCalories').get(function() {
  const total = this.totalWeeklyCalories;
  return total > 0 ? Math.round(total / 7) : 0;
});

// Method to update meal for a specific day and meal type
planSchema.methods.updateMeal = function(day, mealType, mealData) {
  if (this.weeklyMeals[day] && this.weeklyMeals[day][mealType]) {
    // Handle both single meal and array of meals
    if (Array.isArray(mealData)) {
      this.weeklyMeals[day][mealType] = mealData;
    } else {
      this.weeklyMeals[day][mealType] = [mealData];
    }
    return this.save();
  }
  throw new Error('Invalid day or meal type');
};

// Method to update rating
planSchema.methods.updateRating = function(newRating) {
  this.totalRatings += 1;
  this.averageRating = ((this.averageRating * (this.totalRatings - 1)) + newRating) / this.totalRatings;
  return this.save();
};

// Method to update subscriber count
planSchema.methods.updateSubscriberCount = function(increment = 1) {
  this.totalSubscribers += increment;
  if (this.totalSubscribers < 0) this.totalSubscribers = 0;
  return this.save();
};

// Method to update revenue
planSchema.methods.updateRevenue = function(amount) {
  this.totalRevenue += amount;
  return this.save();
};

// Method to toggle plan availability
planSchema.methods.toggleAvailability = function() {
  this.isAvailable = !this.isAvailable;
  return this.save();
};

module.exports = mongoose.model('Plan', planSchema);
