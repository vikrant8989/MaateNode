const express = require('express');
const router = express.Router();
const categoryController = require('../controller/categoryController');
const authMiddleware = require('../../middlewres/auth');
const { uploadItemFields, handleMulterError } = require('../../utils/multerConfig');

// Category management routes (Restaurant only)
router.get('/', authMiddleware(['restaurant']), categoryController.getAllCategories);
router.get('/stats', authMiddleware(['restaurant']), categoryController.getCategoryStats);
router.get('/:id', authMiddleware(['restaurant']), categoryController.getCategoryById);
router.post('/', authMiddleware(['restaurant']), uploadItemFields, handleMulterError, categoryController.createCategory);
router.put('/:id', authMiddleware(['restaurant']), uploadItemFields, handleMulterError, categoryController.updateCategory);
router.delete('/:id', authMiddleware(['restaurant']), categoryController.deleteCategory);
router.post('/:id/upload-image', authMiddleware(['restaurant']), uploadItemFields, handleMulterError, categoryController.uploadCategoryImage);

module.exports = router; 