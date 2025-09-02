const express = require('express');
const router = express.Router();
const {
    createOffer,
    getAllOffers,
    getActiveOffers,
    getOfferById,
    updateOffer,
    deleteOffer,
    getPublicOffers
} = require('../controller/offerController');

// Import middleware for authentication and file uploads
const authMiddleware = require('../../middlewres/auth');
const { uploadOfferFields, handleMulterError } = require('../../utils/multerConfig');

console.log('🚀 [OFFER_ROUTES] Offer routes initialized');

// Test route to debug routing
router.get('/test', (req, res) => {
    console.log('🧪 [OFFER_ROUTES] Test route called');
    res.status(200).json({
        success: true,
        message: 'Offers route is working',
        timestamp: new Date().toISOString()
    });
});

// Create a new offer (with image upload)
router.post('/create', authMiddleware(['restaurant']), (req, res, next) => {
    console.log('➕ [OFFER_ROUTES] POST /create - createOffer route called');
    next();
}, uploadOfferFields, handleMulterError, createOffer);

// Get all offers for the authenticated restaurant
router.get('/all', authMiddleware(['restaurant']), (req, res, next) => {
    console.log('📋 [OFFER_ROUTES] GET /all - getAllOffers route called');
    next();
}, getAllOffers);

// Get active offers for the authenticated restaurant
router.get('/active', authMiddleware(['restaurant']), (req, res, next) => {
    console.log('🏆 [OFFER_ROUTES] GET /active - getActiveOffers route called');
    next();
}, getActiveOffers);

// Get offer by ID (restaurant specific)
router.get('/:offerId', authMiddleware(['restaurant']), (req, res, next) => {
    console.log('🔍 [OFFER_ROUTES] GET /:offerId - getOfferById route called, ID:', req.params.offerId);
    next();
}, getOfferById);

// Update offer (with image upload support)
router.put('/:offerId', authMiddleware(['restaurant']), (req, res, next) => {
    console.log('✏️ [OFFER_ROUTES] PUT /:offerId - updateOffer route called, ID:', req.params.offerId);
    next();
}, uploadOfferFields, handleMulterError, updateOffer);

// Delete offer
router.delete('/:offerId', authMiddleware(['restaurant']), (req, res, next) => {
    console.log('🗑️ [OFFER_ROUTES] DELETE /:offerId - deleteOffer route called, ID:', req.params.offerId);
    next();
}, deleteOffer);

// Public routes (no authentication required)
// Get offers for a specific restaurant (for customers)
router.get('/public/:restaurantId', (req, res, next) => {
    console.log('🌐 [OFFER_ROUTES] GET /public/:restaurantId - getPublicOffers route called, Restaurant ID:', req.params.restaurantId);
    next();
}, getPublicOffers);

console.log('✅ [OFFER_ROUTES] All offer routes configured successfully');

module.exports = router; 