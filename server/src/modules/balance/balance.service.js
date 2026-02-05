const Merchant = require('../merchant/merchant.model');
const silkpayService = require('../../shared/services/silkpayService');
const logger = require('../../shared/utils/logger');

class BalanceService {
  /**
   * Get current balance
   */
  async getBalance(merchantId) {
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }
    
    return {
      merchant_no: merchant.merchant_no,
      balance: merchant.balance,
      last_synced: merchant.updatedAt
    };
  }

  /**
   * Sync balance with SilkPay
   */
  async syncBalance(merchantId) {
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      const error = new Error('Merchant not found');
      error.statusCode = 404;
      error.code = 'MERCHANT_NOT_FOUND';
      throw error;
    }

    try {
      // Query SilkPay for current balance
      // Returns { available: number, pending: number, raw: object }
      const balanceData = await silkpayService.getMerchantBalance();
      
      logger.info(`SilkPay Balance Response for ${merchantId}:`, balanceData);

      // silkpayService would have thrown if error, so we assume success here.
      
      const available = balanceData.available;
      const pending = balanceData.pending;
      const total = available + pending;
      
      // Update merchant balance
      merchant.balance.available = available;
      merchant.balance.pending = pending;
      merchant.balance.total = total;
      
      await merchant.save();
      
      logger.info(`Balance synced for merchant ${merchant.merchant_no}`, {
        total: total,
        available: available,
        pending: pending
      });
      
      return {
        merchant_no: merchant.merchant_no,
        balance: merchant.balance,
        synced_at: new Date()
      };
    } catch (error) {
      logger.error(`Balance sync failed for merchant ${merchant.merchant_no}:`, error.message);
      throw error;
    }
  }

  /**
   * Reserve balance (internal - called when creating payout)
   */
  async reserveBalance(merchantId, amount) {
    const merchant = await Merchant.findById(merchantId);
    
    if (merchant.balance.available < amount) {
      const error = new Error('Insufficient balance');
      error.statusCode = 400;
      error.code = 'INSUFFICIENT_BALANCE';
      throw error;
    }
    
    merchant.balance.available -= amount;
    merchant.balance.pending += amount;
    await merchant.save();
    
    logger.info(`Reserved balance: ${amount} for merchant ${merchant.merchant_no}`);
  }

  /**
   * Release balance (internal - called when payout succeeds/fails)
   */
  async releaseBalance(merchantId, amount, success = false) {
    const merchant = await Merchant.findById(merchantId);
    
    merchant.balance.pending -= amount;
    
    if (success) {
      // Payout succeeded - deduct from total
      merchant.balance.total -= amount;
    } else {
      // Payout failed - return to available
      merchant.balance.available += amount;
    }
    
    await merchant.save();
    
    logger.info(`Released balance: ${amount} (success: ${success}) for merchant ${merchant.merchant_no}`);
  }
}

module.exports = new BalanceService();
