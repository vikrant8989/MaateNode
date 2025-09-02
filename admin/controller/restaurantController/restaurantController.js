const Restaurant = require('../../../restaurant/modal/restaurant');

// @desc    Get all restaurants (Admin only)
// @route   GET /api/admin/restaurants
// @access  Private (Admin)
const getAllRestaurants = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const restaurants = await Restaurant.find(query)
      .select('-otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Restaurant.countDocuments(query);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: restaurants.map(restaurant => restaurant.completeProfile)
    });

  } catch (error) {
    console.error('Get All Restaurants Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: error.message
    });
  }
};

// @desc    Get restaurant by ID (Admin only)
// @route   GET /api/admin/restaurants/:id
// @access  Private (Admin)
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id).select('-otp -otpExpiry');
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant.completeProfile
    });

  } catch (error) {
    console.error('Get Restaurant Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant',
      error: error.message
    });
  }
};

// @desc    Approve restaurant (Admin only)
// @route   PUT /api/admin/restaurants/:id/approve
// @access  Private (Admin)
const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is already approved'
      });
    }

    await restaurant.approve(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Restaurant approved successfully',
      data: restaurant.completeProfile
    });

  } catch (error) {
    console.error('Approve Restaurant Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving restaurant',
      error: error.message
    });
  }
};

// @desc    Reject restaurant (Admin only)
// @route   PUT /api/admin/restaurants/:id/reject
// @access  Private (Admin)
const rejectRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason must be at least 10 characters'
      });
    }

    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is already rejected'
      });
    }

    await restaurant.reject(req.user.id, reason.trim());

    res.status(200).json({
      success: true,
      message: 'Restaurant rejected successfully',
      data: restaurant.completeProfile
    });

  } catch (error) {
    console.error('Reject Restaurant Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting restaurant',
      error: error.message
    });
  }
};

// @desc    Toggle restaurant status (Admin only)
// @route   PUT /api/admin/restaurants/:id/toggle-status
// @access  Private (Admin)
const toggleRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 [Backend] Toggle status request for restaurant ID:', id);

    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      console.log('🔍 [Backend] Restaurant not found');
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('🔍 [Backend] Found restaurant:', {
      id: restaurant._id,
      businessName: restaurant.businessName,
      isApproved: restaurant.isApproved,
      isActive: restaurant.isActive,
      status: restaurant.status
    });

    if (!restaurant.isApproved) {
      console.log('🔍 [Backend] Restaurant not approved, cannot toggle');
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle status of unapproved restaurant'
      });
    }

    const oldStatus = restaurant.isActive;
    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    console.log('🔍 [Backend] Toggle successful:', {
      oldStatus,
      newStatus: restaurant.isActive
    });

    res.status(200).json({
      success: true,
      message: `Restaurant ${restaurant.isActive ? 'activated' : 'deactivated'} successfully`,
      data: restaurant.completeProfile
    });

  } catch (error) {
    console.error('Toggle Restaurant Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling restaurant status',
      error: error.message
    });
  }
};

// @desc    Get restaurant statistics for dashboard
// @route   GET /api/admin/restaurant-stats
// @access  Private (Admin)
const getRestaurantStats = async (req, res) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();
    const pendingRestaurants = await Restaurant.countDocuments({ status: 'pending' });
    const approvedRestaurants = await Restaurant.countDocuments({ status: 'approved' });
    const rejectedRestaurants = await Restaurant.countDocuments({ status: 'rejected' });
    const activeRestaurants = await Restaurant.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        total: totalRestaurants,
        pending: pendingRestaurants,
        approved: approvedRestaurants,
        rejected: rejectedRestaurants,
        active: activeRestaurants
      }
    });

  } catch (error) {
    console.error('Get Restaurant Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  approveRestaurant,
  rejectRestaurant,
  toggleRestaurantStatus,
  getRestaurantStats
};
