const express = require('express');
const router = express.Router();
const orderController = require('../../controller/orderController/orderController');
const authMiddleware = require('../../../middlewres/auth');

console.log('🚀 [ADMIN_ORDER_ROUTES] Admin order routes initialized');

// Get all orders (Admin only) - with pagination and filters
router.get('/', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ADMIN_ORDER_ROUTES] GET / - getAllOrders route called');
  next();
}, orderController.getAllOrders);

// Get orders by restaurant ID (Admin only) - MUST come before /:orderId
router.get('/restaurant/:restaurantId', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ADMIN_ORDER_ROUTES] GET /restaurant/:restaurantId - getOrdersByRestaurant route called, Restaurant ID:', req.params.restaurantId);
  next();
}, orderController.getOrdersByRestaurant);

// Get orders by customer ID (Admin only) - MUST come before /:orderId
router.get('/customer/:customerId', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ADMIN_ORDER_ROUTES] GET /customer/:customerId - getOrdersByCustomer route called, Customer ID:', req.params.customerId);
  next();
}, orderController.getOrdersByCustomer);

// Get order statistics (Admin only) - MUST come before /:orderId
router.get('/stats/overview', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ADMIN_ORDER_ROUTES] GET /stats/overview - getOrderStats route called');
  next();
}, orderController.getOrderStats);

// Health check endpoint (Public access) - MUST come before /:orderId
router.get('/health', (req, res) => {
  console.log('📦 [ADMIN_ORDER_ROUTES] GET /health - health check route called');
  res.status(200).json({
    success: true,
    message: 'Admin Order service is running',
    timestamp: new Date().toISOString(),
    service: 'Admin Order Service'
  });
});

// Get order by ID (Admin only) - MUST come after specific routes
router.get('/:orderId', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ADMIN_ORDER_ROUTES] GET /:orderId - getOrderById route called, ID:', req.params.orderId);
  next();
}, orderController.getOrderById);

// Update order status (Admin only)
router.patch('/:orderId/status', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ADMIN_ORDER_ROUTES] PATCH /:orderId/status - updateOrderStatus route called, ID:', req.params.orderId);
  next();
}, orderController.updateOrderStatus);

// Cancel order (Admin only)
router.patch('/:orderId/cancel', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ADMIN_ORDER_ROUTES] PATCH /:orderId/cancel - cancelOrder route called, ID:', req.params.orderId);
  next();
}, orderController.cancelOrder);

// Delete order (soft delete) - Admin only
router.delete('/:orderId', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ADMIN_ORDER_ROUTES] DELETE /:orderId - deleteOrder route called, ID:', req.params.orderId);
  next();
}, orderController.deleteOrder);

console.log('✅ [ADMIN_ORDER_ROUTES] All admin order routes configured successfully');

module.exports = router;
