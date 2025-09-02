const User = require('../../../user/modal/user');
const Order = require('../../../order/modal/order');
const UserReview = require('../../../restaurant/modal/review');

// @desc    Get all user activities (Admin only)
// @route   GET /api/admin/users/activities
// @access  Private (Admin)
const getAllActivities = async (req, res) => {
  try {
    console.log('🔍 getAllActivities - Request received:', { 
      query: req.query, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { userId, activityType, page = 1, limit = 10, dateRange } = req.query;
    console.log('🔍 getAllActivities - Query parameters:', { userId, activityType, page, limit, dateRange });
    
    let query = {};
    
    // User filter
    if (userId) {
      query.user = userId;
      console.log('🔍 getAllActivities - Applied user filter:', userId);
    }
    
    // Activity type filter
    if (activityType) {
      query.activityType = activityType;
      console.log('🔍 getAllActivities - Applied activity type filter:', activityType);
    }
    
    // Date range filter
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
        console.log('🔍 getAllActivities - Applied date range filter:', { startDate, endDate });
      }
    }

    console.log('🔍 getAllActivities - Final query object:', JSON.stringify(query, null, 2));
    console.log('🔍 getAllActivities - Pagination:', { page, limit, skip: (page - 1) * limit });

    // This would typically fetch from a separate activities collection
    // For now, we'll aggregate activities from different collections
    console.log('🔍 getAllActivities - Executing aggregation...');
    const activities = await aggregateUserActivities(query, page, limit);

    console.log('✅ getAllActivities - Activities aggregated successfully:', {
      count: activities.length,
      currentPage: page
    });

    res.status(200).json({
      success: true,
      count: activities.length,
      currentPage: page,
      data: activities
    });

  } catch (error) {
    console.error('❌ getAllActivities - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user activities',
      error: error.message
    });
  }
};

// @desc    Get user activity by ID (Admin only)
// @route   GET /api/admin/users/activities/:id
// @access  Private (Admin)
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const { activityType } = req.query;
    console.log('🔍 getActivityById - Request received:', { 
      activityId: id, 
      activityType, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!activityType) {
      console.log('❌ getActivityById - Activity type not provided');
      return res.status(400).json({
        success: false,
        message: 'Activity type is required (order, payment, or review)'
      });
    }

    console.log('🔍 getActivityById - Processing activity type:', activityType);
    let activity;
    
    switch (activityType) {
      case 'order':
        console.log('🔍 getActivityById - Fetching order...');
        activity = await Order.findById(id)
          .populate('user', 'name phone profileImage')
          .populate('restaurant', 'name logo');
        break;
      case 'payment':
        console.log('❌ getActivityById - Payment model not available');
        // For now, return a placeholder response since payment model doesn't exist
        return res.status(404).json({
          success: false,
          message: 'Payment management coming soon - model needs to be created'
        });
        break;
      case 'review':
        console.log('🔍 getActivityById - Fetching review...');
        activity = await UserReview.findById(id)
          .populate('user', 'name phone profileImage')
          .populate('restaurant', 'name logo');
        break;
      default:
        console.log('❌ getActivityById - Invalid activity type:', activityType);
        return res.status(400).json({
          success: false,
          message: 'Activity type is required (order, payment, or review)'
        });
    }

    if (!activity) {
      console.log('❌ getActivityById - Activity not found:', { id, activityType });
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    console.log('✅ getActivityById - Activity found successfully:', {
      activityId: activity._id,
      activityType,
      userId: activity.user?._id,
      restaurantId: activity.restaurant?._id
    });

    res.status(200).json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('❌ getActivityById - Error occurred:', {
      activityId: req.params.id,
      activityType: req.query.activityType,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity',
      error: error.message
    });
  }
};

