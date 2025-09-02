const Review = require('../modal/review');
const Restaurant = require('../modal/restaurant');
const User = require('../../user/modal/user');

console.log('🚀 [REVIEW_CONTROLLER] Review controller initialized');

// Get reviews for current authenticated restaurant
const getReviewsForCurrentRestaurant = async (req, res) => {
  try {
    console.log('⭐ [REVIEW_CONTROLLER] getReviewsForCurrentRestaurant called');
    
    const restaurantId = req.user.id;
    console.log('⭐ [REVIEW_CONTROLLER] Restaurant ID from token:', restaurantId);

    // Get query parameters
    const { page = 1, limit = 10, rating, sortBy = 'reviewDate', sortOrder = 'desc' } = req.query;
    
    // Build filter
    const filter = { 
      restaurant: restaurantId,
      isVisible: true 
    };
    
    if (rating) {
      filter.rating = parseInt(rating);
    }
    
    console.log('⭐ [REVIEW_CONTROLLER] Filter:', filter);
    console.log('⭐ [REVIEW_CONTROLLER] Sort:', { sortBy, sortOrder });

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews with pagination
    const reviews = await Review.find(filter)
      .populate('customer', 'firstName lastName email profileImage')
      .populate('order', 'orderNumber orderDate')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalReviews = await Review.countDocuments(filter);
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    console.log('⭐ [REVIEW_CONTROLLER] Reviews found:', reviews.length, 'Total:', totalReviews);

    // Format reviews for response
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      reviewDate: review.reviewDate,
      customer: {
        _id: review.customer?._id,
        firstName: review.customer?.firstName,
        lastName: review.customer?.lastName,
        email: review.customer?.email,
        profileImage: review.customer?.profileImage
      },
      customerName: review.customerName,
      customerImage: review.customerImage,
      restaurant: review.restaurant,
      restaurantName: review.restaurantName,
      restaurantLocation: review.restaurantLocation,
      order: {
        _id: review.order?._id,
        orderNumber: review.order?.orderNumber,
        orderDate: review.order?.orderDate
      },
      orderNumber: review.orderNumber,
      orderDate: review.orderDate,
      rating: review.rating,
      review: review.review,
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount,
      reportCount: review.reportCount,
      viewCount: review.viewCount,
      isVisible: review.isVisible,
      isFlagged: review.isFlagged,
      tags: review.tags,
      sentiment: review.sentiment,
      sentimentScore: review.sentimentScore,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Restaurant reviews fetched successfully',
      data: {
        reviews: formattedReviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ [REVIEW_CONTROLLER] Error in getReviewsForCurrentRestaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant reviews',
      error: error.message
    });
  }
};

// Get reviews by restaurant ID (public access)
const getReviewsByRestaurant = async (req, res) => {
  try {
    console.log('⭐ [REVIEW_CONTROLLER] getReviewsByRestaurant called');
    
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, rating, sortBy = 'reviewDate', sortOrder = 'desc' } = req.query;
    
    console.log('⭐ [REVIEW_CONTROLLER] Restaurant ID:', restaurantId);
    console.log('⭐ [REVIEW_CONTROLLER] Query params:', { page, limit, rating, sortBy, sortOrder });

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Build filter
    const filter = { 
      restaurant: restaurantId,
      isVisible: true 
    };
    
    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews with pagination
    const reviews = await Review.find(filter)
      .populate('customer', 'firstName lastName email profileImage')
      .populate('order', 'orderNumber orderDate')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalReviews = await Review.countDocuments(filter);
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    console.log('⭐ [REVIEW_CONTROLLER] Reviews found:', reviews.length, 'Total:', totalReviews);

    // Format reviews for response
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      reviewDate: review.reviewDate,
      customer: {
        _id: review.customer?._id,
        firstName: review.customer?.firstName,
        lastName: review.customer?.lastName,
        email: review.customer?.email,
        profileImage: review.customer?.profileImage
      },
      customerName: review.customerName,
      customerImage: review.customerImage,
      restaurant: review.restaurant,
      restaurantName: review.restaurantName,
      restaurantLocation: review.restaurantLocation,
      order: {
        _id: review.order?._id,
        orderNumber: review.order?.orderNumber,
        orderDate: review.order?.orderDate
      },
      orderNumber: review.orderNumber,
      orderDate: review.orderDate,
      rating: review.rating,
      review: review.review,
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount,
      reportCount: review.reportCount,
      viewCount: review.viewCount,
      isVisible: review.isVisible,
      isFlagged: review.isFlagged,
      tags: review.tags,
      sentiment: review.sentiment,
      sentimentScore: review.sentimentScore,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Restaurant reviews fetched successfully',
      data: {
        reviews: formattedReviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ [REVIEW_CONTROLLER] Error in getReviewsByRestaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant reviews',
      error: error.message
    });
  }
};

