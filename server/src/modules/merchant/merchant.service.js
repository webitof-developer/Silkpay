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
      merchant_no: merchant.merchant_no,
      name: merchant.name,
      username: merchant.username, // Include username
      email: merchant.email,
      mobile: merchant.mobile,
      avatar: merchant.avatar, // Include avatar
      status: merchant.status,
      balance: merchant.balance,
      whitelist_ips: merchant.whitelist_ips,
      createdAt: merchant.createdAt
    };
  }

  /**
   * Update merchant profile
   */
  async updateProfile(merchantId, updates) {
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }
    
    // Update allowed fields
    if (updates.name) merchant.name = updates.name;
    if (updates.username) merchant.username = updates.username; // Save as provided (case sensitive)
    if (updates.mobile) merchant.mobile = updates.mobile;
    if (updates.avatar !== undefined) merchant.avatar = updates.avatar; // Allow avatar update
    
    await merchant.save();
    
    logger.info(`Merchant profile updated: ${merchant.merchant_no}`);
    
    return this.getProfile(merchantId);
  }

  /**
   * Get API keys (masked secret key)
   */
  async getAPIKeys(merchantId) {
    const merchant = await Merchant.findById(merchantId).select('+secret_key');
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }
    
    const decryptedKey = merchant.getDecryptedSecretKey();
    const maskedKey = this.maskSecretKey(decryptedKey);
    
    return {
      merchant_no: merchant.merchant_no,
      secret_key: maskedKey,
      created_at: merchant.createdAt
    };
  }

  /**
   * Rotate API secret key
   */
  async rotateSecretKey(merchantId) {
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }
    
    // Generate new secret key
    const newSecretKey = this.generateSecretKey();
    merchant.secret_key = newSecretKey;
    await merchant.save();
    
    logger.warn(`Secret key rotated for merchant: ${merchant.merchant_no}`);
    
    return {
      message: 'Secret key rotated successfully',
      secret_key: newSecretKey,
      warning: 'Please update your integrations with the new secret key immediately'
    };
  }

  /**
   * Update IP whitelist
   */
 async updateWhitelistIPs(merchantId, ips) {
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }
    
    merchant.whitelist_ips = ips;
    console.log("merchant.whitelist_ips: servic:",merchant.whitelist_ips);
    await merchant.save();
    
    logger.info(`IP whitelist updated for merchant: ${merchant.merchant_no}`);
    
    return {
      whitelist_ips: merchant.whitelist_ips
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
   * Helper: Generate random secret key
   */
  generateSecretKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Helper: Mask secret key (show only first 8 and last 4 chars)
   */
  maskSecretKey(key) {
    if (!key || key.length < 12) return 'XXXX';
    return key.substring(0, 8) + 'X'.repeat(key.length - 12) + key.slice(-4);
  }
}

module.exports = new MerchantService();
