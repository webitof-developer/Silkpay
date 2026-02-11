const userService = require('./user.service');
const logger = require('../../shared/utils/logger');

class UserController {
  /**
   * Create user (Admin only)
   */
  async createUser(req, res) {
    try {
      const user = await userService.createUser(
        req.body,
        req.user.id // created_by
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      logger.error('Create user error', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'CREATE_USER_FAILED',
          message: error.message
        }
      });
    }
  }

  /**
   * Get all users (Admin only)
   */
  async getUsers(req, res) {
    try {
      const users = await userService.getUsers(req.user.merchant_id);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error('Get users error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_USERS_FAILED',
          message: error.message
        }
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get user error', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'GET_USER_FAILED',
          message: error.message
        }
      });
    }
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(req, res) {
    try {
      const user = await userService.updateUser(
        req.params.id,
        req.body,
        req.user.id // current user
      );

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      logger.error('Update user error', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'UPDATE_USER_FAILED',
          message: error.message
        }
      });
    }
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(req, res) {
    try {
      const result = await userService.deleteUser(
        req.params.id,
        req.user.merchant_id,
        req.user.id
      );

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Delete user error', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'DELETE_USER_FAILED',
          message: error.message
        }
      });
    }
  }
}

module.exports = new UserController();
