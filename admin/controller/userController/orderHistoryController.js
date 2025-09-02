const Order = require('../../../order/modal/order');
const User = require('../../../user/modal/user');
const mongoose = require('mongoose');

// @desc    Get all user orders (Admin only)
// @route   GET /api/admin/users/orders
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
  try {
    console.log('📦 getAllOrders - Request received:', { 
      query: req.query, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { status, restaurant, page = 1, limit = 10, search, dateRange } = req.query;
    console.log('📦 getAllOrders - Query parameters:', { status, restaurant, page, limit, search, dateRange });
    
    let query = {};
    
    // Status filter
    if (status) {
      query.status = status;
      console.log('📦 getAllOrders - Applied status filter:', status);
    }
    
    // Restaurant filter
    if (restaurant) {
      query.restaurant = restaurant;
      console.log('📦 getAllOrders - Applied restaurant filter:', restaurant);
    }
    
    // Date range filter
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
        console.log('📦 getAllOrders - Applied date range filter:', { startDate, endDate });
      }
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { restaurantName: { $regex: search, $options: 'i' } }
      ];
      console.log('📦 getAllOrders - Applied search filter:', search);
    }

    console.log('📦 getAllOrders - Final query object:', JSON.stringify(query, null, 2));
    console.log('📦 getAllOrders - Pagination:', { page, limit, skip: (page - 1) * limit });

    console.log('📦 getAllOrders - Executing database query...');
    const orders = await Order.find(query)
      .populate('customer', 'name phone profileImage')
      .populate('restaurant', 'businessName logo city state')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('📦 getAllOrders - Database query completed. Found orders count:', orders.length);

    console.log('📦 getAllOrders - Getting total count...');
    const total = await Order.countDocuments(query);
    console.log('📦 getAllOrders - Total orders count:', total);

    const response = {
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: orders
    };

    console.log('✅ getAllOrders - Success response prepared:', {
      success: response.success,
      count: response.count,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getAllOrders - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders',
      error: error.message
    });
  }
};

// @desc    Get order by ID (Admin only)
// @route   GET /api/admin/users/orders/:id
// @access  Private (Admin)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 getOrderById - Request received:', { 
      orderId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('📦 getOrderById - Executing database query...');
    console.log('📦 getOrderById - Order ID to search:', id);
    console.log('📦 getOrderById - Order ID type:', typeof id);
    console.log('📦 getOrderById - Order ID length:', id.length);
    
    // Check if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ getOrderById - Invalid ObjectId format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }
    
    // First, let's check if there are any orders in the collection
    const totalOrders = await Order.countDocuments();
    console.log('📦 getOrderById - Total orders in collection:', totalOrders);
    
    // Let's also check the collection name
    console.log('📦 getOrderById - Order collection name:', Order.collection.name);
    
    let order;
    try {
      order = await Order.findById(id)
        .populate('customer', 'name phone profileImage')
        .populate('restaurant', 'businessName logo address city state')
        .populate('items.itemId', 'name description price image');
      console.log('📦 getOrderById - Database query completed successfully');
    } catch (dbError) {
      console.error('❌ getOrderById - Database query error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred',
        error: dbError.message
      });
    }
    
    if (!order) {
      console.log('❌ getOrderById - Order not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ getOrderById - Order found successfully:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.user?._id,
      restaurantId: order.restaurant?._id,
      status: order.status
    });

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ getOrderById - Error occurred:', {
      orderId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user order',
      error: error.message
    });
  }
};

// @desc    Get orders by user ID (Admin only)
// @route   GET /api/admin/users/orders/user/:userId
// @access  Private (Admin)
const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📦 getOrdersByUserId - Request received:', { 
      userId, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('❌ getOrdersByUserId - Invalid user ID format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    console.log('📦 getOrdersByUserId - Executing database query...');
    
    // Find all orders for the specified user
    const orders = await Order.find({ customer: userId })
      .populate('customer', 'name phone profileImage')
      .populate('restaurant', 'businessName logo address city state')
      .populate('items.itemId', 'name description price image')
      .sort({ orderDate: -1 });

    console.log('📦 getOrdersByUserId - Found orders count:', orders.length);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('❌ getOrdersByUserId - Error occurred:', {
      userId: req.params.userId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders',
      error: error.message
    });
  }
};

