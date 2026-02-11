const payoutService = require('./payout.service');

// Helper to get merchant ID safely
const getMerchantId = (user) => {
  if (!user.merchant_id) return null;
  return user.merchant_id._id || user.merchant_id;
};

/**
 * Create payout
 * POST /api/payouts
 */
exports.createPayout = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const merchantNo = req.user.merchant_id.merchant_no || req.user.merchant_no;
    
    const result = await payoutService.createPayout(merchantId, merchantNo, req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payouts
 * GET /api/payouts
 */
exports.getPayouts = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);

    const filters = {
      status: req.query.status,
      source: req.query.source, // Added source
      beneficiary_id: req.query.beneficiary_id,
      account_number: req.query.account_number, // Added account_number
      beneficiary_name: req.query.beneficiary_name, // Added beneficiary_name
      min_amount: req.query.min_amount, // Added min_amount
      max_amount: req.query.max_amount, // Added max_amount
      start_date: req.query.start_date, // Added start_date
      end_date: req.query.end_date, // Added end_date
      search: req.query.search,
      page: req.query.page || 1,
      limit: req.query.limit || 10
    };
    
    const result = await payoutService.getPayouts(merchantId, filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single payout
 * GET /api/payouts/:id
 */
exports.getPayoutById = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const payoutId = req.params.id;
    
    const payout = await payoutService.getPayoutById(payoutId, merchantId);
    
    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Query payout status
 * GET /api/payouts/:id/status
 */
exports.queryPayoutStatus = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const payoutId = req.params.id;
    
    const payout = await payoutService.queryPayoutStatus(payoutId, merchantId);
    
    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    next(error);
  }
};
