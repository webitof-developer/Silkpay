const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  merchant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
    index: true
  },
  merchant_no: {
    type: String,
    required: true,
    index: true
  },
  beneficiary_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary',
    required: true,
    index: true
  },
  // SilkPay Fields
  silkpay_order_no: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  out_trade_no: {
    type: String, // Our internal reference
    required: true,
    unique: true,
    index: true
  },
  // Payout Details
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    get: (v) => v ? parseFloat(v.toString()) : 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR']
  },
  beneficiary_details: {
    name: {
      type: String,
      required: true
    },
    account_number: {
      type: String,
      required: true
    },
    ifsc_code: {
      type: String,
      required: true
    },
    mobile: String,
    email: String
  },
  // Status Tracking
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED'],
    default: 'PENDING',
    index: true
  },
  failure_reason: {
    type: String
  },
  // SilkPay Response
  silkpay_response: {
    code: String,
    message: String,
    data: mongoose.Schema.Types.Mixed
  },
  // Timestamps
  initiated_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date
  },
  // Metadata
  purpose: {
    type: String,
    maxlength: 200
  },
  notes: {
    type: String,
    maxlength: 500
  },
  // Webhook tracking
  webhook_received: {
    type: Boolean,
    default: false
  },
  webhook_count: {
    type: Number,
    default: 0
  },
  last_webhook_at: {
    type: Date
  },
  finalized_by: {
    type: String,
    enum: ['WEBHOOK', 'QUERY', 'MANUAL'],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Compound indexes only (unique indexes on silkpay_order_no and out_trade_no are defined inline)
PayoutSchema.index({ merchant_id: 1, status: 1 });
PayoutSchema.index({ merchant_id: 1, createdAt: -1 });

// Static method to generate unique out_trade_no
PayoutSchema.statics.generateOutTradeNo = function(merchantNo) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${merchantNo}_${timestamp}_${random}`;
};

// Method to check if payout is in final state
PayoutSchema.methods.isFinalState = function() {
  return ['SUCCESS', 'FAILED', 'REVERSED'].includes(this.status);
};

module.exports = mongoose.model('Payout', PayoutSchema);
