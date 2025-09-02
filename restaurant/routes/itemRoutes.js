const express = require('express');
const router = express.Router();
const itemController = require('../controller/itemController');
const authMiddleware = require('../../middlewres/auth');
const { uploadItemFields, handleMulterError } = require('../../utils/multerConfig');

console.log('🚀 [ITEM_ROUTES] Item routes initialized');

// Item management routes (Restaurant only)
router.get('/', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('📋 [ITEM_ROUTES] GET / - getAllItems route called');
  next();
}, itemController.getAllItems);

// Get all items by restaurant ID (Public access for users)
router.get('/restaurant/:restaurantId',authMiddleware(['restaurant','user']), (req, res, next) => {
  console.log('🍴 [ITEM_ROUTES] GET /restaurant/:restaurantId - getAllItemsByRestaurantId route called, Restaurant ID:', req.params.restaurantId);
  next();
}, itemController.getAllItemsByRestaurantId);

router.get('/stats', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('📊 [ITEM_ROUTES] GET /stats - getItemStats route called');
  next();
}, itemController.getItemStats);

router.get('/best-sellers', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('🏆 [ITEM_ROUTES] GET /best-sellers - getBestSellers route called');
  next();
}, itemController.getBestSellers);

router.get('/:id', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('🔍 [ITEM_ROUTES] GET /:id - getItemById route called, ID:', req.params.id);
  next();
}, itemController.getItemById);

router.post('/', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('➕ [ITEM_ROUTES] POST / - createItem route called');
  next();
}, uploadItemFields, handleMulterError, itemController.createItem);

router.put('/:id', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('✏️ [ITEM_ROUTES] PUT /:id - updateItem route called, ID:', req.params.id);
  next();
}, uploadItemFields, handleMulterError, itemController.updateItem);

router.delete('/:id', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('🗑️ [ITEM_ROUTES] DELETE /:id - deleteItem route called, ID:', req.params.id);
  next();
}, itemController.deleteItem);

router.put('/:id/toggle-availability', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('🔄 [ITEM_ROUTES] PUT /:id/toggle-availability - toggleAvailability route called, ID:', req.params.id);
  next();
}, itemController.toggleAvailability);

router.put('/:id/update-order-count', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('📊 [ITEM_ROUTES] PUT /:id/update-order-count - updateItemOrderCount route called, ID:', req.params.id);
  next();
}, itemController.updateItemOrderCount);

router.post('/:id/upload-image', authMiddleware(['restaurant']), (req, res, next) => {
  console.log('📸 [ITEM_ROUTES] POST /:id/upload-image - uploadItemImage route called, ID:', req.params.id);
  next();
}, uploadItemFields, handleMulterError, itemController.uploadItemImage);

console.log('✅ [ITEM_ROUTES] All item routes configured successfully');

module.exports = router; 