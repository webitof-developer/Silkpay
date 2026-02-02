const Beneficiary = require('./beneficiary.model');
const logger = require('../../shared/utils/logger');

class BeneficiaryService {
  /**
   * Get all beneficiaries for a merchant with filters
   */
  async getBeneficiaries(merchantId, filters = {}) {
    const { search, status, page = 1, limit = 10 } = filters;
    
    const query = { merchant_id: merchantId };
    
    // Add status filter
    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
      query.status = status;
    }
    
    // Filter out ONE_TIME beneficiaries by default (unless specifically asked for, which we don't usually)
    query.type = { $ne: 'ONE_TIME' };
    
    // Add search filter (name, mobile, email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'contact_info.mobile': { $regex: search, $options: 'i' } },
        { 'contact_info.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [beneficiaries, total] = await Promise.all([
      Beneficiary.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Beneficiary.countDocuments(query)
    ]);
    
    // Mask account numbers in response
    const maskedBeneficiaries = beneficiaries.map(b => ({
      ...b,
      bank_details: {
        ...b.bank_details,
        account_number: this.maskAccountNumber(b.bank_details.account_number)
      }
    }));
    
    return {
      beneficiaries: maskedBeneficiaries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single beneficiary by ID
   */
  async getBeneficiaryById(beneficiaryId, merchantId) {
    const beneficiary = await Beneficiary.findOne({
      _id: beneficiaryId,
      merchant_id: merchantId
    }).lean();
    
    if (!beneficiary) {
      const error = new Error('Beneficiary not found');
      error.statusCode = 404;
      error.code = 'BENEFICIARY_NOT_FOUND';
      throw error;
    }
    
    // Mask account number
    beneficiary.bank_details.account_number = this.maskAccountNumber(
      beneficiary.bank_details.account_number
    );
    
    return beneficiary;
  }

  /**
   * Create new beneficiary
   */
  async createBeneficiary(merchantId, merchantNo, data) {
    // Check for duplicate account number
    const existing = await Beneficiary.findOne({
      merchant_id: merchantId,
      'bank_details.account_number': data.bank_details.account_number
    });
    
    if (existing) {
      const error = new Error('Beneficiary with this account number already exists');
      error.statusCode = 409;
      error.code = 'DUPLICATE_BENEFICIARY';
      throw error;
    }
    
    const beneficiary = await Beneficiary.create({
      ...data,
      merchant_id: merchantId,
      merchant_no: merchantNo
    });
    
    logger.info(`Beneficiary created: ${beneficiary._id} by merchant ${merchantNo}`);
    
    // Return with masked account number
    const result = beneficiary.toObject();
    result.bank_details.account_number = beneficiary.getMaskedAccountNumber();
    
    return result;
  }

  /**
   * Update beneficiary
   */
  async updateBeneficiary(beneficiaryId, merchantId, data) {
    const beneficiary = await Beneficiary.findOne({
      _id: beneficiaryId,
      merchant_id: merchantId
    });
    
    if (!beneficiary) {
      const error = new Error('Beneficiary not found');
      error.statusCode = 404;
      error.code = 'BENEFICIARY_NOT_FOUND';
      throw error;
    }
    
    // Update allowed fields
    if (data.name) beneficiary.name = data.name;
    if (data.contact_info) {
      beneficiary.contact_info = {
        ...beneficiary.contact_info,
        ...data.contact_info
      };
    }
    if (data.bank_details) {
      beneficiary.bank_details = {
        ...beneficiary.bank_details,
        ...data.bank_details
      };
    }
    if (data.notes !== undefined) beneficiary.notes = data.notes;
    
    await beneficiary.save();
    
    logger.info(`Beneficiary updated: ${beneficiary._id}`);
    
    const result = beneficiary.toObject();
    result.bank_details.account_number = beneficiary.getMaskedAccountNumber();
    
    return result;
  }

  /**
   * Delete beneficiary (soft delete - mark as INACTIVE)
   */
  async deleteBeneficiary(beneficiaryId, merchantId) {
    const beneficiary = await Beneficiary.findOne({
      _id: beneficiaryId,
      merchant_id: merchantId
    });
    
    if (!beneficiary) {
      const error = new Error('Beneficiary not found');
      error.statusCode = 404;
      error.code = 'BENEFICIARY_NOT_FOUND';
      throw error;
    }
    
    beneficiary.status = 'INACTIVE';
    await beneficiary.save();
    
    logger.info(`Beneficiary deleted (soft): ${beneficiary._id}`);
    
    return { message: 'Beneficiary deleted successfully' };
  }

  /**
   * Helper: Mask account number
   */
  maskAccountNumber(encryptedAccountNumber) {
    if (!encryptedAccountNumber) return 'XXXX';
    
    // Extract last 4 digits from encrypted string
    const parts = encryptedAccountNumber.split(':');
    if (parts.length !== 2) return 'XXXX';
    
    // For display, just return masked version
    // (We don't decrypt for listing/viewing, only for payouts)
    return 'XXXX' + encryptedAccountNumber.slice(-4);
  }
}

module.exports = new BeneficiaryService();
