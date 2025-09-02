const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllPlans,
  getPlanById,
  togglePlanStatus,
  getPlanStats
} = require('../../controller/restaurantController/planController');

// @route   GET /api/admin/plans
router.get('/', authMiddleware(['admin']), getAllPlans);

// @route   GET /api/admin/plans/stats
router.get('/stats', authMiddleware(['admin']), getPlanStats);

// @route   GET /api/admin/plans/:id
router.get('/:id', authMiddleware(['admin']), getPlanById);

// @route   PUT /api/admin/plans/:id/toggle-status
router.put('/:id/toggle-status', authMiddleware(['admin']), togglePlanStatus);

module.exports = router;
