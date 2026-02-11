const express = require('express');
const router = express.Router();
const merchantController = require('./merchant.controller');
const { 
  validateUpdateProfile, 
  validateChangePassword 
} = require('./merchant.validator');
const authMiddleware = require('../../shared/middleware/auth');
const { requireRole } = require('../../shared/middleware/rbac');

// All routes require authentication
router.use(authMiddleware);

// All merchant management routes require ADMIN role
router.get('/profile', requireRole('ADMIN'), merchantController.getProfile);
router.put('/profile', requireRole('ADMIN'), validateUpdateProfile, merchantController.updateProfile);

// API Keys - ADMIN only
router.get('/api-keys', requireRole('ADMIN'), merchantController.getAPIKeys);

// Password - ADMIN only (merchant password, not user password)
router.post('/change-password', requireRole('ADMIN'), validateChangePassword, merchantController.changePassword);

module.exports = router;
