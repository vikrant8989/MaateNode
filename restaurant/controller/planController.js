const Plan = require('../modal/plan');
const Item = require('../modal/item');
const { bufferToBase64 } = require('../../utils/multerConfig');

// Create a new plan
const createPlan = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] createPlan called');
  console.log('📝 [PLAN_CONTROLLER] Request body:', req.body);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const {
      name,
      pricePerWeek,
      features,
      weeklyMeals,
      maxSubscribers,
      isRecommended,
      isPopular
    } = req.body;

    console.log('🔍 [PLAN_CONTROLLER] Extracted data:', {
      name,
      pricePerWeek,
      features,
      weeklyMeals,
      maxSubscribers,
      isRecommended,
      isPopular
    });

    // Validation
    if (!name || name.trim().length < 2 || name.trim().length > 100) {
      console.log('❌ [PLAN_CONTROLLER] Name validation failed:', name);
      return res.status(400).json({
        success: false,
        message: 'Plan name must be between 2 and 100 characters'
      });
    }

    if (!pricePerWeek || pricePerWeek < 0) {
      console.log('❌ [PLAN_CONTROLLER] Price validation failed:', pricePerWeek);
      return res.status(400).json({
        success: false,
        message: 'Plan price per week is required and must be positive'
      });
    }

    // Check if plan name already exists for this restaurant
    const existingPlan = await Plan.findOne({
      restaurant: req.user.id,
      name: name.trim()
    });

    if (existingPlan) {
      console.log('❌ [PLAN_CONTROLLER] Plan name already exists:', name);
      return res.status(400).json({
        success: false,
        message: 'A plan with this name already exists'
      });
    }

    // Create plan
    const plan = new Plan({
      name: name.trim(),
      restaurant: req.user.id,
      pricePerWeek,
      features: features || [],
      weeklyMeals: weeklyMeals || {},
      maxSubscribers: maxSubscribers || 0,
      isRecommended: isRecommended || false,
      isPopular: isPopular || false
    });

    console.log('💾 [PLAN_CONTROLLER] Saving plan:', plan);

    await plan.save();
    console.log('✅ [PLAN_CONTROLLER] Plan saved successfully, ID:', plan._id);

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan.completeInfo
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Create Plan Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating plan',
      error: error.message
    });
  }
};

// Get all plans for a restaurant
const getAllPlans = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] getAllPlans called');
  console.log('🔍 [PLAN_CONTROLLER] Query params:', req.query);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('📊 [PLAN_CONTROLLER] Pagination params:', { page, limit, skip });

    // Build filter
    const filter = { restaurant: req.user.id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    console.log('🔍 [PLAN_CONTROLLER] Filter:', filter);

    const plans = await Plan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('restaurant', 'businessName');

    const total = await Plan.countDocuments(filter);

    console.log('✅ [PLAN_CONTROLLER] Plans found:', plans.length, 'Total:', total);

    res.status(200).json({
      success: true,
      message: 'Plans retrieved successfully',
      data: {
        plans: plans.map(plan => plan.completeInfo),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPlans: total,
          plansPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Get All Plans Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plans',
      error: error.message
    });
  }
};

// Get plan by ID
const getPlanById = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] getPlanById called');
  console.log('🔍 [PLAN_CONTROLLER] Plan ID:', req.params.id);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const { id } = req.params;

    const plan = await Plan.findOne({
      _id: id,
      restaurant: req.user.id
    }).populate('restaurant', 'businessName');

    if (!plan) {
      console.log('❌ [PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    console.log('✅ [PLAN_CONTROLLER] Plan found:', plan.name);

    res.status(200).json({
      success: true,
      message: 'Plan retrieved successfully',
      data: plan.completeInfo
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Get Plan By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plan',
      error: error.message
    });
  }
};

// Update plan
const updatePlan = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] updatePlan called');
  console.log('🔍 [PLAN_CONTROLLER] Plan ID:', req.params.id);
  console.log('📝 [PLAN_CONTROLLER] Request body:', req.body);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const { id } = req.params;
    const {
      name,
      pricePerWeek,
      features,
      maxSubscribers,
      isRecommended,
      isPopular,
      isActive
    } = req.body;

    console.log('🔍 [PLAN_CONTROLLER] Update data:', {
      name,
      pricePerWeek,
      features,
      maxSubscribers,
      isRecommended,
      isPopular,
      isActive
    });

    const plan = await Plan.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!plan) {
      console.log('❌ [PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Validation
    if (name && (name.trim().length < 2 || name.trim().length > 100)) {
      console.log('❌ [PLAN_CONTROLLER] Name validation failed:', name);
      return res.status(400).json({
        success: false,
        message: 'Plan name must be between 2 and 100 characters'
      });
    }

    if (pricePerWeek && pricePerWeek < 0) {
      console.log('❌ [PLAN_CONTROLLER] Price validation failed:', pricePerWeek);
      return res.status(400).json({
        success: false,
        message: 'Plan price must be positive'
      });
    }

    // Check if plan name already exists (excluding current plan)
    if (name && name.trim() !== plan.name) {
      const existingPlan = await Plan.findOne({
        restaurant: req.user.id,
        name: name.trim(),
        _id: { $ne: id }
      });

      if (existingPlan) {
        console.log('❌ [PLAN_CONTROLLER] Plan name already exists:', name);
        return res.status(400).json({
          success: false,
          message: 'A plan with this name already exists'
        });
      }
    }

    // Update plan
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (pricePerWeek) updateData.pricePerWeek = pricePerWeek;
    if (features) updateData.features = features;
    if (maxSubscribers !== undefined) updateData.maxSubscribers = maxSubscribers;
    if (isRecommended !== undefined) updateData.isRecommended = isRecommended;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (isActive !== undefined) updateData.isActive = isActive;

    console.log('💾 [PLAN_CONTROLLER] Updating plan with data:', updateData);

    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ [PLAN_CONTROLLER] Plan updated successfully');

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: updatedPlan.completeInfo
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Update Plan Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating plan',
      error: error.message
    });
  }
};

