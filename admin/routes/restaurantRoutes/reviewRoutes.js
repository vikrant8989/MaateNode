const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllReviews,
  getReviewById,
  toggleReviewVisibility,
  flagReview,
  getReviewStats
} = require('../../controller/restaurantController/reviewController');

// @route   GET /api/admin/reviews
router.get('/', authMiddleware(['admin']), getAllReviews);

// @route   GET /api/admin/reviews/stats
router.get('/stats', authMiddleware(['admin']), getReviewStats);

// @route   GET /api/admin/reviews/:id
router.get('/:id', authMiddleware(['admin']), getReviewById);

// @route   PUT /api/admin/reviews/:id/toggle-visibility
router.put('/:id/toggle-visibility', authMiddleware(['admin']), toggleReviewVisibility);

// @route   PUT /api/admin/reviews/:id/flag
router.put('/:id/flag', authMiddleware(['admin']), flagReview);

module.exports = router;
