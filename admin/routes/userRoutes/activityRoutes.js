const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllActivities,
  getActivityById,
  getActivityStats,
  getUserActivityTimeline,
  getUserEngagementMetrics
} = require('../../controller/userController/activityController');

// @route   GET /api/admin/users/activities
router.get('/', authMiddleware(['admin']), getAllActivities);

// @route   GET /api/admin/users/activities/stats
router.get('/stats', authMiddleware(['admin']), getActivityStats);

// @route   GET /api/admin/users/activities/:id
router.get('/:id', authMiddleware(['admin']), getActivityById);

// @route   GET /api/admin/users/:userId/activities/timeline
router.get('/user/:userId/timeline', authMiddleware(['admin']), getUserActivityTimeline);

// @route   GET /api/admin/users/:userId/activities/engagement
router.get('/user/:userId/engagement', authMiddleware(['admin']), getUserEngagementMetrics);

module.exports = router;
