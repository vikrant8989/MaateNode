const Plan = require('../../../restaurant/modal/plan');
const Restaurant = require('../../../restaurant/modal/restaurant');

// @desc    Get all plans (Admin only)
// @route   GET /api/admin/plans
// @access  Private (Admin)
const getAllPlans = async (req, res) => {
  try {
    console.log('🔍 [PLAN] getAllPlans called with query:', req.query);
    console.log('🔍 [PLAN] User making request:', req.user?.id, req.user?.userType);
    
    const { restaurant, isActive, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (restaurant) {
      query.restaurant = restaurant;
      console.log('🔍 [PLAN] Filtering by restaurant:', restaurant);
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
      console.log('🔍 [PLAN] Filtering by isActive:', query.isActive);
    }
    
    console.log('🔍 [PLAN] Final query:', query);

    console.log('🔍 [PLAN] Executing database query...');
    const plans = await Plan.find(query)
      .populate('restaurant', 'businessName email phone city state')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Plan.countDocuments(query);
    console.log('🔍 [PLAN] Found plans:', plans.length, 'Total:', total);

    res.status(200).json({
      success: true,
      count: plans.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: plans
    });

  } catch (error) {
    console.error('❌ [PLAN] Get All Plans Error:', error);
    console.error('❌ [PLAN] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching plans',
      error: error.message
    });
  }
};

// @desc    Get plan by ID (Admin only)
// @route   GET /api/admin/plans/:id
// @access  Private (Admin)
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id)
      .populate('restaurant', 'businessName email phone address city state pinCode category specialization');
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('Get Plan Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plan',
      error: error.message
    });
  }
};

// @desc    Toggle plan status (Admin only)
// @route   PUT /api/admin/plans/:id/toggle-status
// @access  Private (Admin)
const togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    res.status(200).json({
      success: true,
      message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
      data: plan
    });

  } catch (error) {
    console.error('Toggle Plan Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling plan status',
      error: error.message
    });
  }
};

// @desc    Get plan statistics for dashboard
// @route   GET /api/admin/plan-stats
// @access  Private (Admin)
const getPlanStats = async (req, res) => {
  try {
    const totalPlans = await Plan.countDocuments();
    const activePlans = await Plan.countDocuments({ isActive: true });
    const inactivePlans = await Plan.countDocuments({ isActive: false });
    
    // Get plans by restaurant
    const plansByRestaurant = await Plan.aggregate([
      {
        $group: {
          _id: '$restaurant',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurantInfo'
        }
      },
      {
        $project: {
          restaurantName: { $arrayElemAt: ['$restaurantInfo.businessName', 0] },
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalPlans,
        active: activePlans,
        inactive: inactivePlans,
        plansByRestaurant
      }
    });

  } catch (error) {
    console.error('Get Plan Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plan statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllPlans,
  getPlanById,
  togglePlanStatus,
  getPlanStats
};
