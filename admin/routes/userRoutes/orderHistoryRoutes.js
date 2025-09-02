const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const mongoose = require('mongoose');
const Order = require('../../../order/modal/order');
const {
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  getOrderStats,
  getOrderItems,
  processRefund,
  handleOrderDispute
} = require('../../controller/userController/orderHistoryController');

// @route   GET /api/admin/users/orders
router.get('/', authMiddleware(['admin']), getAllOrders);

// @route   GET /api/admin/users/orders/stats
router.get('/stats', authMiddleware(['admin']), getOrderStats);

// @route   GET /api/admin/users/orders/user/:userId
router.get('/user/:userId', authMiddleware(['admin']), getOrdersByUserId);

// @route   GET /api/admin/users/orders/:userId/:orderId - Get specific order for specific user
router.get('/:userId/:orderId', authMiddleware(['admin']), async (req, res) => {
  const { userId, orderId } = req.params;
  
  console.log('📦 Route handler - Request received for user ID:', userId, 'and order ID:', orderId);
  
  // Validate both IDs
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID or order ID format'
    });
  }
  
  try {
    // Find the specific order for the specific user
    const order = await Order.findOne({ _id: orderId, customer: userId })
      .populate('customer', 'name phone profileImage')
      .populate('restaurant', 'businessName logo address city state')
      .populate('items.itemId', 'name description price image');
    
    if (!order) {
      console.log('📦 Route handler - Order not found for user:', userId, 'order:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found for this user'
      });
    }
    
    console.log('📦 Route handler - Order found successfully');
    return res.status(200).json({
      success: true,
      data: order
    });
    
  } catch (error) {
    console.error('📦 Route handler - Error finding order:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/orders/:id - This can be either order ID or user ID
router.get('/:id', authMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;
  
  console.log('📦 Route handler - Request received for ID:', id);
  console.log('📦 Route handler - ID length:', id.length);
  console.log('📦 Route handler - ID format valid:', /^[0-9a-fA-F]{24}$/.test(id));
  
  // Check if this looks like a user ID (24 character hex string)
  if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
    // This could be either a user ID or order ID
    // First try to find orders by user ID
    try {
      console.log('📦 Route handler - Trying to find orders by user ID:', id);
      const orders = await Order.find({ customer: id })
        .populate('customer', 'name phone profileImage')
        .populate('restaurant', 'businessName logo address city state')
        .populate('items.itemId', 'name description price image')
        .sort({ orderDate: -1 });
      
      console.log('📦 Route handler - Found orders by user ID:', orders.length);
      
      if (orders.length > 0) {
        // If we found orders, return them
        return res.status(200).json({
          success: true,
          count: orders.length,
          data: orders
        });
      }
    } catch (error) {
      console.log('📦 Route handler - Error finding orders by user ID:', error.message);
    }
    
    // If no orders found by user ID, try to find by order ID
    try {
      console.log('📦 Route handler - Trying to find order by order ID:', id);
      const order = await Order.findById(id)
        .populate('customer', 'name phone profileImage')
        .populate('restaurant', 'businessName logo address city state')
        .populate('items.itemId', 'name description price image');
      
      console.log('📦 Route handler - Found order by order ID:', order ? 'Yes' : 'No');
      
      if (order) {
        return res.status(200).json({
          success: true,
          data: order
        });
      }
    } catch (error) {
      console.log('📦 Route handler - Error finding order by ID:', error.message);
    }
    
    // If neither found, return 404
    return res.status(404).json({
      success: false,
      message: 'No orders found for this ID'
    });
  } else {
    // Not a valid ObjectId format
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
});

// @route   GET /api/admin/users/orders/:id/items
router.get('/:id/items', authMiddleware(['admin']), getOrderItems);

// @route   PUT /api/admin/users/orders/:id/refund
router.put('/:id/refund', authMiddleware(['admin']), processRefund);

// @route   PUT /api/admin/users/orders/:id/dispute
router.put('/:id/dispute', authMiddleware(['admin']), handleOrderDispute);

module.exports = router;
