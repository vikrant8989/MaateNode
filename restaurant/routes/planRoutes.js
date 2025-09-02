const express = require('express');
const router = express.Router();
const planController = require('../controller/planController');
const authMiddleware = require('../../middlewres/auth');

console.log('🚀 [PLAN_ROUTES] Plan routes initialized');

// Plan CRUD Routes
router.post('/', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('➕ [PLAN_ROUTES] POST / - createPlan route called');
  next();
}, planController.createPlan);

router.get('/', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('📋 [PLAN_ROUTES] GET / - getAllPlans route called');
  next();
}, planController.getAllPlans);

router.get('/stats', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('📊 [PLAN_ROUTES] GET /stats - getAllPlanStats route called');
  next();
}, planController.getAllPlanStats);

router.get('/:id', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('🔍 [PLAN_ROUTES] GET /:id - getPlanById route called, ID:', req.params.id);
  next();
}, planController.getPlanById);

router.put('/:id', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('✏️ [PLAN_ROUTES] PUT /:id - updatePlan route called, ID:', req.params.id);
  next();
}, planController.updatePlan);

router.delete('/:id', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('🗑️ [PLAN_ROUTES] DELETE /:id - deletePlan route called, ID:', req.params.id);
  next();
}, planController.deletePlan);

// Plan Availability Toggle Route
router.put('/:id/toggle-availability', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('🔄 [PLAN_ROUTES] PUT /:id/toggle-availability - togglePlanAvailability route called, ID:', req.params.id);
  next();
}, planController.togglePlanAvailability);

// Plan Statistics Routes
router.get('/:id/stats', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('📈 [PLAN_ROUTES] GET /:id/stats - getPlanStats route called, ID:', req.params.id);
  next();
}, planController.getPlanStats);

// Meal Management Routes
router.put('/:id/meals', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('🍽️ [PLAN_ROUTES] PUT /:id/meals - updateMeal route called, ID:', req.params.id);
  next();
}, planController.updateMeal);

// Feature Management Routes
router.post('/:id/features', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('✨ [PLAN_ROUTES] POST /:id/features - addFeature route called, ID:', req.params.id);
  next();
}, planController.addFeature);

router.delete('/:id/features', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('🗑️ [PLAN_ROUTES] DELETE /:id/features - removeFeature route called, ID:', req.params.id);
  next();
}, planController.removeFeature);

console.log('✅ [PLAN_ROUTES] All plan routes configured successfully');

module.exports = router; 