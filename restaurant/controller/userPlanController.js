const Plan = require('../modal/plan');
const Restaurant = require('../modal/restaurant');

// Get all plans for a specific restaurant (public access)
const getPlansByRestaurant = async (req, res) => {
  console.log('🚀 [USER_PLAN_CONTROLLER] getPlansByRestaurant called');
  console.log('🔍 [USER_PLAN_CONTROLLER] Restaurant ID:', req.params.restaurantId);
  console.log('🔍 [USER_PLAN_CONTROLLER] Query params:', req.query);
  
  try {
    const { restaurantId } = req.params;
    const { isActive, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('📊 [USER_PLAN_CONTROLLER] Pagination params:', { page, limit, skip });

    // First verify the restaurant exists and is approved
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      console.log('❌ [USER_PLAN_CONTROLLER] Restaurant not found:', restaurantId);
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (!restaurant.isApproved || !restaurant.isActive) {
      console.log('❌ [USER_PLAN_CONTROLLER] Restaurant not available:', {
        isApproved: restaurant.isApproved,
        isActive: restaurant.isActive
      });
      return res.status(404).json({
        success: false,
        message: 'Restaurant is not available'
      });
    }

    // Build filter for plans
    const filter = { 
      restaurant: restaurantId,
      isActive: true,
      isAvailable: true
    };

    console.log('🔍 [USER_PLAN_CONTROLLER] Filter:', filter);

    // Get plans with pagination
    const plans = await Plan.find(filter)
      .sort({ isRecommended: -1, isPopular: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('restaurant', 'businessName city state');

    const total = await Plan.countDocuments(filter);

    console.log('✅ [USER_PLAN_CONTROLLER] Plans found:', plans.length, 'Total:', total);

    // Transform plans for user view
    const transformedPlans = plans.map(plan => ({
      id: plan._id,
      name: plan.name,
      pricePerWeek: plan.pricePerWeek,
      features: plan.features,
      weeklyMeals: plan.weeklyMeals,
      totalSubscribers: plan.totalSubscribers,
      averageRating: plan.averageRating,
      totalRatings: plan.totalRatings,
      isRecommended: plan.isRecommended,
      isPopular: plan.isPopular,
      maxSubscribers: plan.maxSubscribers,
      isAvailable: plan.isAvailable,
      totalWeeklyCalories: plan.totalWeeklyCalories,
      averageDailyCalories: plan.averageDailyCalories,
      restaurant: {
        id: plan.restaurant._id,
        name: plan.restaurant.businessName,
        city: plan.restaurant.city,
        state: plan.restaurant.state
      },
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Restaurant plans retrieved successfully',
      data: {
        plans: transformedPlans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPlans: total,
          plansPerPage: parseInt(limit)
        },
        restaurant: {
          id: restaurant._id,
          name: restaurant.businessName,
          city: restaurant.city,
          state: restaurant.state,
          category: restaurant.category,
          specialization: restaurant.specialization
        }
      }
    });

  } catch (error) {
    console.error('❌ [USER_PLAN_CONTROLLER] Get Plans By Restaurant Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving restaurant plans',
      error: error.message
    });
  }
};

// Get plan by ID (public access)
const getPlanById = async (req, res) => {
  console.log('🚀 [USER_PLAN_CONTROLLER] getPlanById called');
  console.log('🔍 [USER_PLAN_CONTROLLER] Plan ID:', req.params.id);
  
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id)
      .populate('restaurant', 'businessName city state category specialization isApproved isActive');

    if (!plan) {
      console.log('❌ [USER_PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan is active and available
    if (!plan.isActive || !plan.isAvailable) {
      console.log('❌ [USER_PLAN_CONTROLLER] Plan not available:', {
        isActive: plan.isActive,
        isAvailable: plan.isAvailable
      });
      return res.status(404).json({
        success: false,
        message: 'Plan is not available'
      });
    }

    // Check if restaurant is approved and active
    console.log('🔍 [USER_PLAN_CONTROLLER] Restaurant status check:', {
      restaurantId: plan.restaurant._id,
      isApproved: plan.restaurant.isApproved,
      isActive: plan.restaurant.isActive,
      restaurantData: plan.restaurant
    });
    
    if (!plan.restaurant.isApproved || !plan.restaurant.isActive) {
      console.log('❌ [USER_PLAN_CONTROLLER] Restaurant not available for plan');
      return res.status(404).json({
        success: false,
        message: 'Restaurant is not available'
      });
    }

    console.log('✅ [USER_PLAN_CONTROLLER] Plan found:', plan.name);

    // Transform plan for user view
    const transformedPlan = {
      id: plan._id,
      name: plan.name,
      pricePerWeek: plan.pricePerWeek,
      features: plan.features,
      weeklyMeals: plan.weeklyMeals,
      totalSubscribers: plan.totalSubscribers,
      averageRating: plan.averageRating,
      totalRatings: plan.totalRatings,
      isRecommended: plan.isRecommended,
      isPopular: plan.isPopular,
      maxSubscribers: plan.maxSubscribers,
      isAvailable: plan.isAvailable,
      totalWeeklyCalories: plan.totalWeeklyCalories,
      averageDailyCalories: plan.averageDailyCalories,
      restaurant: {
        id: plan.restaurant._id,
        name: plan.restaurant.businessName,
        city: plan.restaurant.city,
        state: plan.restaurant.state,
        category: plan.restaurant.category,
        specialization: plan.restaurant.specialization
      },
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Plan retrieved successfully',
      data: transformedPlan
    });

  } catch (error) {
    console.error('❌ [USER_PLAN_CONTROLLER] Get Plan By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plan',
      error: error.message
    });
  }
};

// Get plan statistics (public access)
const getPlanStats = async (req, res) => {
  console.log('🚀 [USER_PLAN_CONTROLLER] getPlanStats called');
  console.log('🔍 [USER_PLAN_CONTROLLER] Plan ID:', req.params.id);
  
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id)
      .populate('restaurant', 'businessName city state');

    if (!plan) {
      console.log('❌ [USER_PLAN_CONTROLLER] Plan not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan is active and available
    if (!plan.isActive || !plan.isAvailable) {
      console.log('❌ [USER_PLAN_CONTROLLER] Plan not available for stats');
      return res.status(404).json({
        success: false,
        message: 'Plan is not available'
      });
    }

    // Check if restaurant is approved and active
    if (!plan.restaurant.isApproved || !plan.restaurant.isActive) {
      console.log('❌ [USER_PLAN_CONTROLLER] Restaurant not available for plan stats');
      return res.status(404).json({
        success: false,
        message: 'Restaurant is not available'
      });
    }

    const stats = {
      totalSubscribers: plan.totalSubscribers,
      averageRating: plan.averageRating,
      totalRatings: plan.totalRatings,
      totalWeeklyCalories: plan.totalWeeklyCalories,
      averageDailyCalories: plan.averageDailyCalories,
      isRecommended: plan.isRecommended,
      isPopular: plan.isPopular,
      maxSubscribers: plan.maxSubscribers,
      isAvailable: plan.isAvailable,
      restaurant: {
        id: plan.restaurant._id,
        name: plan.restaurant.businessName,
        city: plan.restaurant.city,
        state: plan.restaurant.state
      }
    };

    console.log('✅ [USER_PLAN_CONTROLLER] Plan stats retrieved:', stats);

    res.status(200).json({
      success: true,
      message: 'Plan statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('❌ [USER_PLAN_CONTROLLER] Get Plan Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plan statistics',
      error: error.message
    });
  }
};

module.exports = {
  getPlansByRestaurant,
  getPlanById,
  getPlanStats
};
