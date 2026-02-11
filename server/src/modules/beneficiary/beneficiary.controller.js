const beneficiaryService = require('./beneficiary.service');

// Helper to get merchant ID safely
const getMerchantId = (user) => {
  if (!user.merchant_id) return null;
  return user.merchant_id._id || user.merchant_id;
};

/**
 * Get all beneficiaries
 * GET /api/beneficiaries
 */
exports.getBeneficiaries = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const filters = {
      search: req.query.search,
      status: req.query.status,
      page: req.query.page || 1,
      limit: req.query.limit || 10
    };
    
    const result = await beneficiaryService.getBeneficiaries(merchantId, filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single beneficiary
 * GET /api/beneficiaries/:id
 */
exports.getBeneficiaryById = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const beneficiaryId = req.params.id;
    
    const beneficiary = await beneficiaryService.getBeneficiaryById(beneficiaryId, merchantId);
    
    res.json({
      success: true,
      data: beneficiary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create beneficiary
 * POST /api/beneficiaries
 */
exports.createBeneficiary = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const merchantNo = req.user.merchant_id.merchant_no || req.user.merchant_no;
    
    const beneficiary = await beneficiaryService.createBeneficiary(
      merchantId,
      merchantNo,
      req.body
    );
    
    res.status(201).json({
      success: true,
      data: beneficiary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update beneficiary
 * PUT /api/beneficiaries/:id
 */
exports.updateBeneficiary = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const beneficiaryId = req.params.id;
    
    const beneficiary = await beneficiaryService.updateBeneficiary(
      beneficiaryId,
      merchantId,
      req.body
    );
    
    res.json({
      success: true,
      data: beneficiary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete beneficiary
 * DELETE /api/beneficiaries/:id
 */
exports.deleteBeneficiary = async (req, res, next) => {
  try {
    const merchantId = getMerchantId(req.user);
    const beneficiaryId = req.params.id;
    
    const result = await beneficiaryService.deleteBeneficiary(beneficiaryId, merchantId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