// Get review by ID
const getReviewById = async (req, res) => {
  try {
    console.log('⭐ [REVIEW_CONTROLLER] getReviewById called');
    
    const { reviewId } = req.params;
    console.log('⭐ [REVIEW_CONTROLLER] Review ID:', reviewId);

    const review = await Review.findById(reviewId)
      .populate('customer', 'firstName lastName email profileImage')
      .populate('order', 'orderNumber orderDate')
      .populate('restaurant', 'businessName address city state')
      .lean();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Increment view count
    await Review.findByIdAndUpdate(reviewId, { $inc: { viewCount: 1 } });

    // Format review for response
    const formattedReview = {
      _id: review._id,
      reviewDate: review.reviewDate,
      customer: {
        _id: review.customer?._id,
        firstName: review.customer?.firstName,
        lastName: review.customer?.lastName,
        email: review.customer?.email,
        profileImage: review.customer?.profileImage
      },
      customerName: review.customerName,
      customerImage: review.customerImage,
      restaurant: {
        _id: review.restaurant?._id,
        businessName: review.restaurant?.businessName,
        address: review.restaurant?.address,
        city: review.restaurant?.city,
        state: review.restaurant?.state
      },
      restaurantName: review.restaurantName,
      restaurantLocation: review.restaurantLocation,
      order: {
        _id: review.order?._id,
        orderNumber: review.order?.orderNumber,
        orderDate: review.order?.orderDate
      },
      orderNumber: review.orderNumber,
      orderDate: review.orderDate,
      rating: review.rating,
      review: review.review,
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount,
      reportCount: review.reportCount,
      viewCount: review.viewCount + 1, // Include incremented count
      isVisible: review.isVisible,
      isFlagged: review.isFlagged,
      tags: review.tags,
      sentiment: review.sentiment,
      sentimentScore: review.sentimentScore,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Review fetched successfully',
      data: formattedReview
    });

  } catch (error) {
    console.error('❌ [REVIEW_CONTROLLER] Error in getReviewById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: error.message
    });
  }
};

// Get review statistics for current restaurant
const getReviewStatsForRestaurant = async (req, res) => {
  try {
    console.log('⭐ [REVIEW_CONTROLLER] getReviewStatsForRestaurant called');
    
    const restaurantId = req.user.id;
    console.log('⭐ [REVIEW_CONTROLLER] Restaurant ID from token:', restaurantId);
    console.log('⭐ [REVIEW_CONTROLLER] Restaurant ID type:', typeof restaurantId);

    // Debug: Check if any reviews exist at all
    const totalReviewsInDB = await Review.countDocuments();
    console.log('⭐ [REVIEW_CONTROLLER] Total reviews in database:', totalReviewsInDB);
    
    // Debug: Check if any reviews exist for this restaurant
    const reviewsForRestaurant = await Review.countDocuments({ restaurant: restaurantId });
    console.log('⭐ [REVIEW_CONTROLLER] Reviews for this restaurant:', reviewsForRestaurant);
    
    // Debug: Check if any reviews exist for this restaurant (visible)
    const visibleReviewsForRestaurant = await Review.countDocuments({ restaurant: restaurantId, isVisible: true });
    console.log('⭐ [REVIEW_CONTROLLER] Visible reviews for this restaurant:', visibleReviewsForRestaurant);

    // Convert string ID to ObjectId for proper comparison
    const mongoose = require('mongoose');
    const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);
    
    console.log('⭐ [REVIEW_CONTROLLER] Restaurant ObjectId:', restaurantObjectId);
    
    console.log('⭐ [REVIEW_CONTROLLER] About to run aggregation with ObjectId:', restaurantObjectId);
    
    // Let's also check what the actual review data looks like
    const sampleReview = await Review.findOne({ restaurant: restaurantObjectId, isVisible: true });
    console.log('⭐ [REVIEW_CONTROLLER] Sample review found:', sampleReview ? 'Yes' : 'No');
    if (sampleReview) {
      console.log('⭐ [REVIEW_CONTROLLER] Sample review restaurant field:', sampleReview.restaurant);
      console.log('⭐ [REVIEW_CONTROLLER] Sample review restaurant type:', typeof sampleReview.restaurant);
    }
    
    const stats = await Review.aggregate([
      { $match: { restaurant: restaurantObjectId, isVisible: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalRating: { $sum: '$rating' },
          ratingCounts: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No reviews found for restaurant',
        data: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
          }
        }
      });
    }

    const stat = stats[0];
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    stat.ratingCounts.forEach(rating => {
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });

    const responseData = {
      totalReviews: stat.totalReviews,
      averageRating: Math.round(stat.averageRating * 100) / 100,
      ratingDistribution,
      totalRating: stat.totalRating
    };

    console.log('⭐ [REVIEW_CONTROLLER] Stats calculated:', responseData);

    res.status(200).json({
      success: true,
      message: 'Review statistics fetched successfully',
      data: responseData
    });

  } catch (error) {
    console.error('❌ [REVIEW_CONTROLLER] Error in getReviewStatsForRestaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message
    });
  }
};

