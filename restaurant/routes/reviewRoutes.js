const express = require('express');
const router = express.Router();
const reviewController = require('../controller/reviewController');
const authMiddleware = require('../../middlewres/auth');

console.log('🚀 [REVIEW_ROUTES] Review routes initialized');

// Get all reviews for current restaurant (authenticated restaurant)
router.get('/restaurant', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('⭐ [REVIEW_ROUTES] GET /restaurant - getReviewsForCurrentRestaurant route called');
  next();
}, reviewController.getReviewsForCurrentRestaurant);

// Get reviews by restaurant ID (public access)
router.get('/restaurant/:restaurantId', (req, res, next) => {
  console.log('⭐ [REVIEW_ROUTES] GET /restaurant/:restaurantId - getReviewsByRestaurant route called, Restaurant ID:', req.params.restaurantId);
  next();
}, reviewController.getReviewsByRestaurant);

// Get review statistics for current restaurant
router.get('/stats/restaurant', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('⭐ [REVIEW_ROUTES] GET /stats/restaurant - getReviewStatsForRestaurant route called');
  next();
}, reviewController.getReviewStatsForRestaurant);

// Get review statistics by restaurant ID (public access)
router.get('/stats/restaurant/:restaurantId', (req, res, next) => {
  console.log('⭐ [REVIEW_ROUTES] GET /stats/restaurant/:restaurantId - getReviewStatsByRestaurant route called, Restaurant ID:', req.params.restaurantId);
  next();
}, reviewController.getReviewStatsByRestaurant);

// Get review by ID (public access)
router.get('/:reviewId', (req, res, next) => {
  console.log('⭐ [REVIEW_ROUTES] GET /:reviewId - getReviewById route called, Review ID:', req.params.reviewId);
  next();
}, reviewController.getReviewById);

// Mark review as helpful/unhelpful (authenticated users)
router.patch('/:reviewId/helpful', authMiddleware(['user', 'restaurant', 'admin']), (req, res, next) => {
  console.log('⭐ [REVIEW_ROUTES] PATCH /:reviewId/helpful - markReviewHelpful route called, Review ID:', req.params.reviewId);
  next();
}, reviewController.markReviewHelpful);

// Report review (authenticated users)
router.patch('/:reviewId/report', authMiddleware(['user', 'restaurant', 'admin']), (req, res, next) => {
  console.log('⭐ [REVIEW_ROUTES] PATCH /:reviewId/report - reportReview route called, Review ID:', req.params.reviewId);
  next();
}, reviewController.reportReview);

// Health check endpoint (public access)
router.get('/health', (req, res) => {
  console.log('⭐ [REVIEW_ROUTES] GET /health - health check route called');
  res.status(200).json({
    success: true,
    message: 'Review service is running',
    timestamp: new Date().toISOString(),
    service: 'Review Service'
  });
});

console.log('✅ [REVIEW_ROUTES] All review routes configured successfully');

module.exports = router;
