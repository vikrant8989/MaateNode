const express = require('express');
const router = express.Router();
const restaurantController = require('../../controller/restaurantController/restaurantController');
const authMiddleware = require('../../../middlewres/auth');

// Restaurant management routes (Admin only)
router.get('/', authMiddleware(['admin','user']), restaurantController.getAllRestaurants);
router.get('/stats', authMiddleware(['admin']), restaurantController.getRestaurantStats);
router.get('/:id', authMiddleware(['admin','user']), restaurantController.getRestaurantById);
router.put('/:id/approve', authMiddleware(['admin']), restaurantController.approveRestaurant);
router.put('/:id/reject', authMiddleware(['admin']), restaurantController.rejectRestaurant);
router.put('/:id/toggle-status', authMiddleware(['admin']), restaurantController.toggleRestaurantStatus);

module.exports = router;
