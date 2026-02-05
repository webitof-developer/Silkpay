const Payout = require('./payout.model');
const Beneficiary = require('../beneficiary/beneficiary.model');
const Merchant = require('../merchant/merchant.model');
const silkpayService = require('../../shared/services/silkpayService');
const logger = require('../../shared/utils/logger');
const transactionService = require('../transaction/transaction.service');

class PayoutService {
  /**
   * Create new payout
   */
  async createPayout(merchantId, merchantNo, data) {
    // Get or Create beneficiary
    let beneficiary;

    if (data.source === 'ONE_TIME' && !data.beneficiary_id) {
        // Create new beneficiary for one-time payout
        const beneficiaryService = require('../beneficiary/beneficiary.service');
        const newBeneficiaryData = {
            name: data.beneficiary_name,
            bank_details: {
                account_number: data.account_number,
                ifsc_code: data.ifsc_code,
                bank_name: 'Unknown', // Could be derived from IFSC if we had a lookup
                upi_id: data.upi
            },
            status: 'ACTIVE', // Must be active to use
            type: 'ONE_TIME'
        };
        
        // Note: Duplicate check in beneficiary service might fail if encryption isn't deterministic
        // But for now we proceed. Ideally we catch duplicate error and try to look it up, 
        // but lookup is hard with random encryption.
        try {
            const created = await beneficiaryService.createBeneficiary(merchantId, merchantNo, newBeneficiaryData);
            // created is an object (lean), we need a Mongoose document for methods like getDecryptedAccountNumber
            beneficiary = await Beneficiary.findById(created._id); 
        } catch (error) {
             // Fallback: If duplicate error, we can't easily find the ID. 
             // We'll let the error propagate for now or user must use "Saved Beneficiary"
             throw error;
        }

    } else {
        // Existing Beneficiary
        beneficiary = await Beneficiary.findOne({
            _id: data.beneficiary_id,
            merchant_id: merchantId,
            status: 'ACTIVE'
        });

        if (!beneficiary) {
            const error = new Error('Beneficiary not found or inactive');
            error.statusCode = 404;
            error.code = 'BENEFICIARY_NOT_FOUND';
            throw error;
        }
    }

    // Check merchant balance
    const merchant = await Merchant.findById(merchantId);
    if (merchant.balance.available < parseFloat(data.amount)) {
      const error = new Error('Insufficient balance');
      error.statusCode = 400;
      error.code = 'INSUFFICIENT_BALANCE';
      throw error;
    }

    // Generate unique out_trade_no
    const outTradeNo = Payout.generateOutTradeNo(merchantNo);

    // Decrypt account number for SilkPay
    const decryptedAccountNumber = beneficiary.getDecryptedAccountNumber();

    // Prepare SilkPay payout request
    const silkpayRequest = {
      out_trade_no: outTradeNo,
      amount: data.amount,
      currency: data.currency || 'INR',
      beneficiary_name: beneficiary.name,
      account_number: decryptedAccountNumber,
      ifsc_code: beneficiary.bank_details.ifsc_code,
      mobile: beneficiary.contact_info?.mobile || '',
      email: beneficiary.contact_info?.email || '',
      upi: beneficiary.bank_details.upi_id || '', // Pass stored UPI ID
      purpose: data.purpose || 'Payout'
    };

    try {
      // Call SilkPay API
      const silkpayResponse = await silkpayService.createPayout(silkpayRequest);

      // Create payout record
      const payout = await Payout.create({
        merchant_id: merchantId,
        merchant_no: merchantNo,
        beneficiary_id: beneficiary._id,
        silkpay_order_no: silkpayResponse.external_id || outTradeNo,
        out_trade_no: outTradeNo,
        amount: data.amount,
        currency: data.currency || 'INR',
        beneficiary_details: {
          name: beneficiary.name,
          account_number: beneficiary.getMaskedAccountNumber(),
          ifsc_code: beneficiary.bank_details.ifsc_code,
          mobile: beneficiary.contact_info?.mobile,
          email: beneficiary.contact_info?.email
        },
        // Adapter returns normalized status 'PROCESSING' or 'FAILED'
        status: silkpayResponse.status,
        silkpay_response: silkpayResponse.raw,
        purpose: data.purpose,
        notes: data.notes
      });

      // Deduct from available balance, add to pending
      const balanceBefore = merchant.balance.available;
      merchant.balance.available -= parseFloat(data.amount);
      merchant.balance.pending += parseFloat(data.amount);
      await merchant.save();

      // Create Transaction Record (PAYOUT)
      await transactionService.createTransaction({
        merchant_id: merchantId,
        merchant_no: merchantNo,
        type: 'PAYOUT',
        payout_id: payout._id,
        amount: data.amount,
        currency: data.currency || 'INR',
        balance_before: balanceBefore,
        balance_after: merchant.balance.available,
        description: `Payout to ${beneficiary.name}`,
        reference_no: outTradeNo
      });

      logger.info(`Payout created: ${payout.out_trade_no}`, {
        merchant_no: merchantNo,
        amount: data.amount,
        beneficiary: beneficiary.name
      });

      return payout;
    } catch (error) {
      logger.error('Payout creation failed', {
        merchant_no: merchantNo,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get payouts with filters
   */
  async getPayouts(merchantId, filters = {}) {
    const { status, beneficiary_id, search, page = 1, limit = 10 } = filters;
    
    const query = { merchant_id: merchantId };
    
    if (status) query.status = status;
    if (beneficiary_id) query.beneficiary_id = beneficiary_id;
    
    if (search) {
      query.$or = [
        { out_trade_no: { $regex: search, $options: 'i' } },
        { silkpay_order_no: { $regex: search, $options: 'i' } },
        { 'beneficiary_details.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Payout.countDocuments(query)
    ]);
    
    return {
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single payout
   */
  async getPayoutById(payoutId, merchantId) {
    const payout = await Payout.findOne({
      _id: payoutId,
      merchant_id: merchantId
    }).lean();
    
    if (!payout) {
      const error = new Error('Payout not found');
      error.statusCode = 404;
      error.code = 'PAYOUT_NOT_FOUND';
      throw error;
    }
    
    return payout;
  }

  /**
   * Query payout status from SilkPay
   */
  async queryPayoutStatus(payoutId, merchantId) {
    const payout = await Payout.findOne({
      _id: payoutId,
      merchant_id: merchantId
    });
    
    if (!payout) {
      const error = new Error('Payout not found');
      error.statusCode = 404;
      error.code = 'PAYOUT_NOT_FOUND';
      throw error;
    }

    try {
      const statusResponse = await silkpayService.queryPayout(payout.out_trade_no);
      
      // Update payout if status changed
      if (statusResponse.data?.status && statusResponse.data.status !== payout.status) {
        payout.finalized_by = 'MANUAL'; // Since this is triggered manually via API
        await this.updatePayoutStatus(payout, statusResponse.data.status, statusResponse);
      }

      return await Payout.findById(payoutId).lean();
    } catch (error) {
      logger.error('Payout status query failed', {
        payout_id: payoutId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Update payout status (used by webhook and worker)
   */
  async updatePayoutStatus(payout, newStatus, responseData = {}) {
    const oldStatus = payout.status;
    
    payout.status = newStatus;
    payout.silkpay_response = responseData;

    if (newStatus === 'SUCCESS') {
      payout.completed_at = new Date(); // Strict Finality Timestamp
      payout.webhook_received = payout.webhook_received || false; // Ensure field exists
      
      // Update merchant balance
      const merchant = await Merchant.findById(payout.merchant_id);
      merchant.balance.pending -= parseFloat(payout.amount);
      merchant.balance.total -= parseFloat(payout.amount);
      await merchant.save();

      // Update beneficiary stats
      await Beneficiary.findByIdAndUpdate(payout.beneficiary_id, {
        $inc: {
          'stats.total_payouts': 1,
          'stats.total_amount': parseFloat(payout.amount)
        },
        $set: {
          'stats.last_payout_date': new Date()
        }
      });
    } else if (newStatus === 'FAILED' || newStatus === 'REVERSED') {
      payout.completed_at = new Date();
      payout.failure_reason = responseData.message || 'Payout failed';

      // Refund to available balance
      const merchant = await Merchant.findById(payout.merchant_id);
      const balanceBefore = merchant.balance.available; // This is before refund
      
      merchant.balance.pending -= parseFloat(payout.amount);
      merchant.balance.available += parseFloat(payout.amount);
      await merchant.save();

      // Create Transaction Record (REFUND)
      await transactionService.createTransaction({
        merchant_id: payout.merchant_id,
        merchant_no: payout.merchant_no,
        type: 'REFUND',
        payout_id: payout._id,
        amount: payout.amount,
        currency: payout.currency || 'INR',
        balance_before: balanceBefore,
        balance_after: merchant.balance.available,
        description: `Refund for failed payout: ${payout.out_trade_no}`,
        reference_no: `REF-${payout.out_trade_no}`
      });
    }

    await payout.save();

    logger.info(`Payout status updated: ${payout.out_trade_no}`, {
      old_status: oldStatus,
      new_status: newStatus
    });

    return payout;
  }
  /**
   * Handle webhook update by mOrderId
   */
  async handleWebhookUpdate(mOrderId, newStatus, responseData) {
    const payout = await Payout.findOne({ out_trade_no: mOrderId });
    
    if (!payout) {
      logger.warn(`Webhook: Payout not found for mOrderId ${mOrderId}`);
      // If not found, we throw error so webhook doesn't erroneously return OK? 
      // Or maybe it's a test data mismatch.
      throw new Error('Payout not found');
    }

    // Idempotency Check: If already in final state, ignore updates unless it's a correction (e.g. strict requirement: 2/3 override 0/1)
    // But per ground truth: 0/1 are not final. 
    // And if DB says Success/Failed, we only override if the new status is somehow different but authoritative? 
    // Ground Truth says: Callback is FINAL. If we already have a callback final state, we ignore.
    if (payout.isFinalState()) {
        logger.info(`Webhook: Payout ${mOrderId} already in terminal state ${payout.status}. Ignoring update to ${newStatus}.`);
        return payout;
    }

    // Set Webhook Tracking fields
    payout.webhook_received = true;
    payout.last_webhook_at = new Date();
    payout.webhook_count = (payout.webhook_count || 0) + 1;
    
    // We save these tracking fields regardless of status change? 
    // Yes, to indicate we received authoritative signal.
    // If status matches current, we still save metadata.
    if (payout.status === newStatus) {
        await payout.save();
        return payout;
    }

    // Mark authoritative source
    payout.finalized_by = 'WEBHOOK';

    return await this.updatePayoutStatus(payout, newStatus, responseData);
  }
}

module.exports = new PayoutService();
