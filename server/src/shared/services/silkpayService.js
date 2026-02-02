const crypto = require('crypto');
const axios = require('axios');
const logger = require('../../shared/utils/logger');

// 1. Module-Scoped Configuration (Singleton)
const CONFIG = {
  apiUrl: process.env.SILKPAY_API_URL,
  merchantId: process.env.SILKPAY_MERCHANT_ID,
  secretKey: process.env.SILKPAY_SECRET_KEY,
  webhookUrl: `${process.env.BACKEND_URL}/api/webhook/silkpay`
};

// 2. Immediate Validation
if (!CONFIG.apiUrl || !CONFIG.merchantId || !CONFIG.secretKey) {
  logger.error('SilkPay configuration missing');
}

// 3. Initialize Shared Axios Client
const client = axios.create({
  baseURL: CONFIG.apiUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request Interceptor
client.interceptors.request.use(request => {
  return request;
});

/**
 * Helper: Generate MD5 signature
 */
const generateSignature = (data, type = 'balance') => {
  let signString = '';
  
  switch (type) {
    case 'payout': // md5(mId+mOrderId+amount+timestamp+secret)
      signString = `${data.mId}${data.mOrderId}${data.amount}${data.timestamp}${CONFIG.secretKey}`;
      break;
    case 'query': // md5(mId+mOrderId+timestamp+secret)
      signString = `${data.mId}${data.mOrderId}${data.timestamp}${CONFIG.secretKey}`;
      break;
    case 'balance': // md5(mId+timestamp+secret)
      signString = `${data.mId}${data.timestamp}${CONFIG.secretKey}`;
      break;
    case 'list': // md5(mId+timestamp+secret) - Assuming generic read signature
      signString = `${data.mId}${data.timestamp}${CONFIG.secretKey}`;
      break;
    default:
      throw new Error(`Unknown signature type: ${type}`);
  }
  
  return crypto.createHash('md5').update(signString).digest('hex').toLowerCase();
};

/**
 * Service Class (Adapter)
 */
class SilkPayService {
  
  /**
   * Normalize Status Code
   * Maps SilkPay codes to Internal Status
   */
  normalizeStatus(statusCode) {
      if (statusCode === '1' || statusCode === '200' || statusCode === '2' || statusCode === 2) return 'SUCCESS';
      if (statusCode === '3' || statusCode === 3 || statusCode === 'FAILED') return 'FAILED';
      if (statusCode === '0' || statusCode === 'PROCESSING') return 'PROCESSING'; 
      return 'FAILED';
  }

  /**
   * Verify webhook signature
   */
  verifySignature(params, receivedSignature) {
    if (!receivedSignature) return false;
    
    const signString = `${params.mId}${params.mOrderId}${params.amount}${params.timestamp}${CONFIG.secretKey}`;
    const calculated = crypto.createHash('md5').update(signString).digest('hex').toLowerCase();
    
    return calculated === receivedSignature.toLowerCase();
  }

  /**
   * Create Payout
   * Returns: { success: boolean, status: string, external_id: string, message: string }
   */
  async createPayout(payoutData) {
    const params = {
      amount: parseFloat(payoutData.amount).toFixed(2),
      mId: CONFIG.merchantId,
      mOrderId: payoutData.out_trade_no,
      timestamp: Date.now(),
      notifyUrl: CONFIG.webhookUrl,
      upi: payoutData.upi || '',
      bankNo: payoutData.account_number,
      ifsc: payoutData.ifsc_code,
      name: payoutData.beneficiary_name
    };

    params.sign = generateSignature(params, 'payout');

    try {
      logger.info('Creating SilkPay Payout', { mOrderId: params.mOrderId, amount: params.amount });
      
      const response = await client.post('/transaction/payout', params);

      logger.info('SilkPay Payout Response', { 
        status: response.data.status, 
        payOrderId: response.data.data?.payOrderId 
      });

      // Normalize Response
      const isSuccess = response.data.status === '200';
      
      return {
          success: isSuccess,
          status: isSuccess ? 'PROCESSING' : 'FAILED', // Payout creation is usually PROCESSING, not immediate SUCCESS
          external_id: response.data.data?.payOrderId,
          message: response.data.message,
          raw: response.data
      };

    } catch (error) {
      this._handleError('Payout Creation', error, params);
    }
  }

  /**
   * Query Payout Status
   * Returns: { status: string, external_id: string, amount: string, raw: object }
   */
  async queryPayout(outTradeNo) {
    const params = {
      mId: CONFIG.merchantId,
      mOrderId: outTradeNo,
      timestamp: Date.now()
    };

    params.sign = generateSignature(params, 'query');

    try {
      const response = await client.post('/transaction/payout/query', params, { timeout: 15000 });
      
      // Normalize Status from 'status' field (e.g. "1" or "2")
      const silkpayStatus = response.data.data?.status || response.data.status;
      const normalizedStatus = this.normalizeStatus(silkpayStatus);
      
      // Checking if status is PROCESSING, verify with List API (Source of Truth) because /query might be stale
      if (normalizedStatus === 'PROCESSING') {
          try {
             const listStatus = await this.checkStatusViaList(outTradeNo);
             if (listStatus && listStatus !== 'PROCESSING') {
                 logger.info(`Corrected Status via List API: ${listStatus} (Query said ${normalizedStatus})`);
                 return {
                     status: listStatus,
                     external_id: response.data.data?.payOrderId,
                     amount: response.data.data?.amount,
                     raw: response.data // Keep original raw but override status
                 };
             }
          } catch (listErr) {
             logger.warn('Failed to double-check with List API', listErr);
          }
      }

      return {
          status: normalizedStatus,
          external_id: response.data.data?.payOrderId,
          amount: response.data.data?.amount,
          raw: response.data
      };

    } catch (error) {
      this._handleError('Payout Query', error, { mOrderId: outTradeNo });
    }
  }

  /**
   * Helper: Check status via List API
   */
  async checkStatusViaList(outTradeNo) {
      const params = {
          mId: CONFIG.merchantId,
          timestamp: Date.now(),
          page: 1,
          limit: 10,
          mOrderId: outTradeNo // Try filtering by our ID
      };
      
      params.sign = generateSignature(params, 'list');
      
      // Try /transaction/payout/list as suggested (inferred path)
      const response = await client.post('/transaction/payout/list', params);
      
      if (response.data?.status === '200' && response.data?.data?.items) {
          const item = response.data.data.items.find(i => i.mOrderId === outTradeNo);
          if (item) {
              return this.normalizeStatus(item.status);
          }
      }
      return null;
  }

  /**
   * Get Merchant Balance
   * Returns: { available: number, pending: number, raw: object }
   */
  async getMerchantBalance() {
    const params = {
      mId: CONFIG.merchantId,
      timestamp: Date.now()
    };

    params.sign = generateSignature(params, 'balance');

    try {
      const response = await client.post('/transaction/balance', params, { timeout: 15000 });
      
      return {
          available: parseFloat(response.data.data?.availableAmount || 0),
          pending: parseFloat(response.data.data?.pendingAmount || 0),
          raw: response.data
      };

    } catch (error) {
      this._handleError('Balance Query', error);
    }
  }

  /**
   * Centralized Error Handler
   * @private
   */
  _handleError(context, error, data = {}) {
    const errorMsg = error.response?.data?.message || error.message;
    const statusCode = error.response?.status || 500;
    
    logger.error(`SilkPay ${context} Error`, {
      message: errorMsg,
      status: statusCode,
      data: error.response?.data
    });

    const customError = new Error(`SilkPay ${context} Failed: ${errorMsg}`);
    customError.statusCode = statusCode;
    customError.response = error.response?.data;
    throw customError;
  }
}

module.exports = new SilkPayService();
