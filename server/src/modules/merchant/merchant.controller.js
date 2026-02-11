const merchantService = require('./merchant.service');

// Helper to get merchant ID safely
const getMerchantId = (user) => {
  if (!user.merchant_id) return null;
  return user.merchant_id._id || user.merchant_id;
};

/**
 * Get merchant profile
 * GET /api/merchant/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const profile = await merchantService.getProfile(merchantId);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update merchant profile
 * PUT /api/merchant/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const profile = await merchantService.updateProfile(merchantId, req.body, req.user._id);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get API keys
 * GET /api/merchant/api-keys
 */
exports.getAPIKeys = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const keys = await merchantService.getAPIKeys(merchantId);
    
    res.json({
      success: true,
      data: keys
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Change password
 * POST /api/merchant/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const { oldPassword, newPassword } = req.body;
    
    const result = await merchantService.changePassword(merchantId, oldPassword, newPassword);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
