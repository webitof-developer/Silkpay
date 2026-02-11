const express = require('express');
const router = express.Router();
const transactionController = require('./transaction.controller');
const authMiddleware = require('../../shared/middleware/auth');
const { requireRole } = require('../../shared/middleware/rbac');

// All routes require authentication
router.use(authMiddleware);

// GET /api/transactions/export - Export CSV (must be before /:id) - ADMIN ONLY
router.get('/export', requireRole('ADMIN'), transactionController.exportTransactions);

// GET /api/transactions/stats - Get statistics
router.get('/stats', transactionController.getTransactionStats);

// GET /api/transactions - List transactions
router.get('/', transactionController.getTransactions);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
