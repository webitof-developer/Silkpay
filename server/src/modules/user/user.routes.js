const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { validateCreateUser, validateUpdateUser, validateUserId } = require('./user.validator');
const authenticate = require('../../shared/middleware/auth');
const { requireRole } = require('../../shared/middleware/rbac');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/users
 * @desc    Create a new user (Admin only)
 * @access  Admin
 */
router.post(
  '/',
  requireRole('ADMIN'),
  validateCreateUser,
  userController.createUser
);

/**
 * @route   GET /api/users
 * @desc    Get all users for current merchant (Admin only)
 * @access  Admin
 */
router.get(
  '/',
  requireRole('ADMIN'),
  userController.getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin, Self
 */
router.get(
  '/:id',
  validateUserId,
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Admin only)
 * @access  Admin
 */
router.put(
  '/:id',
  requireRole('ADMIN'),
  validateUpdateUser,
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only)
 * @access  Admin
 */
router.delete(
  '/:id',
  requireRole('ADMIN'),
  validateUserId,
  userController.deleteUser
);

module.exports = router;
