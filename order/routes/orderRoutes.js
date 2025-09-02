const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const authMiddleware = require('../../middlewres/auth');

console.log('🚀 [ORDER_ROUTES] Order routes initialized');

// Create order from cart (User only)
router.post('/create-from-cart', authMiddleware(['user']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] POST /create-from-cart - createOrderFromCart route called');
  next();
}, orderController.createOrderFromCart);

// Create custom order (Admin/Restaurant only)
router.post('/create-custom', authMiddleware(['admin', 'restaurant']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] POST /create-custom - createCustomOrder route called');
  next();
}, orderController.createCustomOrder);

// Get all orders (with pagination and filters) - Admin only
router.get('/', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] GET / - getAllOrders route called');
  next();
}, orderController.getAllOrders);

// Get orders for authenticated restaurant (current user) - MUST come BEFORE /:orderId route
router.get('/restaurant', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] GET /restaurant - getOrdersForCurrentRestaurant route called');
  next();
}, orderController.getOrdersForCurrentRestaurant);

// Get orders by customer ID (User can see their own, Admin can see all)
router.get('/customer/:customerId', authMiddleware(['user', 'admin']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] GET /customer/:customerId - getOrdersByCustomer route called, Customer ID:', req.params.customerId);
  next();
}, orderController.getOrdersByCustomer);

// Get orders by restaurant ID (Restaurant can see their own, Admin can see all)
router.get('/restaurant/:restaurantId', authMiddleware(['restaurant', 'admin']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] GET /restaurant/:restaurantId - getOrdersByRestaurant route called, Restaurant ID:', req.params.restaurantId);
  next();
}, orderController.getOrdersByRestaurant);

// Get order by ID (User, Restaurant, Admin)
router.get('/:orderId', authMiddleware(['user', 'restaurant', 'admin']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] GET /:orderId - getOrderById route called, ID:', req.params.orderId);
  next();
}, orderController.getOrderById);

// Update order status (Restaurant, Admin)
router.patch('/:orderId/status', authMiddleware(['restaurant', 'admin']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] PATCH /:orderId/status - updateOrderStatus route called, ID:', req.params.orderId);
  next();
}, orderController.updateOrderStatus);

// Cancel order (User can cancel their own, Restaurant/Admin can cancel any)
router.patch('/:orderId/cancel', authMiddleware(['user', 'restaurant', 'admin']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] PATCH /:orderId/cancel - cancelOrder route called, ID:', req.params.orderId);
  next();
}, orderController.cancelOrder);

// Delete order (soft delete) - Admin only
router.delete('/:orderId', authMiddleware(['admin']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] DELETE /:orderId - deleteOrder route called, ID:', req.params.orderId);
  next();
}, orderController.deleteOrder);

// Get order statistics (Admin, Restaurant can see their own)
router.get('/stats/overview', authMiddleware(['admin', 'restaurant']), (req, res, next) => {
  console.log('📦 [ORDER_ROUTES] GET /stats/overview - getOrderStats route called');
  next();
}, orderController.getOrderStats);

// Health check endpoint (Public access)
router.get('/health', (req, res) => {
  console.log('📦 [ORDER_ROUTES] GET /health - health check route called');
  res.status(200).json({
    success: true,
    message: 'Order service is running',
    timestamp: new Date().toISOString(),
    service: 'Order Service'
  });
});

console.log('✅ [ORDER_ROUTES] All order routes configured successfully');

module.exports = router;