// @desc    Get activity statistics (Admin only)
// @route   GET /api/admin/users/activities/stats
// @access  Private (Admin)
const getActivityStats = async (req, res) => {
  try {
    const { dateRange } = req.query;
    console.log('📊 getActivityStats - Request received:', { 
      dateRange, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    let dateFilter = {};
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
        console.log('📊 getActivityStats - Applied date filter:', { startDate, endDate });
      }
    }

    console.log('📊 getActivityStats - Getting order statistics...');
    // Order statistics
    const orderStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);
    console.log('📊 getActivityStats - Order stats completed:', orderStats[0] || {});

    // Payment statistics - placeholder since payment model doesn't exist
    const paymentStats = [{ totalPayments: 0, totalAmount: 0, averagePayment: 0 }];
    console.log('📊 getActivityStats - Payment stats placeholder (model not available)');

    console.log('📊 getActivityStats - Getting review statistics...');
    // Review statistics
    const reviewStats = await UserReview.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          approvedReviews: { $sum: { $cond: ['$isApproved', 1, 0] } }
        }
      }
    ]);
    console.log('📊 getActivityStats - Review stats completed:', reviewStats[0] || {});

    console.log('📊 getActivityStats - Getting user activity distribution...');
    // User activity distribution
    const userActivityStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      {
        $group: {
          _id: null,
          activeUsers: { $sum: 1 },
          averageOrdersPerUser: { $avg: '$orderCount' },
          averageSpendingPerUser: { $avg: '$totalSpent' }
        }
      }
    ]);
    console.log('📊 getActivityStats - User activity stats completed:', userActivityStats[0] || {});

    console.log('📊 getActivityStats - Getting daily activity trend...');
    // Daily activity trend
    const dailyStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]);
    console.log('📊 getActivityStats - Daily stats completed, count:', dailyStats.length);

    const response = {
      success: true,
      data: {
        orders: orderStats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
        payments: paymentStats[0] || { totalPayments: 0, totalAmount: 0, averagePayment: 0 },
        reviews: reviewStats[0] || { totalReviews: 0, averageRating: 0, approvedReviews: 0 },
        userActivity: userActivityStats[0] || { activeUsers: 0, averageOrdersPerUser: 0, averageSpendingPerUser: 0 },
        dailyTrend: dailyStats
      }
    };

    console.log('✅ getActivityStats - Success response prepared:', {
      success: response.success,
      orders: response.data.orders,
      reviews: response.data.reviews,
      userActivity: response.data.userActivity
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getActivityStats - Error occurred:', {
      dateRange: req.query.dateRange,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching activity statistics',
      error: error.message
    });
  }
};

