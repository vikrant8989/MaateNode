const UserReview = require('../../../restaurant/modal/review');
const User = require('../../../user/modal/user');

// @desc    Get all user reviews (Admin only)
// @route   GET /api/admin/users/reviews
// @access  Private (Admin)
const getAllReviews = async (req, res) => {
  try {
    console.log('🔍 getAllReviews - Request received:', { 
      query: req.query, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    const { status, rating, page = 1, limit = 10, search } = req.query;
    console.log('🔍 getAllReviews - Query parameters:', { status, rating, page, limit, search });
    
    let query = {};
    
    // Status filter
    if (status) {
      if (status === 'pending') {
        query.isApproved = false;
        query.isRejected = false;
        console.log('🔍 getAllReviews - Applied pending status filter');
      } else if (status === 'approved') {
        query.isApproved = true;
        console.log('🔍 getAllReviews - Applied approved status filter');
      } else if (status === 'rejected') {
        query.isRejected = true;
        console.log('🔍 getAllReviews - Applied rejected status filter');
      } else if (status === 'flagged') {
        query.isFlagged = true;
        console.log('🔍 getAllReviews - Applied flagged status filter');
      }
    }
    
    // Rating filter
    if (rating) {
      query.rating = parseInt(rating);
      console.log('🔍 getAllReviews - Applied rating filter:', rating);
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'restaurant.name': { $regex: search, $options: 'i' } }
      ];
      console.log('🔍 getAllReviews - Applied search filter:', search);
    }

    console.log('🔍 getAllReviews - Final query object:', JSON.stringify(query, null, 2));
    console.log('🔍 getAllReviews - Pagination:', { page, limit, skip: (page - 1) * limit });

    console.log('🔍 getAllReviews - Executing database query...');
    const reviews = await UserReview.find(query)
      .populate('user', 'name phone profileImage')
      .populate('restaurant', 'name logo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('🔍 getAllReviews - Database query completed. Found reviews count:', reviews.length);

    console.log('🔍 getAllReviews - Getting total count...');
    const total = await UserReview.countDocuments(query);
    console.log('🔍 getAllReviews - Total reviews count:', total);

    const response = {
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: reviews
    };

    console.log('✅ getAllReviews - Success response prepared:', {
      success: response.success,
      count: response.count,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getAllReviews - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
};

// @desc    Get review by ID (Admin only)
// @route   GET /api/admin/users/reviews/:id
// @access  Private (Admin)
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 getReviewById - Request received:', { 
      reviewId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('🔍 getReviewById - Executing database query...');
    const review = await UserReview.findById(id)
      .populate('user', 'name phone profileImage')
      .populate('restaurant', 'name logo address')
      .populate('order', 'orderNumber items');
    
    if (!review) {
      console.log('❌ getReviewById - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('✅ getReviewById - Review found successfully:', {
      reviewId: review._id,
      userId: review.user?._id,
      restaurantId: review.restaurant?._id
    });

    res.status(200).json({
      success: true,
      data: review
    });

  } catch (error) {
    console.error('❌ getReviewById - Error occurred:', {
      reviewId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user review',
      error: error.message
    });
  }
};

// @desc    Get review statistics (Admin only)
// @route   GET /api/admin/users/reviews/stats
// @access  Private (Admin)
const getReviewStats = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📊 getReviewStats - Request received:', { 
      user: req.user?.id,
      userId,
      timestamp: new Date().toISOString()
    });

    let query = {};
    if (userId) {
      query.customer = userId;
      console.log('📊 getReviewStats - Filtering for specific user:', userId);
    }

    console.log('📊 getReviewStats - Getting basic counts...');
    const totalReviews = await UserReview.countDocuments(query);
    const pendingReviews = await UserReview.countDocuments({ 
      ...query,
      isApproved: false, 
      isRejected: false 
    });
    const approvedReviews = await UserReview.countDocuments({ ...query, isApproved: true });
    const rejectedReviews = await UserReview.countDocuments({ ...query, isRejected: true });
    const flaggedReviews = await UserReview.countDocuments({ ...query, isFlagged: true });

    console.log('📊 getReviewStats - Basic counts completed:', {
      total: totalReviews,
      pending: pendingReviews,
      approved: approvedReviews,
      rejected: rejectedReviews,
      flagged: flaggedReviews
    });

    // Rating distribution
    console.log('📊 getReviewStats - Getting rating distribution...');
    const ratingStats = await UserReview.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    console.log('📊 getReviewStats - Rating distribution completed:', ratingStats);

    // Monthly review count
    console.log('📊 getReviewStats - Getting monthly stats...');
    const monthlyStats = await UserReview.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    console.log('📊 getReviewStats - Monthly stats completed:', monthlyStats);

    const response = {
      success: true,
      data: {
        total: totalReviews,
        pending: pendingReviews,
        approved: approvedReviews,
        rejected: rejectedReviews,
        flagged: flaggedReviews,
        ratingDistribution: ratingStats,
        monthlyTrend: monthlyStats
      }
    };

    console.log('✅ getReviewStats - Success response prepared:', {
      success: response.success,
      total: response.data.total,
      pending: response.data.pending,
      approved: response.data.approved,
      rejected: response.data.rejected,
      flagged: response.data.flagged
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getReviewStats - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
};

// @desc    Get flagged reviews (Admin only)
// @route   GET /api/admin/users/reviews/flagged
// @access  Private (Admin)
const getFlaggedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    console.log('🚩 getFlaggedReviews - Request received:', { 
      page, 
      limit, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('🚩 getFlaggedReviews - Executing database query...');
    const reviews = await UserReview.find({ isFlagged: true })
      .populate('user', 'name phone profileImage')
      .populate('restaurant', 'name logo')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('🚩 getFlaggedReviews - Database query completed. Found flagged reviews count:', reviews.length);

    console.log('🚩 getFlaggedReviews - Getting total count...');
    const total = await UserReview.countDocuments({ isFlagged: true });
    console.log('🚩 getFlaggedReviews - Total flagged reviews count:', total);

    const response = {
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: reviews
    };

    console.log('✅ getFlaggedReviews - Success response prepared:', {
      success: response.success,
      count: response.count,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getFlaggedReviews - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching flagged reviews',
      error: error.message
    });
  }
};

// @desc    Get pending reviews (Admin only)
// @route   GET /api/admin/users/reviews/pending
// @access  Private (Admin)
const getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    console.log('⏳ getPendingReviews - Request received:', { 
      page, 
      limit, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('⏳ getPendingReviews - Executing database query...');
    const reviews = await UserReview.find({ 
      isApproved: false, 
      isRejected: false 
    })
      .populate('user', 'name phone profileImage')
      .populate('restaurant', 'name logo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('⏳ getPendingReviews - Database query completed. Found pending reviews count:', reviews.length);

    console.log('⏳ getPendingReviews - Getting total count...');
    const total = await UserReview.countDocuments({ 
      isApproved: false, 
      isRejected: false 
    });
    console.log('⏳ getPendingReviews - Total pending reviews count:', total);

    const response = {
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: reviews
    };

    console.log('✅ getPendingReviews - Success response prepared:', {
      success: response.success,
      count: response.count,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ getPendingReviews - Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching pending reviews',
      error: error.message
    });
  }
};

// @desc    Approve review (Admin only)
// @route   PUT /api/admin/users/reviews/:id/approve
// @access  Private (Admin)
const approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    console.log('✅ approveReview - Request received:', { 
      reviewId: id, 
      adminNote, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('✅ approveReview - Finding review...');
    const review = await UserReview.findById(id);
    
    if (!review) {
      console.log('❌ approveReview - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.isApproved) {
      console.log('❌ approveReview - Review already approved:', id);
      return res.status(400).json({
        success: false,
        message: 'Review is already approved'
      });
    }

    console.log('✅ approveReview - Updating review status...');
    review.isApproved = true;
    review.isRejected = false;
    review.isFlagged = false;
    review.adminNote = adminNote;
    review.approvedBy = req.user.id;
    review.approvedAt = new Date();

    console.log('✅ approveReview - Saving review...');
    await review.save();

    console.log('✅ approveReview - Review approved successfully:', {
      reviewId: review._id,
      approvedBy: review.approvedBy,
      approvedAt: review.approvedAt
    });

    res.status(200).json({
      success: true,
      message: 'Review approved successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ approveReview - Error occurred:', {
      reviewId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error approving review',
      error: error.message
    });
  }
};

// @desc    Reject review (Admin only)
// @route   PUT /api/admin/users/reviews/:id/reject
// @access  Private (Admin)
const rejectReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, adminNote } = req.body;
    console.log('❌ rejectReview - Request received:', { 
      reviewId: id, 
      reason, 
      adminNote, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!reason || reason.trim().length < 10) {
      console.log('❌ rejectReview - Invalid rejection reason:', reason);
      return res.status(400).json({
        success: false,
        message: 'Rejection reason must be at least 10 characters'
      });
    }

    console.log('❌ rejectReview - Finding review...');
    const review = await UserReview.findById(id);
    
    if (!review) {
      console.log('❌ rejectReview - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.isRejected) {
      console.log('❌ rejectReview - Review already rejected:', id);
      return res.status(400).json({
        success: false,
        message: 'Review is already rejected'
      });
    }

    console.log('❌ rejectReview - Updating review status...');
    review.isRejected = true;
    review.isApproved = false;
    review.isFlagged = false;
    review.rejectionReason = reason;
    review.adminNote = adminNote;
    review.rejectedBy = req.user.id;
    review.rejectedAt = new Date();

    console.log('❌ rejectReview - Saving review...');
    await review.save();

    console.log('✅ rejectReview - Review rejected successfully:', {
      reviewId: review._id,
      rejectedBy: review.rejectedBy,
      rejectedAt: review.rejectedAt,
      reason: review.rejectionReason
    });

    res.status(200).json({
      success: true,
      message: 'Review rejected successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ rejectReview - Error occurred:', {
      reviewId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error rejecting review',
      error: error.message
    });
  }
};

// @desc    Flag review (Admin only)
// @route   PUT /api/admin/users/reviews/:id/flag
// @access  Private (Admin)
const flagReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    console.log('🚩 flagReview - Request received:', { 
      reviewId: id, 
      reason, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!reason || reason.trim().length < 10) {
      console.log('❌ flagReview - Invalid flag reason:', reason);
      return res.status(400).json({
        success: false,
        message: 'Flag reason must be at least 10 characters'
      });
    }

    console.log('🚩 flagReview - Finding review...');
    const review = await UserReview.findById(id);
    
    if (!review) {
      console.log('❌ flagReview - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('🚩 flagReview - Updating review status...');
    review.isFlagged = true;
    review.flagReason = reason;
    review.flaggedBy = req.user.id;
    review.flaggedAt = new Date();

    console.log('🚩 flagReview - Saving review...');
    await review.save();

    console.log('✅ flagReview - Review flagged successfully:', {
      reviewId: review._id,
      flaggedBy: review.flaggedBy,
      flaggedAt: review.flaggedAt,
      reason: review.flagReason
    });

    res.status(200).json({
      success: true,
      message: 'Review flagged successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ flagReview - Error occurred:', {
      reviewId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error flagging review',
      error: error.message
    });
  }
};

// @desc    Remove review flag (Admin only)
// @route   PUT /api/admin/users/reviews/:id/unflag
// @access  Private (Admin)
const unflagReview = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🚩 unflagReview - Request received:', { 
      reviewId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('🚩 unflagReview - Finding review...');
    const review = await UserReview.findById(id);
    
    if (!review) {
      console.log('❌ unflagReview - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (!review.isFlagged) {
      console.log('❌ unflagReview - Review is not flagged:', id);
      return res.status(400).json({
        success: false,
        message: 'Review is not flagged'
      });
    }

    console.log('🚩 unflagReview - Removing review flag...');
    review.isFlagged = false;
    review.flagReason = undefined;
    review.flaggedBy = undefined;
    review.flaggedAt = undefined;

    console.log('🚩 unflagReview - Saving review...');
    await review.save();

    console.log('✅ unflagReview - Review flag removed successfully:', {
      reviewId: review._id
    });

    res.status(200).json({
      success: true,
      message: 'Review flag removed successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ unflagReview - Error occurred:', {
      reviewId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error removing review flag',
      error: error.message
    });
  }
};

// @desc    Toggle review visibility (Admin only)
// @route   PUT /api/admin/users/reviews/:id/toggle-visibility
// @access  Private (Admin)
const toggleReviewVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('👁️ toggleReviewVisibility - Request received:', { 
      reviewId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('👁️ toggleReviewVisibility - Finding review...');
    const review = await UserReview.findById(id);
    
    if (!review) {
      console.log('❌ toggleReviewVisibility - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const previousVisibility = review.isVisible;
    console.log('👁️ toggleReviewVisibility - Toggling visibility from:', previousVisibility);
    
    review.isVisible = !review.isVisible;
    review.visibilityToggledBy = req.user.id;
    review.visibilityToggledAt = new Date();

    console.log('👁️ toggleReviewVisibility - Saving review...');
    await review.save();

    console.log('✅ toggleReviewVisibility - Review visibility toggled successfully:', {
      reviewId: review._id,
      previousVisibility,
      newVisibility: review.isVisible,
      toggledBy: review.visibilityToggledBy
    });

    res.status(200).json({
      success: true,
      message: `Review ${review.isVisible ? 'made visible' : 'hidden'} successfully`,
      data: review
    });

  } catch (error) {
    console.error('❌ toggleReviewVisibility - Error occurred:', {
      reviewId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error toggling review visibility',
      error: error.message
    });
  }
};

// @desc    Feature/unfeature review (Admin only)
// @route   PUT /api/admin/users/reviews/:id/feature
// @access  Private (Admin)
const toggleReviewFeature = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('⭐ toggleReviewFeature - Request received:', { 
      reviewId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('⭐ toggleReviewFeature - Finding review...');
    const review = await UserReview.findById(id);
    
    if (!review) {
      console.log('❌ toggleReviewFeature - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const previousFeatureStatus = review.isFeatured;
    console.log('⭐ toggleReviewFeature - Toggling feature status from:', previousFeatureStatus);
    
    review.isFeatured = !review.isFeatured;
    review.featuredBy = req.user.id;
    review.featuredAt = new Date();

    console.log('⭐ toggleReviewFeature - Saving review...');
    await review.save();

    console.log('✅ toggleReviewFeature - Review feature status toggled successfully:', {
      reviewId: review._id,
      previousFeatureStatus,
      newFeatureStatus: review.isFeatured,
      featuredBy: review.featuredBy
    });

    res.status(200).json({
      success: true,
      message: `Review ${review.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: review
    });

  } catch (error) {
    console.error('❌ toggleReviewFeature - Error occurred:', {
      reviewId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error toggling review feature',
      error: error.message
    });
  }
};

// @desc    Delete review (Admin only)
// @route   DELETE /api/admin/users/reviews/:id
// @access  Private (Admin)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    console.log('🗑️ deleteReview - Request received:', { 
      reviewId: id, 
      reason, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!reason || reason.trim().length < 10) {
      console.log('❌ deleteReview - Invalid deletion reason:', reason);
      return res.status(400).json({
        success: false,
        message: 'Deletion reason must be at least 10 characters'
      });
    }

    console.log('🗑️ deleteReview - Finding review...');
    const review = await UserReview.findById(id);
    
    if (!review) {
      console.log('❌ deleteReview - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('🗑️ deleteReview - Marking review as deleted...');
    review.deletedAt = new Date();
    review.deletedBy = req.user.id;
    review.deletionReason = reason;
    review.isDeleted = true;

    console.log('🗑️ deleteReview - Saving review...');
    await review.save();

    console.log('✅ deleteReview - Review deleted successfully:', {
      reviewId: review._id,
      deletedBy: review.deletedBy,
      deletedAt: review.deletedAt,
      reason: review.deletionReason
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('❌ deleteReview - Error occurred:', {
      reviewId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// @desc    Get review reports (Admin only)
// @route   GET /api/admin/users/reviews/:id/reports
// @access  Private (Admin)
const getReviewReports = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 getReviewReports - Request received:', { 
      reviewId: id, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    console.log('📋 getReviewReports - Finding review...');
    const review = await UserReview.findById(id);
    
    if (!review) {
      console.log('❌ getReviewReports - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('📋 getReviewReports - Review found, preparing reports data...');
    // This would typically fetch from a separate reports collection
    // For now, returning the review's report-related fields
    const reportsData = {
      reviewId: review._id,
      isFlagged: review.isFlagged,
      flagReason: review.flagReason,
      flagCount: review.flagCount || 0,
      reports: review.reports || []
    };

    console.log('✅ getReviewReports - Reports data prepared:', reportsData);

    res.status(200).json({
      success: true,
      data: reportsData
    });

  } catch (error) {
    console.error('❌ getReviewReports - Error occurred:', {
      reviewId: req.params.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching review reports',
      error: error.message
    });
  }
};

// @desc    Resolve review reports (Admin only)
// @route   PUT /api/admin/users/reviews/:id/reports/resolve
// @access  Private (Admin)
const resolveReviewReports = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;
    console.log('🔧 resolveReviewReports - Request received:', { 
      reviewId: id, 
      action, 
      adminNote, 
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!action || !['approve', 'reject', 'flag', 'delete'].includes(action)) {
      console.log('❌ resolveReviewReports - Invalid action:', action);
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve, reject, flag, or delete'
      });
    }

    console.log('🔧 resolveReviewReports - Finding review...');
    const review = await UserReview.findById(id);
    
    if (!review) {
      console.log('❌ resolveReviewReports - Review not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('🔧 resolveReviewReports - Resolving reports with action:', action);
    // Clear reports and take action
    review.reports = [];
    review.flagCount = 0;
    review.adminNote = adminNote;
    review.reportsResolvedBy = req.user.id;
    review.reportsResolvedAt = new Date();

    // Apply the chosen action
    switch (action) {
      case 'approve':
        review.isApproved = true;
        review.isRejected = false;
        review.isFlagged = false;
        console.log('🔧 resolveReviewReports - Applied approve action');
        break;
      case 'reject':
        review.isRejected = true;
        review.isApproved = false;
        review.isFlagged = false;
        console.log('🔧 resolveReviewReports - Applied reject action');
        break;
      case 'flag':
        review.isFlagged = true;
        review.isApproved = false;
        review.isRejected = false;
        console.log('🔧 resolveReviewReports - Applied flag action');
        break;
      case 'delete':
        review.isDeleted = true;
        review.deletedAt = new Date();
        review.deletedBy = req.user.id;
        console.log('🔧 resolveReviewReports - Applied delete action');
        break;
    }

    console.log('🔧 resolveReviewReports - Saving review...');
    await review.save();

    console.log('✅ resolveReviewReports - Review reports resolved successfully:', {
      reviewId: review._id,
      action,
      resolvedBy: review.reportsResolvedBy,
      resolvedAt: review.reportsResolvedAt
    });

    res.status(200).json({
      success: true,
      message: `Review reports resolved with action: ${action}`,
      data: review
    });

  } catch (error) {
    console.error('❌ resolveReviewReports - Error occurred:', {
      reviewId: req.params.id,
      action: req.body.action,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error resolving review reports',
      error: error.message
    });
  }
};

module.exports = {
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
};
