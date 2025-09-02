const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middlewres/auth');
const {
  getAllPayments,
  getPaymentById,
  getPaymentStats,
  processPaymentRefund,
  handlePaymentDispute,
  getPaymentTransactions
} = require('../../controller/userController/paymentController');

// @route   GET /api/admin/users/payments
router.get('/', authMiddleware(['admin']), getAllPayments);

// @route   GET /api/admin/users/payments/stats
router.get('/stats', authMiddleware(['admin']), getPaymentStats);

// @route   GET /api/admin/users/:userId/payments/stats
router.get('/:userId/stats', authMiddleware(['admin']), getPaymentStats);

// @route   GET /api/admin/users/payments/:id
router.get('/:id', authMiddleware(['admin']), getPaymentById);

// @route   GET /api/admin/users/payments/:id/transactions
router.get('/:id/transactions', authMiddleware(['admin']), getPaymentTransactions);

// @route   PUT /api/admin/users/payments/:id/refund
router.put('/:id/refund', authMiddleware(['admin']), processPaymentRefund);

// @route   PUT /api/admin/users/payments/:id/dispute
router.put('/:id/dispute', authMiddleware(['admin']), handlePaymentDispute);

module.exports = router;
