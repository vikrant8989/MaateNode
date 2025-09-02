const Order = require('../../../order/modal/order');
const mongoose = require('mongoose');

console.log('🚀 [ADMIN_ORDER_CONTROLLER] Admin order controller initialized');

/**
 * Get all orders with pagination and filters (Admin only)
 */
const getAllOrders = async (req, res) => {
  try {
    console.log('🔍 [ADMIN_ORDER] getAllOrders called with query:', req.query);
    
    const { page = 1, limit = 10, status, paymentStatus, restaurant, customer, search, startDate, endDate } = req.query;
    
    // Log user making request
    console.log('🔍 [ADMIN_ORDER] User making request:', req.user._id, req.user.role);
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
      console.log('🔍 [ADMIN_ORDER] Filtering by status:', status);
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
      console.log('🔍 [ADMIN_ORDER] Filtering by payment status:', paymentStatus);
    }
    
    if (restaurant) {
      // Validate restaurant ID format
      if (!mongoose.Types.ObjectId.isValid(restaurant)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid restaurant ID format'
        });
      }
      query.restaurant = restaurant;
      console.log('🔍 [ADMIN_ORDER] Filtering by restaurant:', restaurant);
    }
    
    if (customer) {
      // Validate customer ID format
      if (!mongoose.Types.ObjectId.isValid(customer)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid customer ID format'
        });
      }
      query.customer = customer;
      console.log('🔍 [ADMIN_ORDER] Filtering by customer:', customer);
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { restaurantName: { $regex: search, $options: 'i' } }
      ];
      console.log('🔍 [ADMIN_ORDER] Filtering by search:', search);
    }
    
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
        console.log('🔍 [ADMIN_ORDER] Filtering by start date:', startDate);
      }
      if (endDate) {
        query.orderDate.$lte = new Date(endDate);
        console.log('🔍 [ADMIN_ORDER] Filtering by end date:', endDate);
      }
    }
    
    console.log('🔍 [ADMIN_ORDER] Final query:', query);

    console.log('🔍 [ADMIN_ORDER] Executing database query...');
    
    try {
      const orders = await Order.find(query)
        .populate('customer', 'name email phone')
        .populate('restaurant', 'businessName email phone city state')
        .sort({ orderDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Order.countDocuments(query);
      console.log('🔍 [ADMIN_ORDER] Found orders:', orders.length, 'Total:', total);

      res.status(200).json({
        success: true,
        count: orders.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: orders
      });
    } catch (dbError) {
      console.error('❌ [ADMIN_ORDER] Database query error:', dbError);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

  } catch (error) {
    console.error('❌ [ADMIN_ORDER] Get All Orders Error:', error);
    console.error('❌ [ADMIN_ORDER] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

/**
 * Get order by ID (Admin only)
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('🔍 [ADMIN_ORDER] getOrderById called for order ID:', orderId);

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'businessName email phone city state');

    if (!order) {
      console.log('❌ [ADMIN_ORDER] Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('🔍 [ADMIN_ORDER] Order found:', order._id);

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ [ADMIN_ORDER] Get Order By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

/**
 * Get orders by restaurant ID (Admin only)
 */
const getOrdersByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log('🔍 [ADMIN_ORDER] getOrdersByRestaurant called for restaurant ID:', restaurantId);

    // Validate restaurant ID format
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format'
      });
    }

    const { page = 1, limit = 10, status, paymentStatus, startDate, endDate } = req.query;
    
    // Build query
    const query = { restaurant: restaurantId };
    
    if (status) {
      query.status = status;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.orderDate.$lte = new Date(endDate);
      }
    }

    console.log('🔍 [ADMIN_ORDER] Query for restaurant orders:', query);

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'businessName email phone city state')
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);
    console.log('🔍 [ADMIN_ORDER] Found orders for restaurant:', orders.length, 'Total:', total);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: orders
    });

  } catch (error) {
    console.error('❌ [ADMIN_ORDER] Get Orders By Restaurant Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant orders',
      error: error.message
    });
  }
};

/**
 * Get orders by customer ID (Admin only)
 */
const getOrdersByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log('🔍 [ADMIN_ORDER] getOrdersByCustomer called for customer ID:', customerId);

    // Validate customer ID format
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    const { page = 1, limit = 10, status, paymentStatus, startDate, endDate } = req.query;
    
    // Build query
    const query = { customer: customerId };
    
    if (status) {
      query.status = status;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.orderDate.$lte = new Date(endDate);
      }
    }

    console.log('🔍 [ADMIN_ORDER] Query for customer orders:', query);

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'businessName email phone city state')
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);
    console.log('🔍 [ADMIN_ORDER] Found orders for customer:', orders.length, 'Total:', total);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: orders
    });

  } catch (error) {
    console.error('❌ [ADMIN_ORDER] Get Orders By Customer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer orders',
      error: error.message
    });
  }
};

/**
 * Update order status (Admin only)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;
    
    console.log('🔍 [ADMIN_ORDER] updateOrderStatus called for order ID:', orderId);
    console.log('🔍 [ADMIN_ORDER] New status:', status, 'Reason:', reason);

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ [ADMIN_ORDER] Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('🔍 [ADMIN_ORDER] Current order status:', order.status);
    console.log('🔍 [ADMIN_ORDER] Updating to new status:', status);

    // Update order status
    order.status = status;
    order.updatedAt = new Date();
    
    // If cancelling, add cancellation details
    if (status === 'cancelled' && reason) {
      order.cancellationReason = reason;
      order.cancelledBy = 'admin';
      order.cancellationTime = new Date();
    }

    await order.save();
    
    console.log('🔍 [ADMIN_ORDER] Order status updated successfully');

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status} successfully`,
      data: order
    });

  } catch (error) {
    console.error('❌ [ADMIN_ORDER] Update Order Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

/**
 * Cancel order (Admin only)
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    console.log('🔍 [ADMIN_ORDER] cancelOrder called for order ID:', orderId);
    console.log('🔍 [ADMIN_ORDER] Cancellation reason:', reason);

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ [ADMIN_ORDER] Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    console.log('🔍 [ADMIN_ORDER] Current order status:', order.status);
    console.log('🔍 [ADMIN_ORDER] Cancelling order...');

    // Cancel order using the schema method
    await order.cancelOrder(reason || 'Order cancelled by admin', 'admin');
    
    console.log('🔍 [ADMIN_ORDER] Order cancelled successfully');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    console.error('❌ [ADMIN_ORDER] Cancel Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

/**
 * Delete order (soft delete) - Admin only
 */
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('🔍 [ADMIN_ORDER] deleteOrder called for order ID:', orderId);

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ [ADMIN_ORDER] Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('🔍 [ADMIN_ORDER] Deleting order:', order._id);

    // For now, we'll do a hard delete. In production, you might want to add a 'deleted' field
    await Order.findByIdAndDelete(orderId);
    
    console.log('🔍 [ADMIN_ORDER] Order deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('❌ [ADMIN_ORDER] Delete Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
};

/**
 * Get order statistics (Admin only)
 */
const getOrderStats = async (req, res) => {
  try {
    console.log('🔍 [ADMIN_ORDER] getOrderStats called');

    const { startDate, endDate, restaurant } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) {
        dateFilter.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.orderDate.$lte = new Date(endDate);
      }
    }

    // Build restaurant filter
    if (restaurant) {
      if (!mongoose.Types.ObjectId.isValid(restaurant)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid restaurant ID format'
        });
      }
      dateFilter.restaurant = restaurant;
    }

    console.log('🔍 [ADMIN_ORDER] Stats query filter:', dateFilter);

    // Get total orders
    const totalOrders = await Order.countDocuments(dateFilter);
    
    // Get orders by status
    const statusStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get orders by payment status
    const paymentStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total revenue
    const revenueStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get daily orders for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyStats = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          orderDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = {
      totalOrders,
      statusBreakdown: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      paymentBreakdown: paymentStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      revenue: {
        total: revenueStats[0]?.totalRevenue || 0,
        average: revenueStats[0]?.avgOrderValue || 0
      },
      dailyStats: dailyStats
    };

    console.log('🔍 [ADMIN_ORDER] Stats calculated successfully');

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ [ADMIN_ORDER] Get Order Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByRestaurant,
  getOrdersByCustomer,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getOrderStats
};
