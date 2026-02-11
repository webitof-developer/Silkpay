const dashboardService = require('./dashboard.service');

// Helper to get merchant ID safely
const getMerchantId = (user) => {
  if (!user.merchant_id) return null;
  return user.merchant_id._id || user.merchant_id;
};

/**
 * Get dashboard overview
 * GET /api/dashboard/overview
 */
exports.getOverview = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const overview = await dashboardService.getOverview(merchantId);
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payout trends
 * GET /api/dashboard/trends
 */
exports.getPayoutTrends = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const days = parseInt(req.query.days) || 30;
    
    const trends = await dashboardService.getPayoutTrends(merchantId, days);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top beneficiaries
 * GET /api/dashboard/top-beneficiaries
 */
exports.getTopBeneficiaries = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const limit = parseInt(req.query.limit) || 5;
    
    const topBeneficiaries = await dashboardService.getTopBeneficiaries(merchantId, limit);
    
    res.json({
      success: true,
      data: topBeneficiaries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity
 * GET /api/dashboard/recent-activity
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const limit = parseInt(req.query.limit) || 10;
    
    const activity = await dashboardService.getRecentActivity(merchantId, limit);
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
};