// @desc    Get order statistics (Admin only)
// @route   GET /api/admin/users/orders/stats
// @access  Private (Admin)
const getOrderStats = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📊 getOrderStats - Request received:', { 
      user: req.user?.id,
      userId,
      timestamp: new Date().toISOString()
    });

    let query = {};
    if (userId) {
      query.customer = userId;
      console.log('📊 getOrderStats - Filtering for specific user:', userId);
    }

    console.log('📊 getOrderStats - Getting basic order counts...');
    const totalOrders = await Order.countDocuments(query);
    const pendingOrders = await Order.countDocuments({ ...query, status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ ...query, status: 'confirmed' });
    const preparingOrders = await Order.countDocuments({ ...query, status: 'preparing' });
    const readyOrders = await Order.countDocuments({ ...query, status: 'ready' });
    const deliveredOrders = await Order.countDocuments({ ...query, status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ ...query, status: 'cancelled' });

    console.log('📊 getOrderStats - Basic counts completed:', {
      total: totalOrders,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      preparing: preparingOrders,
      ready: readyOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders
    });

    // Revenue statistics
    console.log('📊 getOrderStats - Getting revenue statistics...');
    const revenueStats = await Order.aggregate([
      { $match: query },
      {
        $match: { status: { $in: ['delivered', 'ready'] } }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('📊 getOrderStats - Revenue stats completed:', revenueStats[0] || {});

    // Status distribution
    console.log('📊 getOrderStats - Getting status distribution...');
    const statusStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    console.log('📊 getOrderStats - Status distribution completed, count:', statusStats.length);

    // Monthly order count
    console.log('📊 getOrderStats - Getting monthly stats...');
    const monthlyStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    console.log('📊 getOrderStats - Monthly stats completed, count:', monthlyStats.length);

    const response = {
      success: true,
      data: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        preparing: preparingOrders,
        ready: readyOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        revenue: revenueStats[0] || { totalRevenue: 0, averageOrderValue: 0, count: 0 },
        statusDistribution: statusStats,
        monthlyTrend: monthlyStats
      }
    };

    console.log('✅ getOrderStats - Success response prepared:', {
      success: response.success,
      total: response.data.total,
      delivered: response.data.delivered,
      revenue: response.data.revenue
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getOrderStats - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message
    });
  }
};

// @desc    Get order items (Admin only)
// @route   GET /api/admin/users/orders/:id/items
// @access  Private (Admin)
const getOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 getOrderItems - Request received:', { 
      orderId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('📦 getOrderItems - Finding order...');
    const order = await Order.findById(id)
      .populate('items.item', 'name description price image category')
      .select('items totalAmount orderNumber');
    
    if (!order) {
      console.log('❌ getOrderItems - Order not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ getOrderItems - Order found successfully:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      itemsCount: order.items.length
    });

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        items: order.items
      }
    });

  } catch (error) {
    console.error('❌ getOrderItems - Error occurred:', {
      orderId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching order items',
      error: error.message
    });
  }
};

