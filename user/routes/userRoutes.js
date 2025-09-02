const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
// const cartRoutes = require('./cartRoutes'); // Temporarily commented out
const authMiddleware = require('../../middlewres/auth');
const { uploadSingle, uploadMultiple, handleMulterError } = require('../../utils/multerConfig');

// Public routes (no authentication required)
router.post('/auth', userController.authUser);

// Protected routes (authentication required)
router.get('/profile', authMiddleware(['user']), userController.getProfile);
router.put('/profile', authMiddleware(['user']), userController.updateProfile);
router.post('/upload-image', authMiddleware(['user']), uploadSingle, handleMulterError, userController.uploadProfileImage);
router.post('/upload-images', authMiddleware(['user']), uploadMultiple, handleMulterError, userController.uploadMultipleImages);
router.delete('/profile-image', authMiddleware(['user']), userController.deleteProfileImage);

// Comprehensive profile update (profile data + image in single request)
router.put('/profile-complete', authMiddleware(['user']), uploadSingle, handleMulterError, userController.updateCompleteProfile);

// Address CRUD routes
router.get('/addresses', authMiddleware(['user']), userController.getAddresses);
router.post('/addresses', authMiddleware(['user']), userController.addAddress);
router.get('/addresses/:addressId', authMiddleware(['user']), userController.getAddressById);
router.put('/addresses/:addressId', authMiddleware(['user']), userController.updateAddress);
router.delete('/addresses/:addressId', authMiddleware(['user']), userController.deleteAddress);
router.put('/addresses/:addressId/default', authMiddleware(['user']), userController.setDefaultAddress);

router.get('/dashboard', authMiddleware(['user']), userController.getDashboard);
router.post('/logout', authMiddleware(['user']), userController.logout);

// Cart routes - temporarily commented out
// router.use('/cart', cartRoutes);

module.exports = router; 