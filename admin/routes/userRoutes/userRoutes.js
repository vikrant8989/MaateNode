const express = require('express');
const router = express.Router();
const userController = require('../../controller/userController/userController');
const profileController = require('../../controller/userController/profileController');
const reviewController = require('../../controller/userController/reviewController');
const subscriptionController = require('../../controller/userController/subscriptionController');
const orderHistoryController = require('../../controller/userController/orderHistoryController');
const paymentController = require('../../controller/userController/paymentController');
const addressController = require('../../controller/userController/addressController');
const activityController = require('../../controller/userController/activityController');
const authMiddleware = require('../../../middlewres/auth');

// User management routes (Admin only)
router.get('/', authMiddleware(['admin']), userController.getAllUsers);
router.get('/stats', authMiddleware(['admin']), userController.getUserStats);
router.get('/search', authMiddleware(['admin']), userController.searchUsers);

// User Profile Management
router.get('/:id/profile', authMiddleware(['admin']), profileController.getProfileById);
router.put('/:id/profile', authMiddleware(['admin']), profileController.updateProfile);
router.put('/:id/profile/verify', authMiddleware(['admin']), profileController.verifyProfile);
router.get('/:id/profile/documents', authMiddleware(['admin']), profileController.getUserDocuments);
router.put('/:id/profile/documents/approve', authMiddleware(['admin']), profileController.approveUserDocuments);

// User Reviews
// router.get('/:id/reviews', authMiddleware(['admin']), reviewController.getUserReviews); // Function doesn't exist
router.get('/:id/reviews/stats', authMiddleware(['admin']), reviewController.getReviewStats); // User-specific review stats
router.put('/:id/reviews/:reviewId/toggle-visibility', authMiddleware(['admin']), reviewController.toggleReviewVisibility);
router.put('/:id/reviews/:reviewId/flag', authMiddleware(['admin']), reviewController.flagReview);

// User Subscriptions
// router.get('/:id/subscriptions', authMiddleware(['admin']), subscriptionController.getUserSubscriptions); // Function doesn't exist
router.get('/:id/subscriptions/stats', authMiddleware(['admin']), subscriptionController.getSubscriptionStats); // User-specific subscription stats
router.put('/:id/subscriptions/:subscriptionId/toggle-status', authMiddleware(['admin']), subscriptionController.pauseSubscription); // Using pauseSubscription instead

// User Order History
// router.get('/:id/orders', authMiddleware(['admin']), orderHistoryController.getUserOrders); // Function doesn't exist
router.get('/:id/orders/stats', authMiddleware(['admin']), orderHistoryController.getOrderStats); // User-specific order stats
router.get('/:id/orders/:orderId', authMiddleware(['admin']), orderHistoryController.getOrderById);

// User Payments
// router.get('/:id/payments', authMiddleware(['admin']), paymentController.getUserPayments); // Function doesn't exist
router.get('/:id/payments/stats', authMiddleware(['admin']), paymentController.getPaymentStats); // User-specific payment stats
router.put('/:id/payments/:paymentId/update-status', authMiddleware(['admin']), paymentController.processPaymentRefund); // Using processPaymentRefund instead

// User Addresses
router.get('/:id/addresses', authMiddleware(['admin']), addressController.getAddressesByUser); // Using getAddressesByUser instead
router.get('/:id/addresses/stats', authMiddleware(['admin']), addressController.getAddressStats); // User-specific address stats
router.put('/:id/addresses/:addressId/toggle-status', authMiddleware(['admin']), addressController.verifyAddress); // Using verifyAddress instead

// User Activities
router.get('/:id/activities', authMiddleware(['admin']), activityController.getAllActivities);
router.get('/:id/activities/stats', authMiddleware(['admin']), activityController.getActivityStats);
router.get('/:id/activities/engagement', authMiddleware(['admin']), activityController.getUserEngagementMetrics);
router.get('/:id/activities/timeline', authMiddleware(['admin']), activityController.getUserActivityTimeline);

// General user management routes - must come LAST to avoid conflicts
router.get('/:id', authMiddleware(['admin']), userController.getUserById);
router.put('/:id/verify', authMiddleware(['admin']), userController.verifyUser);
router.put('/:id/block', authMiddleware(['admin']), userController.blockUser);
router.put('/:id/unblock', authMiddleware(['admin']), userController.unblockUser);
router.put('/:id/toggle-status', authMiddleware(['admin']), userController.toggleUserStatus);

module.exports = router;
