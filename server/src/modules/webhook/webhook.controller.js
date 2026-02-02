const silkpayService = require('../../shared/services/silkpayService');
const payoutService = require('../payout/payout.service');
const logger = require('../../shared/utils/logger');

/**
 * Handle SilkPay asynchronous notifications
 * POST /api/webhook/silkpay
 */
exports.handleSilkPayCallback = async (req, res, next) => {
  try {
    const params = req.body;
    
    console.log('----------------------------------------------------');
    console.log('🔔 [Webhook] Received Callback:', JSON.stringify(params, null, 2));

    // 1. Verify Signature
    const signature = params.sign;
    const isValid = silkpayService.verifySignature(params, signature);

    if (!isValid) {
      logger.warn('Webhook signature verification failed', { params });
      // Depending on SilkPay specs, we might want to return valid status anyway to stop retries if it's junk data,
      // but usually we fail 400. However, doc says "otherwise we will retry", so we should probably fail?
      // Let's return 400.
      return res.status(400).send('Invalid Signature');
    }

    // 2. Identify Status
    // Use Adapter to normalize status code (e.g. "1" -> "SUCCESS")
    const newStatus = silkpayService.normalizeStatus(params.status);

    // 3. Update Payout Status via Service
    // We need a method to find by mOrderId and update.
    await payoutService.handleWebhookUpdate(params.mOrderId, newStatus, params);

    console.log('✅ [Webhook] Processed Successfully');
    console.log('----------------------------------------------------');

    // 4. Return "OK" string as required
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');

  } catch (error) {
    logger.error('Webhook processing error', { error: error.message });
    console.error('❌ [Webhook] Error:', error);
    // If internal error, send 500 so SilkPay retries
    res.status(500).send('Internal Server Error');
  }
};
