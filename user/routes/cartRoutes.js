const express = require('express');
const router = express.Router();
const cartController = require('../controller/cartController');
const authMiddleware = require('../../middlewres/auth');

console.log('🛒 [CART_ROUTES] Cart routes initialized');

// Get all user carts from all restaurants
router.get('/all', authMiddleware(['user']), (req, res, next) => {
  console.log('🛒 [CART_ROUTES] GET /all - getAllUserCarts route called');
  next();
}, cartController.getAllUserCarts);

// Get user's cart for a specific restaurant
router.get('/:restaurantId', authMiddleware(['user']), (req, res, next) => {
  console.log('🛒 [CART_ROUTES] GET /:restaurantId - getUserCart route called, Restaurant ID:', req.params.restaurantId);
  next();
}, cartController.getUserCart);

// Add item to cart
router.post('/add-item', authMiddleware(['user']), (req, res, next) => {
  console.log('➕ [CART_ROUTES] POST /add-item - addItemToCart route called');
  next();
}, cartController.addItemToCart);

// Update item quantity in cart
router.put('/update-quantity', authMiddleware(['user']), (req, res, next) => {
  console.log('✏️ [CART_ROUTES] PUT /update-quantity - updateItemQuantity route called');
  next();
}, cartController.updateItemQuantity);

// Remove item from cart
router.delete('/remove-item', authMiddleware(['user']), (req, res, next) => {
  console.log('🗑️ [CART_ROUTES] DELETE /remove-item - removeItemFromCart route called');
  next();
}, cartController.removeItemFromCart);

// Clear cart
router.delete('/:restaurantId/clear', authMiddleware(['user']), (req, res, next) => {
  console.log('🧹 [CART_ROUTES] DELETE /:restaurantId/clear - clearCart route called, Restaurant ID:', req.params.restaurantId);
  next();
}, cartController.clearCart);

// Get cart summary
router.get('/:restaurantId/summary', authMiddleware(['user']), (req, res, next) => {
  console.log('📊 [CART_ROUTES] GET /:restaurantId/summary - getCartSummary route called, Restaurant ID:', req.params.restaurantId);
  next();
}, cartController.getCartSummary);

console.log('✅ [CART_ROUTES] All cart routes configured successfully');

module.exports = router;
