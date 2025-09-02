const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const authMiddleware = require('../../middlewres/auth');

// Public routes (no authentication required)
router.post('/register', adminController.register);
router.post('/login', adminController.login);

// Protected routes (authentication required)
router.get('/profile', authMiddleware(['admin']), adminController.getProfile);
router.put('/profile', authMiddleware(['admin']), adminController.updateProfile);
router.put('/change-password', authMiddleware(['admin']), adminController.changePassword);
router.get('/dashboard', authMiddleware(['admin']), adminController.getDashboard);
router.post('/logout', authMiddleware(['admin']), adminController.logout);

// Super Admin only routes
router.get('/all', authMiddleware(['super_admin']), adminController.getAllAdmins);
router.put('/:id/role', authMiddleware(['super_admin']), adminController.updateAdminRole);
router.put('/:id/status', authMiddleware(['super_admin']), adminController.toggleAdminStatus);

module.exports = router; 