// Get review statistics by restaurant ID (public access)
const getReviewStatsByRestaurant = async (req, res) => {
  try {
    console.log('⭐ [REVIEW_CONTROLLER] getReviewStatsByRestaurant called');
    
    const { restaurantId } = req.params;
    console.log('⭐ [REVIEW_CONTROLLER] Restaurant ID:', restaurantId);

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Convert string ID to ObjectId for proper comparison
    const mongoose = require('mongoose');
    const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);
    
    const stats = await Review.aggregate([
      { $match: { restaurant: restaurantObjectId, isVisible: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalRating: { $sum: '$rating' },
          ratingCounts: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No reviews found for restaurant',
        data: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
          }
        }
      });
    }

    const stat = stats[0];
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    stat.ratingCounts.forEach(rating => {
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });

    const responseData = {
      totalReviews: stat.totalReviews,
      averageRating: Math.round(stat.averageRating * 100) / 100,
      ratingDistribution,
      totalRating: stat.totalRating
    };

    console.log('⭐ [REVIEW_CONTROLLER] Stats calculated:', responseData);

    res.status(200).json({
      success: true,
      message: 'Review statistics fetched successfully',
      data: responseData
    });

  } catch (error) {
    console.error('❌ [REVIEW_CONTROLLER] Error in getReviewStatsByRestaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message
    });
  }
};

// Mark review as helpful/unhelpful
const markReviewHelpful = async (req, res) => {
  try {
    console.log('⭐ [REVIEW_CONTROLLER] markReviewHelpful called');
    
    const { reviewId } = req.params;
    const { isHelpful } = req.body;
    const userId = req.user.id;
    
    console.log('⭐ [REVIEW_CONTROLLER] Review ID:', reviewId, 'Is Helpful:', isHelpful, 'User ID:', userId);

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (isHelpful) {
      review.helpfulCount += 1;
    } else {
      review.unhelpfulCount += 1;
    }

    await review.save();

    console.log('⭐ [REVIEW_CONTROLLER] Review helpful count updated');

    res.status(200).json({
      success: true,
      message: `Review marked as ${isHelpful ? 'helpful' : 'unhelpful'} successfully`,
      data: {
        reviewId: review._id,
        helpfulCount: review.helpfulCount,
        unhelpfulCount: review.unhelpfulCount
      }
    });

  } catch (error) {
    console.error('❌ [REVIEW_CONTROLLER] Error in markReviewHelpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful/unhelpful',
      error: error.message
    });
  }
};

// Report review
const reportReview = async (req, res) => {
  try {
    console.log('⭐ [REVIEW_CONTROLLER] reportReview called');
    
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    console.log('⭐ [REVIEW_CONTROLLER] Review ID:', reviewId, 'Reason:', reason, 'User ID:', userId);

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.reportCount += 1;
    await review.save();

    console.log('⭐ [REVIEW_CONTROLLER] Review reported successfully');

    res.status(200).json({
      success: true,
      message: 'Review reported successfully',
      data: {
        reviewId: review._id,
        reportCount: review.reportCount
      }
    });

  } catch (error) {
    console.error('❌ [REVIEW_CONTROLLER] Error in reportReview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review',
      error: error.message
    });
  }
};

module.exports = {
  getReviewsForCurrentRestaurant,
  getReviewsByRestaurant,
  getReviewById,
  getReviewStatsForRestaurant,
  getReviewStatsByRestaurant,
  markReviewHelpful,
  reportReview
};
