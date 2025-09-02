const Review = require('../../../restaurant/modal/review');
const Restaurant = require('../../../restaurant/modal/restaurant');
const mongoose = require('mongoose');

// @desc    Get all reviews (Admin only)
// @route   GET /api/admin/reviews
// @access  Private (Admin)
const getAllReviews = async (req, res) => {
  try {
    console.log('🔍 [REVIEW] getAllReviews called with query:', req.query);
    
    const { page = 1, limit = 10, restaurant, rating, search } = req.query;
    
    // Log user making request
    console.log('🔍 [REVIEW] User making request:', req.user._id, req.user.role);
    
    // Build query
    const query = {};
    
    if (restaurant) {
      // Validate restaurant ID format
      if (!mongoose.Types.ObjectId.isValid(restaurant)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid restaurant ID format'
        });
      }
      query.restaurant = restaurant;
      console.log('🔍 [REVIEW] Filtering by restaurant:', restaurant);
    }
    
    if (search) {
      query.$or = [
        { review: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { restaurantName: { $regex: search, $options: 'i' } }
      ];
      console.log('🔍 [REVIEW] Filtering by search:', search);
    }
    
    if (rating) {
      query.rating = parseInt(rating);
      console.log('🔍 [REVIEW] Filtering by rating:', query.rating);
    }
    
    console.log('🔍 [REVIEW] Final query:', query);

    console.log('🔍 [REVIEW] Executing database query...');
    
    try {
      const reviews = await Review.find(query)
        .populate('restaurant', 'businessName email phone city state')
        .populate('customer', 'name email phone')
        .populate('order', 'orderNumber orderDate totalAmount')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Review.countDocuments(query);
      console.log('🔍 [REVIEW] Found reviews:', reviews.length, 'Total:', total);

      res.status(200).json({
        success: true,
        count: reviews.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: reviews
      });
    } catch (dbError) {
      console.error('❌ [REVIEW] Database query error:', dbError);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

  } catch (error) {
    console.error('❌ [REVIEW] Get All Reviews Error:', error);
    console.error('❌ [REVIEW] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @desc    Get review by ID (Admin only)
// @route   GET /api/admin/reviews/:id
// @access  Private (Admin)
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('restaurant', 'businessName email address city state pinCode category specialization')
      .populate('customer', 'name email phone')
      .populate('order', 'orderNumber orderDate totalAmount items');
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });

  } catch (error) {
    console.error('Get Review Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
};

// @desc    Toggle review visibility (Admin only)
// @route   PUT /api/admin/reviews/:id/toggle-visibility
// @access  Private (Admin)
const toggleReviewVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 [REVIEW] Toggling visibility for review ID:', id);

    const review = await Review.findById(id);
    
    if (!review) {
      console.log('❌ [REVIEW] Review not found for ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('🔍 [REVIEW] Current review visibility:', review.isVisible);
    console.log('🔍 [REVIEW] Current review data:', review);

    // Use the schema method to toggle visibility
    await review.toggleVisibility();
    
    // Refresh the document to get the updated state
    const updatedReview = await Review.findById(id);
    console.log('🔍 [REVIEW] Updated review visibility:', updatedReview.isVisible);
    console.log('🔍 [REVIEW] Updated review data:', updatedReview);

    res.status(200).json({
      success: true,
      message: `Review ${updatedReview.isVisible ? 'made visible' : 'hidden'} successfully`,
      data: updatedReview
    });

  } catch (error) {
    console.error('❌ [REVIEW] Toggle Review Visibility Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling review visibility',
      error: error.message
    });
  }
};

// @desc    Flag review as inappropriate (Admin only)
// @route   PUT /api/admin/reviews/:id/flag
// @access  Private (Admin)
const flagReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Flag reason must be at least 10 characters'
      });
    }

    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Use the schema method to flag review
    await review.flagReview(reason.trim(), req.user._id);

    res.status(200).json({
      success: true,
      message: 'Review flagged successfully',
      data: review
    });

  } catch (error) {
    console.error('Flag Review Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error flagging review',
      error: error.message
    });
  }
};

// @desc    Get review statistics for dashboard
// @route   GET /api/admin/review-stats
// @access  Private (Admin)
const getReviewStats = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    const visibleReviews = await Review.countDocuments({ isVisible: true });
    const hiddenReviews = await Review.countDocuments({ isVisible: false });
    const flaggedReviews = await Review.countDocuments({ isFlagged: true });

    // Get reviews by rating
    const reviewsByRating = await Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    // Get reviews by restaurant
    const reviewsByRestaurant = await Review.aggregate([
      {
        $group: {
          _id: '$restaurant',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurantInfo'
        }
      },
      {
        $project: {
          restaurantName: { $arrayElemAt: ['$restaurantInfo.businessName', 0] },
          count: 1,
          avgRating: { $round: ['$avgRating', 2] }
        }
      }
    ]);

    // Get recent reviews
    const recentReviews = await Review.find()
      .populate('restaurant', 'businessName')
      .populate('customer', 'name')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('rating review restaurant customer order createdAt');

    res.status(200).json({
      success: true,
      data: {
        total: totalReviews,
        visible: visibleReviews,
        hidden: hiddenReviews,
        flagged: flaggedReviews,
        reviewsByRating,
        reviewsByRestaurant,
        recentReviews
      }
    });

  } catch (error) {
    console.error('Get Review Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  toggleReviewVisibility,
  flagReview,
  getReviewStats
};
