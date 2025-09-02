const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllReviews,
  getReviewById,
  getReviewStats,
  getFlaggedReviews,
  getPendingReviews,
  approveReview,
  rejectReview,
  flagReview,
  unflagReview,
  toggleReviewVisibility,
  toggleReviewFeature,
  deleteReview,
  getReviewReports,
  resolveReviewReports
} = require('../../controller/userController/reviewController');

// @route   GET /api/admin/users/:userId/reviews - Get all reviews for a specific user
router.get('/:userId', authMiddleware(['admin']), async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Import the Review model
    const Review = require('../../../restaurant/modal/review');
    
    console.log('🔍 [REVIEW_ROUTE] Searching for reviews with customer ID:', userId);
    console.log('🔍 [REVIEW_ROUTE] Review model imported successfully');
    
    // Check total reviews in collection
    const totalReviews = await Review.countDocuments();
    console.log('🔍 [REVIEW_ROUTE] Total reviews in collection:', totalReviews);
    
    // Check if any reviews exist for this customer
    const customerReviewsCount = await Review.countDocuments({ customer: userId });
    console.log('🔍 [REVIEW_ROUTE] Reviews count for customer:', customerReviewsCount);
    
    // Find all reviews by this user
    const reviews = await Review.find({ customer: userId })
      .populate('restaurant', 'businessName logo address city state')
      .sort({ reviewDate: -1 });
    
    console.log('🔍 [REVIEW_ROUTE] Found reviews count:', reviews.length);
    console.log('🔍 [REVIEW_ROUTE] First review sample:', reviews[0] ? {
      id: reviews[0]._id,
      customer: reviews[0].customer,
      restaurant: reviews[0].restaurant,
      rating: reviews[0].rating
    } : 'No reviews found');
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/:userId/reviews/:reviewId - Get specific review for specific user
router.get('/:userId/:reviewId', authMiddleware(['admin']), async (req, res) => {
  const { userId, reviewId } = req.params;
  
  try {
    // Import the Review model
    const Review = require('../../../restaurant/modal/review');
    
    // Find the specific review by this user
    const review = await Review.findOne({ _id: reviewId, customer: userId })
      .populate('restaurant', 'businessName logo address city state')
      .populate('customer', 'name phone profileImage');
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found for this user'
      });
    }
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user review',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/reviews
router.get('/', authMiddleware(['admin']), getAllReviews);

// @route   GET /api/admin/users/reviews/stats
router.get('/stats', authMiddleware(['admin']), getReviewStats);

// @route   GET /api/admin/users/reviews/flagged
router.get('/flagged', authMiddleware(['admin']), getFlaggedReviews);

// @route   GET /api/admin/users/reviews/pending
router.get('/pending', authMiddleware(['admin']), getPendingReviews);

// @route   GET /api/admin/users/reviews/:id
router.get('/:id', authMiddleware(['admin']), getReviewById);

// @route   PUT /api/admin/users/reviews/:id/approve
router.put('/:id/approve', authMiddleware(['admin']), approveReview);

// @route   PUT /api/admin/users/reviews/:id/reject
router.put('/:id/reject', authMiddleware(['admin']), rejectReview);

// @route   PUT /api/admin/users/reviews/:id/flag
router.put('/:id/flag', authMiddleware(['admin']), flagReview);

// @route   PUT /api/admin/users/reviews/:id/unflag
router.put('/:id/unflag', authMiddleware(['admin']), unflagReview);

// @route   PUT /api/admin/users/reviews/:id/toggle-visibility
router.put('/:id/toggle-visibility', authMiddleware(['admin']), toggleReviewVisibility);

// @route   PUT /api/admin/users/reviews/:id/feature
router.put('/:id/feature', authMiddleware(['admin']), toggleReviewFeature);

// @route   DELETE /api/admin/users/reviews/:id
router.delete('/:id', authMiddleware(['admin']), deleteReview);

// @route   GET /api/admin/users/reviews/:id/reports
router.get('/:id/reports', authMiddleware(['admin']), getReviewReports);

// @route   PUT /api/admin/users/reviews/:id/reports/resolve
router.put('/:id/reports/resolve', authMiddleware(['admin']), resolveReviewReports);

module.exports = router;
