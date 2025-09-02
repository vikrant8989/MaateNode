const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllItems,
  getItemById,
  toggleItemStatus,
  updateItemAvailability,
  getItemStats
} = require('../../controller/restaurantController/itemController');

// @route   GET /api/admin/items
router.get('/', authMiddleware(['admin']), getAllItems);

// @route   GET /api/admin/items/stats
router.get('/stats', authMiddleware(['admin']), getItemStats);

// @route   GET /api/admin/items/:id
router.get('/:id', authMiddleware(['admin']), getItemById);

// @route   PUT /api/admin/items/:id/toggle-status
router.put('/:id/toggle-status', authMiddleware(['admin']), toggleItemStatus);

// @route   PUT /api/admin/items/:id/availability
router.put('/:id/availability', authMiddleware(['admin']), updateItemAvailability);

module.exports = router;
