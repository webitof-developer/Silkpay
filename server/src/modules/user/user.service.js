const User = require('./user.model');
const logger = require('../../shared/utils/logger');

class UserService {
  /**
   * Create a new user (admin only)
   */
  async createUser(data, createdById) {
    const { name, email, password, role, merchant_id, username } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 409;
      error.code = 'EMAIL_EXISTS';
      throw error;
    }

    // Check if username already exists
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        const error = new Error('Username already taken');
        error.statusCode = 409;
        error.code = 'USERNAME_EXISTS';
        throw error;
      }
    }

    // Create user
    const user = await User.create({
      merchant_id,
      name,
      email,
      username,
      password,
      role: role || 'USER',
      created_by: createdById
    });

    logger.info('User created', { email: user.email, role: user.role });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };
  }

  /**
   * Get all users for a merchant
   */
  async getUsers(merchantId) {
    const users = await User.find({ merchant_id: merchantId })
      .populate('created_by', 'name email')
      .select('-password')
      .sort('-createdAt');

    return users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      created_by: user.created_by ? {
        id: user.created_by._id,
        name: user.created_by.name,
        email: user.created_by.email
      } : null,
      createdAt: user.createdAt
    }));
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await User.findById(userId)
      .populate('created_by', 'name email')
      .select('-password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      merchant_id: user.merchant_id,
      created_by: user.created_by,
      createdAt: user.createdAt
    };
  }

  /**
   * Update user
   */
  async updateUser(userId, data, currentUserId) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Prevent self-role change
    if (userId === currentUserId && data.role && data.role !== user.role) {
      const error = new Error('Cannot change your own role');
      error.statusCode = 403;
      error.code = 'SELF_ROLE_CHANGE';
      throw error;
    }

    // Check if username is being updated and is unique
    if (data.username && data.username !== user.username) {
      const existingUsername = await User.findOne({ username: data.username });
      if (existingUsername) {
        const error = new Error('Username already taken');
        error.statusCode = 409;
        error.code = 'USERNAME_EXISTS';
        throw error;
      }
      user.username = data.username;
    }

    // Update fields
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.role) user.role = data.role;
    if (data.status) user.status = data.status;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    if (data.password) user.password = data.password; // Will be hashed by pre-save hook

    await user.save();

    logger.info('User updated', { userId, email: user.email });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status
    };
  }

  /**
   * Delete user
   */
  async deleteUser(userId, merchantId, currentUserId) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Prevent self-deletion
    if (userId === currentUserId) {
      const error = new Error('Cannot delete your own account');
      error.statusCode = 403;
      error.code = 'SELF_DELETE';
      throw error;
    }

    // Prevent deletion of last admin
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({
        merchant_id: merchantId,
        role: 'ADMIN',
        status: 'ACTIVE'
      });

      if (adminCount <= 1) {
        const error = new Error('Cannot delete the last admin account');
        error.statusCode = 403;
        error.code = 'LAST_ADMIN';
        throw error;
      }
    }

    await User.findByIdAndDelete(userId);

    logger.info('User deleted', { userId, email: user.email });

    return { message: 'User deleted successfully' };
  }
}

module.exports = new UserService();
