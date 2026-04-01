const jwt = require('jsonwebtoken');
const User = require('../user/user.model');
const logger = require('../../shared/utils/logger');

class AuthService {
  /**
   * Generate JWT token
   */
  generateToken(userId, role) {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '30m' }
    );
  }

  /**
   * Login user
   */
  async login(identifier, password) {
    // Check if identifier looks like an email
    const safeIdentifier = typeof identifier === 'string' ? identifier : '';
    const isEmail = safeIdentifier.includes('@');
    const query = isEmail ? { email: safeIdentifier } : { username: safeIdentifier };

    // Find user with password field
    const user = await User.findOne(query).select('+password').populate('merchant_id');
    
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      const error = new Error('Account is inactive. Please contact support');
      error.statusCode = 403;
      error.code = 'ACCOUNT_INACTIVE';
      throw error;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Generate token with role
    const token = this.generateToken(user._id, user.role);

    logger.info(`User logged in: ${user.email} (${user.role})`);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        merchant_id: user.merchant_id._id,
        merchant_no: user.merchant_id.merchant_no
      }
    };
  }

  /**
   * Get user by ID (for auth middleware)
   */
  async getUserById(userId) {
    const user = await User.findById(userId)
      .populate('merchant_id', 'merchant_no name email')
      .select('-password');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return user;
  }

  /**
   * Forgot password - Generate reset token
   */
  async forgotPassword(email) {
    const merchant = await Merchant.findOne({ email });
    
    if (!merchant) {
      // Don't reveal if email exists for security
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return { email, message: 'If email exists, reset token has been sent' };
    }

    // Generate reset token (crypto random)
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Save hashed token and expiry (1 hour)
    merchant.resetPasswordToken = hashedToken;
    merchant.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await merchant.save();

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await sendEmail({
    //   to: merchant.email,
    //   subject: 'Password Reset Request',
    //   text: `Click here to reset your password: ${resetUrl}`
    // });

    logger.info(`Password reset token generated for: ${email}`);

    return {
      email: merchant.email,
      resetToken // Return unhashed token (only in dev mode via controller)
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    // Hash the provided token to compare
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find merchant with valid token
    const merchant = await Merchant.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!merchant) {
      const error = new Error('Invalid or expired reset token');
      error.statusCode = 400;
      error.code = 'INVALID_TOKEN';
      throw error;
    }

    // Update password (will be hashed by pre-save hook)
    merchant.password = newPassword;
    merchant.resetPasswordToken = undefined;
    merchant.resetPasswordExpires = undefined;
    await merchant.save();

    logger.info(`Password reset successful for: ${merchant.email}`);

    return { email: merchant.email };
  }
}

module.exports = new AuthService();
