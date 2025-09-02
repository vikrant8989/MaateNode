const express = require('express');
const router = express.Router();
const userPlanController = require('../controller/userPlanController');

console.log('🚀 [USER_PLAN_ROUTES] User plan routes initialized');

// Get all plans for a specific restaurant (public access)
router.get('/restaurant/:restaurantId', (req, res, next) => {
  console.log('📋 [USER_PLAN_ROUTES] GET /restaurant/:restaurantId - getPlansByRestaurant route called, Restaurant ID:', req.params.restaurantId);
  next();
}, userPlanController.getPlansByRestaurant);

// Get plan by ID (public access)
router.get('/:id', (req, res, next) => {
  console.log('🔍 [USER_PLAN_ROUTES] GET /:id - getPlanById route called, Plan ID:', req.params.id);
  next();
}, userPlanController.getPlanById);

// Get plan statistics (public access)
router.get('/:id/stats', (req, res, next) => {
  console.log('📈 [USER_PLAN_ROUTES] GET /:id/stats - getPlanStats route called, Plan ID:', req.params.id);
  next();
}, userPlanController.getPlanStats);

console.log('✅ [USER_PLAN_ROUTES] All user plan routes configured successfully');

module.exports = router;
