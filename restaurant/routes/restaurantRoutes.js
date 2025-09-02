const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers
const {
  sendOTP,
  verifyOTP,
  registerRestaurant,
  createOrUpdateProfile,
  getProfile,
  getDashboard,
  removeMessImage,
  clearMessImages,
  logout,
  toggleOnlineStatus
} = require('../controller/restaurantController');

// Import middleware
const authMiddleware = require('../../middlewres/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Configure fields for different document types
const profileUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'messImages', maxCount: 5 },
  { name: 'qrCode', maxCount: 1 },
  { name: 'passbook', maxCount: 1 },
  { name: 'aadharCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 }
]);

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', registerRestaurant);

// Protected routes
router.get('/profile', authMiddleware(['restaurant']), getProfile);
router.post('/profile', authMiddleware(['restaurant']), profileUpload, createOrUpdateProfile);
router.get('/dashboard', authMiddleware(['restaurant']), getDashboard);
router.delete('/mess-image/:imageUrl', authMiddleware(['restaurant']), removeMessImage);
router.delete('/mess-images', authMiddleware(['restaurant']), clearMessImages);
router.post('/logout', authMiddleware(['restaurant']), logout);
router.post('/toggle-online', authMiddleware(['restaurant']), toggleOnlineStatus);

module.exports = router;
