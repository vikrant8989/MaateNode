const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionStats,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  extendSubscription
} = require('../../controller/userController/subscriptionController');

// @route   GET /api/admin/users/subscriptions
router.get('/', authMiddleware(['admin']), getAllSubscriptions);

// @route   GET /api/admin/users/subscriptions/stats
router.get('/stats', authMiddleware(['admin']), getSubscriptionStats);

// @route   GET /api/admin/users/:userId/subscriptions/stats
router.get('/:userId/stats', authMiddleware(['admin']), getSubscriptionStats);

// @route   GET /api/admin/users/subscriptions/:id
router.get('/:id', authMiddleware(['admin']), getSubscriptionById);

// @route   PUT /api/admin/users/subscriptions/:id/pause
router.put('/:id/pause', authMiddleware(['admin']), pauseSubscription);

// @route   PUT /api/admin/users/subscriptions/:id/resume
router.put('/:id/resume', authMiddleware(['admin']), resumeSubscription);

// @route   PUT /api/admin/users/subscriptions/:id/cancel
router.put('/:id/cancel', authMiddleware(['admin']), cancelSubscription);

// @route   PUT /api/admin/users/subscriptions/:id/extend
router.put('/:id/extend', authMiddleware(['admin']), extendSubscription);

module.exports = router;