// Delete plan
const deletePlan = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] deletePlan called');
  console.log('🔍 [PLAN_CONTROLLER] Plan ID:', req.params.id);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const { id } = req.params;

    const plan = await Plan.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!plan) {
      console.log('❌ [PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan has subscribers
    if (plan.totalSubscribers > 0) {
      console.log('❌ [PLAN_CONTROLLER] Cannot delete plan with subscribers:', plan.totalSubscribers);
      return res.status(400).json({
        success: false,
        message: 'Cannot delete plan with active subscribers'
      });
    }

    console.log('🗑️ [PLAN_CONTROLLER] Deleting plan:', plan.name);

    await Plan.findByIdAndDelete(id);

    console.log('✅ [PLAN_CONTROLLER] Plan deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Delete Plan Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting plan',
      error: error.message
    });
  }
};

// Update meal for a specific day and meal type
const updateMeal = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] updateMeal called');
  console.log('🔍 [PLAN_CONTROLLER] Plan ID:', req.params.id);
  console.log('📝 [PLAN_CONTROLLER] Request body:', req.body);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const { id } = req.params;
    const { day, mealType, meals } = req.body;

    console.log('🔍 [PLAN_CONTROLLER] Meal update data:', {
      day,
      mealType,
      meals
    });

    // Validation
    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const validMealTypes = ['breakfast', 'lunch', 'dinner'];

    if (!validDays.includes(day)) {
      console.log('❌ [PLAN_CONTROLLER] Invalid day:', day);
      return res.status(400).json({
        success: false,
        message: 'Invalid day. Must be one of: sunday, monday, tuesday, wednesday, thursday, friday, saturday'
      });
    }

    if (!validMealTypes.includes(mealType)) {
      console.log('❌ [PLAN_CONTROLLER] Invalid meal type:', mealType);
      return res.status(400).json({
        success: false,
        message: 'Invalid meal type. Must be one of: breakfast, lunch, dinner'
      });
    }

    if (!Array.isArray(meals)) {
      console.log('❌ [PLAN_CONTROLLER] Meals must be an array');
      return res.status(400).json({
        success: false,
        message: 'Meals must be provided as an array'
      });
    }

    // Validate each meal
    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i];
      if (meal.name && (meal.name.trim().length < 1 || meal.name.trim().length > 100)) {
        console.log('❌ [PLAN_CONTROLLER] Meal name validation failed:', meal.name);
        return res.status(400).json({
          success: false,
          message: `Meal ${i + 1} name must be between 1 and 100 characters`
        });
      }
      if (meal.calories && meal.calories < 0) {
        console.log('❌ [PLAN_CONTROLLER] Calories validation failed:', meal.calories);
        return res.status(400).json({
          success: false,
          message: `Meal ${i + 1} calories cannot be negative`
        });
      }
    }

    const plan = await Plan.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!plan) {
      console.log('❌ [PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Update meals array for the specific day and meal type
    const processedMeals = meals.map(meal => ({
      name: meal.name ? meal.name.trim() : '',
      calories: meal.calories || 0
    }));

    console.log('💾 [PLAN_CONTROLLER] Updating meals with data:', processedMeals);

    // Update the meals array directly
    plan.weeklyMeals[day][mealType] = processedMeals;
    await plan.save();

    console.log('✅ [PLAN_CONTROLLER] Meals updated successfully');

    res.status(200).json({
      success: true,
      message: 'Meals updated successfully',
      data: {
        day,
        mealType,
        meals: plan.weeklyMeals[day][mealType]
      }
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Update Meal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating meals',
      error: error.message
    });
  }
};

// Toggle plan availability
const togglePlanAvailability = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] togglePlanAvailability called');
  console.log('🔍 [PLAN_CONTROLLER] Plan ID:', req.params.id);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const { id } = req.params;

    const plan = await Plan.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!plan) {
      console.log('❌ [PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    console.log('🔄 [PLAN_CONTROLLER] Toggling availability from:', plan.isAvailable);

    await plan.toggleAvailability();

    console.log('✅ [PLAN_CONTROLLER] Plan availability updated to:', plan.isAvailable);

    res.status(200).json({
      success: true,
      message: 'Plan availability updated successfully',
      data: {
        isAvailable: plan.isAvailable
      }
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Toggle Plan Availability Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating plan availability',
      error: error.message
    });
  }
};

