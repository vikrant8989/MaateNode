const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllOffers,
  getOfferById,
  toggleOfferStatus,
  getOfferStats
} = require('../../controller/restaurantController/offerController');

// @route   GET /api/admin/offers
router.get('/', authMiddleware(['admin']), getAllOffers);

// @route   GET /api/admin/offers/stats
router.get('/stats', authMiddleware(['admin']), getOfferStats);

// @route   GET /api/admin/offers/:id
router.get('/:id', authMiddleware(['admin']), getOfferById);

// @route   PUT /api/admin/offers/:id/toggle-status
router.put('/:id/toggle-status', authMiddleware(['admin']), toggleOfferStatus);

module.exports = router;
