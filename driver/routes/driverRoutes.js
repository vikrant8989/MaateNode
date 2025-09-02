const express = require('express');
const router = express.Router();
const driverController = require('../controller/driverController');
const authMiddleware = require('../../middlewres/auth');
const { uploadFields, handleMulterError } = require('../../utils/multerConfig');

// Public routes (no authentication required)
router.post('/send-otp', driverController.sendOTP);
router.post('/verify-otp', driverController.verifyOTP);

// Protected routes (authentication required)
router.get('/profile', authMiddleware(['driver']), driverController.getProfile);
router.put('/profile', authMiddleware(['driver']), uploadFields, handleMulterError, driverController.updateProfile);
router.get('/dashboard', authMiddleware(['driver']), driverController.getDashboard);
router.put('/online-status', authMiddleware(['driver']), driverController.updateOnlineStatus);
router.post('/logout', authMiddleware(['driver']), driverController.logout);

// Registration step routes
router.get('/registration/progress', authMiddleware(['driver']), driverController.getRegistrationProgress);
router.put('/registration/personal', authMiddleware(['driver']), uploadFields, handleMulterError, driverController.updatePersonalDetails);
router.put('/registration/bank-details', authMiddleware(['driver']), uploadFields, handleMulterError, driverController.updateBankDetails);
router.put('/registration/aadhar', authMiddleware(['driver']), uploadFields, handleMulterError, driverController.updateAadharDetails);
router.put('/registration/driving-license', authMiddleware(['driver']), uploadFields, handleMulterError, driverController.updateDrivingLicense);
router.put('/registration/vehicle', authMiddleware(['driver']), uploadFields, handleMulterError, driverController.updateVehicleDetails);
router.put('/registration/complete', authMiddleware(['driver']), driverController.completeRegistration);

// Image management routes
router.delete('/images/:imageType', authMiddleware(['driver']), driverController.deleteImage);

// Test S3 endpoint (for development/testing)
router.post('/test-s3', uploadFields, handleMulterError, driverController.testS3Upload);

module.exports = router; 