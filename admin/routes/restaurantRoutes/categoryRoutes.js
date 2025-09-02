const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllCategories,
  getCategoryById,
  toggleCategoryStatus,
  updateCategoryItemCount,
  getCategoryStats
} = require('../../controller/restaurantController/categoryController');

// @route   GET /api/admin/categories
router.get('/', authMiddleware(['admin']), getAllCategories);

// @route   GET /api/admin/categories/stats
router.get('/stats', authMiddleware(['admin']), getCategoryStats);

// @route   GET /api/admin/categories/:id
router.get('/:id', authMiddleware(['admin']), getCategoryById);

// @route   PUT /api/admin/categories/:id/toggle-status
router.put('/:id/toggle-status', authMiddleware(['admin']), toggleCategoryStatus);

// @route   PUT /api/admin/categories/:id/update-item-count
router.put('/:id/update-item-count', authMiddleware(['admin']), updateCategoryItemCount);

module.exports = router;