// @desc    Process order refund (Admin only)
// @route   PUT /api/admin/users/orders/:id/refund
// @access  Private (Admin)
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount, reason, adminNote } = req.body;
    console.log('💸 processRefund - Request received:', { 
      orderId: id, 
      refundAmount, 
      reason, 
      adminNote, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!refundAmount || refundAmount <= 0) {
      console.log('❌ processRefund - Invalid refund amount:', refundAmount);
      return res.status(400).json({
        success: false,
        message: 'Valid refund amount is required'
      });
    }

    if (!reason || reason.trim().length < 10) {
      console.log('❌ processRefund - Invalid refund reason:', reason);
      return res.status(400).json({
        success: false,
        message: 'Refund reason must be at least 10 characters'
      });
    }

    console.log('💸 processRefund - Validation passed, finding order...');
    const order = await Order.findById(id);
    
    if (!order) {
      console.log('❌ processRefund - Order not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('💸 processRefund - Order found:', { orderId: order._id, status: order.status, totalAmount: order.totalAmount });

    if (order.status !== 'delivered') {
      console.log('❌ processRefund - Order not delivered, cannot refund:', order.status);
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be refunded'
      });
    }

    if (refundAmount > order.totalAmount) {
      console.log('❌ processRefund - Refund amount exceeds order total:', { refundAmount, totalAmount: order.totalAmount });
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed order total'
      });
    }

    console.log('💸 processRefund - Processing refund...');
    order.refundAmount = refundAmount;
    order.refundReason = reason;
    order.adminNote = adminNote;
    order.refundedBy = req.user.id;
    order.refundedAt = new Date();
    order.status = 'refunded';

    console.log('💸 processRefund - Saving order...');
    await order.save();

    console.log('✅ processRefund - Refund processed successfully:', {
      orderId: order._id,
      refundAmount: order.refundAmount,
      refundedBy: order.refundedBy,
      refundedAt: order.refundedAt
    });

    res.status(200).json({
      success: true,
      message: 'Order refund processed successfully',
      data: order
    });

  } catch (error) {
    console.error('❌ processRefund - Error occurred:', {
      orderId: req.params.id,
      refundAmount: req.body.refundAmount,
      reason: req.body.reason,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

// @desc    Handle order dispute (Admin only)
// @route   PUT /api/admin/users/orders/:id/dispute
// @access  Private (Admin)
const handleOrderDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, resolution, adminNote } = req.body;
    console.log('⚖️ handleOrderDispute - Request received:', { 
      orderId: id, 
      action, 
      resolution, 
      adminNote, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!action || !['resolve', 'escalate', 'close'].includes(action)) {
      console.log('❌ handleOrderDispute - Invalid action:', action);
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be resolve, escalate, or close'
      });
    }

    if (!resolution || resolution.trim().length < 10) {
      console.log('❌ handleOrderDispute - Invalid resolution:', resolution);
      return res.status(400).json({
        success: false,
        message: 'Resolution must be at least 10 characters'
      });
    }

    console.log('⚖️ handleOrderDispute - Validation passed, finding order...');
    const order = await Order.findById(id);
    
    if (!order) {
      console.log('❌ handleOrderDispute - Order not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('⚖️ handleOrderDispute - Order found:', { orderId: order._id, status: order.status });

    console.log('⚖️ handleOrderDispute - Processing dispute...');
    order.disputeStatus = action;
    order.disputeResolution = resolution;
    order.adminNote = adminNote;
    order.disputeResolvedBy = req.user.id;
    order.disputeResolvedAt = new Date();

    if (action === 'resolve') {
      order.status = 'dispute_resolved';
      console.log('⚖️ handleOrderDispute - Setting status to dispute_resolved');
    } else if (action === 'escalate') {
      order.status = 'dispute_escalated';
      console.log('⚖️ handleOrderDispute - Setting status to dispute_escalated');
    } else if (action === 'close') {
      order.status = 'dispute_closed';
      console.log('⚖️ handleOrderDispute - Setting status to dispute_closed');
    }

    console.log('⚖️ handleOrderDispute - Saving order...');
    await order.save();

    console.log('✅ handleOrderDispute - Dispute handled successfully:', {
      orderId: order._id,
      action,
      disputeStatus: order.disputeStatus,
      disputeResolvedBy: order.disputeResolvedBy,
      disputeResolvedAt: order.disputeResolvedAt
    });

    res.status(200).json({
      success: true,
      message: `Order dispute ${action}d successfully`,
      data: order
    });

  } catch (error) {
    console.error('❌ handleOrderDispute - Error occurred:', {
      orderId: req.params.id,
      action: req.body.action,
      resolution: req.body.resolution,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error handling order dispute',
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  getOrderStats,
  getOrderItems,
  processRefund,
  handleOrderDispute
};
