const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllProfiles,
  getProfileById,
  updateProfile,
  verifyProfile,
  getUserDocuments,
  approveUserDocuments,
  getProfileStats
} = require('../../controller/userController/profileController');

// @route   GET /api/admin/users/profiles
router.get('/', authMiddleware(['admin']), getAllProfiles);

// @route   GET /api/admin/users/profiles/stats
router.get('/stats', authMiddleware(['admin']), getProfileStats);

// @route   GET /api/admin/users/profiles/:id
router.get('/:id', authMiddleware(['admin']), getProfileById);

// @route   PUT /api/admin/users/profiles/:id/update
router.put('/:id/update', authMiddleware(['admin']), updateProfile);

// @route   PUT /api/admin/users/profiles/:id/verify
router.put('/:id/verify', authMiddleware(['admin']), verifyProfile);

// @route   GET /api/admin/users/profiles/:id/documents
router.get('/:id/documents', authMiddleware(['admin']), getUserDocuments);

// @route   PUT /api/admin/users/profiles/:id/documents/approve
router.put('/:id/documents/approve', authMiddleware(['admin']), approveUserDocuments);

module.exports = router;