// Get plan statistics
const getPlanStats = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] getPlanStats called');
  console.log('🔍 [PLAN_CONTROLLER] Plan ID:', req.params.id);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const { id } = req.params;

    const plan = await Plan.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!plan) {
      console.log('❌ [PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const stats = {
      totalSubscribers: plan.totalSubscribers,
      totalRevenue: plan.totalRevenue,
      averageRating: plan.averageRating,
      totalRatings: plan.totalRatings,
      totalWeeklyCalories: plan.totalWeeklyCalories,
      averageDailyCalories: plan.averageDailyCalories,
      isRecommended: plan.isRecommended,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      isAvailable: plan.isAvailable
    };

    console.log('✅ [PLAN_CONTROLLER] Plan stats retrieved:', stats);

    res.status(200).json({
      success: true,
      message: 'Plan statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Get Plan Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plan statistics',
      error: error.message
    });
  }
};

// Get all plan statistics for restaurant
const getAllPlanStats = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] getAllPlanStats called');
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const plans = await Plan.find({ restaurant: req.user.id });

    console.log('📊 [PLAN_CONTROLLER] Total plans found:', plans.length);

    const stats = {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.isActive && p.isAvailable).length,
      totalSubscribers: plans.reduce((sum, p) => sum + p.totalSubscribers, 0),
      totalRevenue: plans.reduce((sum, p) => sum + p.totalRevenue, 0),
      averageRating: plans.length > 0 ? plans.reduce((sum, p) => sum + p.averageRating, 0) / plans.length : 0,
      totalRatings: plans.reduce((sum, p) => sum + p.totalRatings, 0),
      recommendedPlans: plans.filter(p => p.isRecommended).length,
      popularPlans: plans.filter(p => p.isPopular).length
    };

    console.log('✅ [PLAN_CONTROLLER] Restaurant stats calculated:', stats);

    res.status(200).json({
      success: true,
      message: 'Plan statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Get All Plan Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plan statistics',
      error: error.message
    });
  }
};

// Add feature to plan
const addFeature = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] addFeature called');
  console.log('🔍 [PLAN_CONTROLLER] Plan ID:', req.params.id);
  console.log('📝 [PLAN_CONTROLLER] Request body:', req.body);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const { id } = req.params;
    const { feature } = req.body;

    console.log('🔍 [PLAN_CONTROLLER] Feature to add:', feature);

    // Validation
    if (!feature || feature.trim().length < 1 || feature.trim().length > 200) {
      console.log('❌ [PLAN_CONTROLLER] Feature validation failed:', feature);
      return res.status(400).json({
        success: false,
        message: 'Feature must be between 1 and 200 characters'
      });
    }

    const plan = await Plan.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!plan) {
      console.log('❌ [PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Add feature
    plan.features.push(feature.trim());

    console.log('💾 [PLAN_CONTROLLER] Adding feature:', feature.trim());

    await plan.save();

    console.log('✅ [PLAN_CONTROLLER] Feature added successfully');

    res.status(200).json({
      success: true,
      message: 'Feature added successfully',
      data: {
        features: plan.features
      }
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Add Feature Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding feature',
      error: error.message
    });
  }
};

// Remove feature from plan
const removeFeature = async (req, res) => {
  console.log('🚀 [PLAN_CONTROLLER] removeFeature called');
  console.log('🔍 [PLAN_CONTROLLER] Plan ID:', req.params.id);
  console.log('📝 [PLAN_CONTROLLER] Request body:', req.body);
  console.log('👤 [PLAN_CONTROLLER] Restaurant ID:', req.user?.id);
  
  try {
    const { id } = req.params;
    const { feature } = req.body;

    console.log('🔍 [PLAN_CONTROLLER] Feature to remove:', feature);

    if (!feature) {
      console.log('❌ [PLAN_CONTROLLER] Feature not provided');
      return res.status(400).json({
        success: false,
        message: 'Feature is required'
      });
    }

    const plan = await Plan.findOne({
      _id: id,
      restaurant: req.user.id
    });

    if (!plan) {
      console.log('❌ [PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Remove feature
    const initialLength = plan.features.length;
    plan.features = plan.features.filter(f => f !== feature);

    if (plan.features.length === initialLength) {
      console.log('❌ [PLAN_CONTROLLER] Feature not found in plan:', feature);
      return res.status(400).json({
        success: false,
        message: 'Feature not found in plan'
      });
    }

    console.log('💾 [PLAN_CONTROLLER] Removing feature:', feature);

    await plan.save();

    console.log('✅ [PLAN_CONTROLLER] Feature removed successfully');

    res.status(200).json({
      success: true,
      message: 'Feature removed successfully',
      data: {
        features: plan.features
      }
    });

  } catch (error) {
    console.error('❌ [PLAN_CONTROLLER] Remove Feature Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing feature',
      error: error.message
    });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  updateMeal,
  togglePlanAvailability,
  getPlanStats,
  getAllPlanStats,
  addFeature,
  removeFeature
}; 