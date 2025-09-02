const Order = require('../modal/order');
const Cart = require('../../user/modal/cart');
const User = require('../../user/modal/user');
const Restaurant = require('../../restaurant/modal/restaurant');

// Create order from cart
const createOrderFromCart = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Creating order from cart:', req.body);
    
    const { userId, restaurantId, deliveryAddress, specialInstructions } = req.body;
    
    // Validate required fields
    if (!userId || !restaurantId || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, restaurantId, deliveryAddress'
      });
    }
    
    // Validate delivery address structure
    if (!deliveryAddress.street || !deliveryAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address must have street and city'
      });
    }
    
    // Find user's cart for this restaurant
    const cart = await Cart.findActiveCart(userId, restaurantId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty or not found'
      });
    }
    
    console.log('📦 [ORDER_CONTROLLER] Cart found:', {
      cartId: cart._id,
      itemCount: cart.items.length,
      total: cart.total,
      subtotal: cart.subtotal,
      items: cart.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        itemTotal: item.itemTotal
      }))
    });
    
    // Validate cart items have required fields
    for (const item of cart.items) {
      if (!item.itemId || !item.name || !item.price || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Invalid cart item: missing required fields for item ${item.name || 'unknown'}`
        });
      }
    }
    
    // Get user and restaurant details
    const user = await User.findById(userId);
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Validate restaurant name
    const resFirstName = restaurant.firstName || '';
    const resLastName = restaurant.lastName || '';
    const restaurantName = restaurant.businessName || `${resFirstName} ${resLastName}`.trim();
    if (!restaurantName || restaurantName === '') {
      return res.status(400).json({
        success: false,
        message: 'Restaurant name is missing or invalid'
      });
    }
    
    // Validate user name
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const customerName = `${firstName} ${lastName}`.trim() || user.email || 'Unknown Customer';
    if (!customerName || customerName === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer name is missing or invalid'
      });
    }
    
    console.log('📦 [ORDER_CONTROLLER] User and restaurant found:', {
      userName: customerName,
      restaurantName: restaurantName
    });
    
    // Generate unique order number
    const orderNumber = Order.generateOrderNumber();
    
    // Calculate totals from cart
    const subtotal = cart.total || cart.subtotal || 0;
    const totalAmount = subtotal; // No delivery fee for now
    
    // Validate totals
    if (subtotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart total must be greater than 0'
      });
    }
    
    console.log('📦 [ORDER_CONTROLLER] Totals calculated:', {
      cartTotal: cart.total,
      cartSubtotal: cart.subtotal,
      calculatedSubtotal: subtotal,
      calculatedTotal: totalAmount
    });
    
    // Create order object with ALL required fields
    const orderData = {
      orderNumber,
      orderDate: new Date(),
      orderTime: new Date(),
      customer: userId,
      customerName: customerName,
      restaurant: restaurantId,
      restaurantName: restaurantName,
      items: cart.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        description: item.description || '',
        price: item.price,
        quantity: item.quantity,
        image: item.image || '',
        category: item.category || 'General',
        itemTotal: item.itemTotal || (item.price * item.quantity)
      })),
      subtotal: subtotal,
      totalAmount: totalAmount,
      deliveryAddress,
      specialInstructions: specialInstructions || '',
      estimatedDelivery: '15-20 min' // Default value
    };
    
    console.log('📦 [ORDER_CONTROLLER] Order data prepared:', {
      orderNumber,
      customerName: orderData.customerName,
      restaurantName: orderData.restaurantName,
      subtotal,
      totalAmount,
      itemCount: orderData.items.length,
      items: orderData.items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        itemTotal: item.itemTotal
      }))
    });
    
    // Create new order
    const order = new Order(orderData);
    
    console.log('📦 [ORDER_CONTROLLER] Order instance created:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      restaurantName: order.restaurantName,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount
    });
    
    // Calculate totals using the model method
    order.calculateTotals();
    
    console.log('📦 [ORDER_CONTROLLER] After calculateTotals:', {
      subtotal: order.subtotal,
      totalAmount: order.totalAmount
    });
    
    // Save the order
    await order.save();
    
    // Clear the cart after successful order creation
    await cart.clearCart();
    
    console.log('📦 [ORDER_CONTROLLER] Order created successfully:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount
    });
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount
      }
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create custom order
const createCustomOrder = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Creating custom order:', req.body);
    
    const {
      customer,
      customerName,
      restaurant,
      restaurantName,
      items,
      deliveryAddress,
      specialInstructions,
      estimatedDelivery
    } = req.body;
    
    // Validate required fields
    if (!customer || !customerName || !restaurant || !restaurantName || !items || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Generate unique order number
    const orderNumber = Order.generateOrderNumber();
    
    // Create order object
    const orderData = {
      orderNumber,
      customer,
      customerName,
      restaurant,
      restaurantName,
      items,
      deliveryAddress,
      specialInstructions: specialInstructions || '',
      estimatedDelivery: estimatedDelivery || '15-20 min'
    };
    
    // Create new order
    const order = new Order(orderData);
    await order.save();
    
    console.log('📦 [ORDER_CONTROLLER] Custom order created successfully:', order._id);
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount
      }
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error creating custom order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all orders (with pagination and filters)
const getAllOrders = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Getting all orders with filters:', req.query);
    
    const {
      page = 1,
      limit = 10,
      status,
      customer,
      restaurant,
      startDate,
      endDate,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    if (restaurant) filter.restaurant = restaurant;
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    
    console.log('📦 [ORDER_CONTROLLER] Orders retrieved successfully:', orders.length);
    
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Getting order by ID:', req.params.orderId);
    
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name address phone')
      .populate('items.itemId', 'name description image category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    console.log('📦 [ORDER_CONTROLLER] Order retrieved successfully:', orderId);
    
    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: order
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get orders by customer ID
const getOrdersByCustomer = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Getting orders by customer:', req.params.customerId);
    
    const { customerId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = { customer: customerId };
    if (status) filter.status = status;
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const orders = await Order.find(filter)
      .populate('restaurant', 'name')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    
    console.log('📦 [ORDER_CONTROLLER] Customer orders retrieved successfully:', orders.length);
    
    res.status(200).json({
      success: true,
      message: 'Customer orders retrieved successfully',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error getting customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get orders by restaurant ID
const getOrdersByRestaurant = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Getting orders by restaurant:', req.params.restaurantId);
    
    const { restaurantId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = { restaurant: restaurantId };
    if (status) filter.status = status;
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    
    console.log('📦 [ORDER_CONTROLLER] Restaurant orders retrieved successfully:', orders.length);
    
    res.status(200).json({
      success: true,
      message: 'Restaurant orders retrieved successfully',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error getting restaurant orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get orders for authenticated restaurant (current user)
const getOrdersForCurrentRestaurant = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Getting orders for current restaurant:', req.user.id);
    
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter - use the authenticated restaurant's ID
    const filter = { restaurant: req.user.id };
    
    // Only add status filter if it's provided AND not empty
    if (status && status.trim() !== '') {
      filter.status = status;
          console.log('📦 [ORDER_CONTROLLER] Applied status filter:', status);
  } else {
    console.log('📦 [ORDER_CONTROLLER] No status filter applied, showing all orders');
  }
  
  console.log('📦 [ORDER_CONTROLLER] Final filter:', JSON.stringify(filter, null, 2));
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const orders = await Order.find(filter)
      .populate('customer', 'firstName lastName email phone')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    
    console.log('📦 [ORDER_CONTROLLER] Orders found:', orders.length);
    console.log('📦 [ORDER_CONTROLLER] Total orders for restaurant:', totalOrders);
    
    res.status(200).json({
      success: true,
      message: 'Restaurant orders retrieved successfully',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error getting current restaurant orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Updating order status:', req.params.orderId, req.body);
    
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update status
    await order.updateStatus(status);
    
    console.log('📦 [ORDER_CONTROLLER] Order status updated successfully:', orderId, status);
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order._id,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Cancelling order:', req.params.orderId, req.body);
    
    const { orderId } = req.params;
    const { reason, cancelledBy } = req.body;
    
    if (!reason || !cancelledBy) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason and cancelledBy are required'
      });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order can be cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in current status'
      });
    }
    
    // Cancel order
    await order.cancelOrder(reason, cancelledBy);
    
    console.log('📦 [ORDER_CONTROLLER] Order cancelled successfully:', orderId);
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order._id,
        status: order.status,
        cancellationReason: order.cancellationReason,
        cancelledBy: order.cancelledBy
      }
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete order (soft delete)
const deleteOrder = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Deleting order:', req.params.orderId);
    
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Soft delete - mark as archived
    order.isArchived = true;
    await order.save();
    
    console.log('📦 [ORDER_CONTROLLER] Order deleted successfully:', orderId);
    
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    console.log('📦 [ORDER_CONTROLLER] Getting order statistics');
    
    const { customerId, startDate, endDate } = req.query;
    
    // Build filter - for restaurants, only show their own stats
    const filter = {};
    if (customerId) filter.customer = customerId;
    
    // If user is a restaurant, filter by their ID
    if (req.user && req.user.role === 'restaurant') {
      filter.restaurant = req.user.id;
      console.log('📦 [ORDER_CONTROLLER] Filtering stats for restaurant:', req.user.id);
    }
    
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }
    
    // Get counts by status
    const statusCounts = await Order.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get total orders and revenue
    const totals = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    // Get daily orders for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          ...filter,
          orderDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const stats = {
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totals: totals[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
      dailyOrders
    };
    
    console.log('📦 [ORDER_CONTROLLER] Order statistics retrieved successfully');
    
    res.status(200).json({
      success: true,
      message: 'Order statistics retrieved successfully',
      data: stats
    });
    
  } catch (error) {
    console.error('📦 [ORDER_CONTROLLER] Error getting order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createOrderFromCart,
  createCustomOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  getOrdersByRestaurant,
  getOrdersForCurrentRestaurant,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getOrderStats
};