// @desc    Get user activity timeline (Admin only)
// @route   GET /api/admin/users/:userId/activities/timeline
// @access  Private (Admin)
const getUserActivityTimeline = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    console.log('📅 getUserActivityTimeline - Request received:', { 
      userId, 
      page, 
      limit, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Check if user exists
    console.log('📅 getUserActivityTimeline - Checking if user exists...');
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ getUserActivityTimeline - User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    console.log('✅ getUserActivityTimeline - User found:', { userId: user._id, name: user.name });

    // Get user's orders
    console.log('📅 getUserActivityTimeline - Fetching user orders...');
    const orders = await Order.find({ user: userId })
      .select('orderNumber totalAmount status createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    console.log('📅 getUserActivityTimeline - Orders fetched:', orders.length);

    // Get user's payments - placeholder since payment model doesn't exist
    const payments = [];
    console.log('📅 getUserActivityTimeline - Payments placeholder (model not available)');

    // Get user's reviews
    console.log('📅 getUserActivityTimeline - Fetching user reviews...');
    const reviews = await UserReview.find({ user: userId })
      .select('rating comment isApproved restaurant createdAt')
      .populate('restaurant', 'name logo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    console.log('📅 getUserActivityTimeline - Reviews fetched:', reviews.length);

    // Combine and sort all activities
    console.log('📅 getUserActivityTimeline - Combining and sorting activities...');
    const allActivities = [
      ...orders.map(order => ({
        type: 'order',
        id: order._id,
        title: `Order #${order.orderNumber}`,
        description: `Order placed for ₹${order.totalAmount}`,
        status: order.status,
        timestamp: order.createdAt,
        data: order
      })),
      // Payment activities - placeholder since payment model doesn't exist,
      ...reviews.map(review => ({
        type: 'review',
        id: review._id,
        title: `${review.rating}★ Review`,
        description: review.comment,
        status: review.isApproved ? 'approved' : 'pending',
        timestamp: review.createdAt,
        data: review
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log('📅 getUserActivityTimeline - Getting total counts...');
    const total = await Promise.all([
      Order.countDocuments({ user: userId }),
      Promise.resolve(0), // Payment count placeholder
      UserReview.countDocuments({ user: userId })
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0));

    const response = {
      success: true,
      count: allActivities.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: allActivities
    };

    console.log('✅ getUserActivityTimeline - Success response prepared:', {
      success: response.success,
      count: response.count,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getUserActivityTimeline - Error occurred:', {
      userId: req.params.userId,
      page: req.query.page,
      limit: req.query.limit,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity timeline',
      error: error.message
    });
  }
};

// @desc    Get user engagement metrics (Admin only)
// @route   GET /api/admin/users/:userId/activities/engagement
// @access  Private (Admin)
const getUserEngagementMetrics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { dateRange } = req.query;
    console.log('📈 getUserEngagementMetrics - Request received:', { 
      userId, 
      dateRange, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Check if user exists
    console.log('📈 getUserEngagementMetrics - Checking if user exists...');
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ getUserEngagementMetrics - User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    console.log('✅ getUserEngagementMetrics - User found:', { userId: user._id, name: user.name });

    let dateFilter = {};
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
        console.log('📈 getUserEngagementMetrics - Applied date filter:', { startDate, endDate });
      }
    }

    // User's order metrics
    console.log('📈 getUserEngagementMetrics - Getting order metrics...');
    const orderMetrics = await Order.aggregate([
      { $match: { user: user._id, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);
    console.log('📈 getUserEngagementMetrics - Order metrics completed:', orderMetrics[0] || {});

    // User's payment metrics - placeholder since payment model doesn't exist
    const paymentMetrics = [{ totalPayments: 0, successfulPayments: 0, totalAmount: 0 }];
    console.log('📈 getUserEngagementMetrics - Payment metrics placeholder (model not available)');

    // User's review metrics
    console.log('📈 getUserEngagementMetrics - Getting review metrics...');
    const reviewMetrics = await UserReview.aggregate([
      { $match: { user: user._id, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          approvedReviews: { $sum: { $cond: ['$isApproved', 1, 0] } }
        }
      }
    ]);
    console.log('📈 getUserEngagementMetrics - Review metrics completed:', reviewMetrics[0] || {});

    // Calculate engagement score
    console.log('📈 getUserEngagementMetrics - Calculating engagement score...');
    const orderScore = orderMetrics[0]?.totalOrders || 0;
    const reviewScore = reviewMetrics[0]?.totalReviews || 0;
    const paymentScore = 0; // Placeholder since payment model doesn't exist
    
    const engagementScore = Math.min(100, (orderScore * 10 + reviewScore * 15 + paymentScore * 5));
    console.log('📈 getUserEngagementMetrics - Engagement score calculated:', {
      orderScore,
      reviewScore,
      paymentScore,
      engagementScore
    });

    const response = {
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          joinedAt: user.createdAt
        },
        orders: orderMetrics[0] || { totalOrders: 0, totalSpent: 0, averageOrderValue: 0, lastOrderDate: null },
        payments: { totalPayments: 0, successfulPayments: 0, totalAmount: 0 },
        reviews: reviewMetrics[0] || { totalReviews: 0, averageRating: 0, approvedReviews: 0 },
        engagement: {
          score: engagementScore,
          level: engagementScore >= 80 ? 'High' : engagementScore >= 50 ? 'Medium' : 'Low',
          lastActivity: orderMetrics[0]?.lastOrderDate || user.createdAt
        }
      }
    };

    console.log('✅ getUserEngagementMetrics - Success response prepared:', {
      success: response.success,
      userId: response.data.user.id,
      engagementScore: response.data.engagement.score,
      engagementLevel: response.data.engagement.level
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getUserEngagementMetrics - Error occurred:', {
      userId: req.params.userId,
      dateRange: req.query.dateRange,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user engagement metrics',
      error: error.message
    });
  }
};

// Helper function to aggregate user activities
async function aggregateUserActivities(query, page, limit) {
  console.log('🔧 aggregateUserActivities - Starting aggregation:', { query, page, limit });
  
  // This is a placeholder implementation
  // In a real system, you'd have a dedicated activities collection
  // or use a more sophisticated aggregation pipeline
  
  const activities = [];
  
  // Get recent orders
  console.log('🔧 aggregateUserActivities - Fetching orders...');
  const orders = await Order.find(query)
    .populate('user', 'name phone profileImage')
    .populate('restaurant', 'name logo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  console.log('🔧 aggregateUserActivities - Orders fetched:', orders.length);

  orders.forEach(order => {
    activities.push({
      type: 'order',
      id: order._id,
      user: order.user,
      action: `Order #${order.orderNumber} placed`,
      amount: order.totalAmount,
      status: order.status,
      timestamp: order.createdAt,
      restaurant: order.restaurant
    });
  });

  console.log('🔧 aggregateUserActivities - Activities aggregated:', activities.length);
  return activities;
}

module.exports = {
  getAllActivities,
  getActivityById,
  getActivityStats,
  getUserActivityTimeline,
  getUserEngagementMetrics
};
