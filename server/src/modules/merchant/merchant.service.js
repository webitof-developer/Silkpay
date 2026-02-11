const Merchant = require('./merchant.model');
const { encrypt } = require('../../shared/utils/encryption');
const crypto = require('crypto');
const logger = require('../../shared/utils/logger');

class MerchantService {
  /**
   * Get merchant profile
   */
  async getProfile(merchantId) {
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }
    
    return {
      id: merchant._id,
      merchant_no: process.env.SILKPAY_MERCHANT_ID || merchant.merchant_no, // Prioritize env
      name: merchant.name,
      username: merchant.username,
      email: merchant.email,
      mobile: merchant.mobile,
      avatar: merchant.avatar,
      status: merchant.status,
      balance: merchant.balance,
      silkpay_config: {
        merchant_id: process.env.SILKPAY_MERCHANT_ID || '',
        secret_key: process.env.SILKPAY_SECRET_KEY || ''
      },
      silkpay_webhook_url: `${process.env.BACKEND_URL}/api/webhook/silkpay`,
      createdAt: merchant.createdAt
    };
  }

  /**
   * Update merchant profile
   */
  async updateProfile(merchantId, updates, userId) {
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }
    
    // Update allowed fields
    if (updates.name) merchant.name = updates.name;
    if (updates.username) merchant.username = updates.username;
    if (updates.mobile) merchant.mobile = updates.mobile;
    if (updates.avatar !== undefined) merchant.avatar = updates.avatar;
    
    await merchant.save();

    // Sync with User model if userId provided
    if (userId && (updates.name || updates.username)) {
      try {
        const User = require('../user/user.model');
        const userUpdates = {};
        if (updates.name) userUpdates.name = updates.name;
        if (updates.username) userUpdates.username = updates.username;
        if (updates.avatar !== undefined) userUpdates.avatar = updates.avatar;
        
        await User.findByIdAndUpdate(userId, userUpdates);
        logger.info(`Synced merchant profile update to User ${userId}`);
      } catch (err) {
        logger.error(`Failed to sync merchant profile to User: ${err.message}`);
        // Don't throw, as merchant update succeeded
      }
    }
    
    logger.info(`Merchant profile updated: ${merchant.merchant_no}`);
    
    return this.getProfile(merchantId);
  }

  /**
   * Get API keys (masked secret key)
   */
  async getAPIKeys(merchantId) {
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }
    
    // In single-tenant mode, secret key comes from env
    const secretKey = process.env.SILKPAY_SECRET_KEY || '';
    const maskedKey = this.maskSecretKey(secretKey);
    
    return {
      merchant_no: process.env.SILKPAY_MERCHANT_ID || merchant.merchant_no,
      secret_key: maskedKey,
      created_at: merchant.createdAt
    };
  }




  /**
   * Change password
   */
  async changePassword(merchantId, currentPassword, newPassword) {
    const merchant = await Merchant.findById(merchantId).select('+password');
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }
    
    // Verify current password
    const isValid = await merchant.comparePassword(currentPassword);
    
    if (!isValid) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 401;
      error.code = 'INVALID_PASSWORD';
      throw error;
    }
    
    // Update password
    merchant.password = newPassword;
    await merchant.save();
    
    logger.info(`Password changed for merchant: ${merchant.merchant_no}`);
    
    return {
      message: 'Password changed successfully'
    };
  }



  /**
   * Helper: Mask secret key (show only first 8 and last 4 chars)
   */
  maskSecretKey(key) {
    if (!key) return 'XXXX';
    if (key.length <= 8) return key.substring(0, 3) + 'X'.repeat(key.length - 3);
    if (key.length < 12) return key.substring(0, 4) + 'X'.repeat(key.length - 6) + key.slice(-2);
    return key.substring(0, 8) + 'X'.repeat(key.length - 12) + key.slice(-4);
  }
}

module.exports = new MerchantService();
