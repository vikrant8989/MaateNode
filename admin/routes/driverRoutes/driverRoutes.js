const express = require('express');
const router = express.Router();
const driverController = require('../../controller/driverController/driverController');
const authMiddleware = require('../../../middlewres/auth');

// Driver management routes (Admin only)
router.get('/', authMiddleware(['admin']), driverController.getAllDrivers);
router.get('/stats', authMiddleware(['admin']), driverController.getDriverStats);
router.get('/:id', authMiddleware(['admin']), driverController.getDriverById);
router.put('/:id/approve', authMiddleware(['admin']), driverController.approveDriver);
router.put('/:id/reject', authMiddleware(['admin']), driverController.rejectDriver);
router.put('/:id/block', authMiddleware(['admin']), driverController.blockDriver);
router.put('/:id/unblock', authMiddleware(['admin']), driverController.unblockDriver);
router.put('/:id/toggle-status', authMiddleware(['admin']), driverController.toggleDriverStatus);

module.exports = router;
