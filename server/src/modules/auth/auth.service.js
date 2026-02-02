const jwt = require('jsonwebtoken');
const Merchant = require('../merchant/merchant.model');
const logger = require('../../shared/utils/logger');

class AuthService {
  /**
   * Generate JWT token
   */
  generateToken(merchantId) {
    return jwt.sign(
      { id: merchantId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '30m' }
    );
  }

  /**
   * Login merchant
   */
  async login(identifier, password) {
    // Check if identifier looks like an email
    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier } : { username: identifier }; // Strict case match for username

    // Find merchant with password field
    const merchant = await Merchant.findOne(query).select('+password');
    
    if (!merchant) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Check if merchant is active
    if (merchant.status !== 'ACTIVE') {
      const error = new Error('Account is inactive. Please contact support');
      error.statusCode = 403;
      error.code = 'ACCOUNT_INACTIVE';
      throw error;
    }

    // Verify password
    const isPasswordValid = await merchant.comparePassword(password);
    
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Generate token
    const token = this.generateToken(merchant._id);

    logger.info(`Merchant logged in: ${merchant.email}`);

    return {
      token,
      merchant: {
        id: merchant._id,
        merchant_no: merchant.merchant_no,
        name: merchant.name,
        email: merchant.email,
        mobile: merchant.mobile,
        status: merchant.status
      }
    };
  }

  /**
   * Get merchant by ID (for auth middleware)
   */
  async getMerchantById(merchantId) {
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }

    return merchant;
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
