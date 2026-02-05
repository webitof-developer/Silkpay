const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../../shared/utils/encryption');

const BeneficiarySchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact_info: {
    mobile: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  bank_details: {
    account_number: {
      type: String,
      required: true
    },
    ifsc_code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format']
    },
    bank_name: {
      type: String,
      trim: true
    },
    upi_id: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  type: {
    type: String,
    enum: ['REGULAR', 'ONE_TIME'],
    default: 'REGULAR'
  },
  deactivatedAt: {
    type: Date,
    default: null
  },
  stats: {
    total_payouts: {
      type: Number,
      default: 0
    },
    total_amount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
      get: (v) => v ? parseFloat(v.toString()) : 0
    },
    last_payout_date: {
      type: Date,
      default: null
    }
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Compound index for merchant + account number (prevent duplicates)
BeneficiarySchema.index({ merchant_id: 1, 'bank_details.account_number': 1 }, { unique: true });

// Index for searching by name
BeneficiarySchema.index({ merchant_id: 1, name: 1 });

// Encrypt account number before saving
BeneficiarySchema.pre('save', function(next) {
  if (!this.isModified('bank_details.account_number')) return next();
  
  // Only encrypt if not already encrypted (check for ':' separator)
  if (!this.bank_details.account_number.includes(':')) {
    this.bank_details.account_number = encrypt(this.bank_details.account_number);
  }
  
  next();
});

// Method to get decrypted account number
BeneficiarySchema.methods.getDecryptedAccountNumber = function() {
  return decrypt(this.bank_details.account_number);
};

// Method to get masked account number (e.g., XXXX1234)
BeneficiarySchema.methods.getMaskedAccountNumber = function() {
  const decrypted = this.getDecryptedAccountNumber();
  if (!decrypted || decrypted.length < 4) return 'XXXX';
  return 'X'.repeat(decrypted.length - 4) + decrypted.slice(-4);
};

// Virtual for account number display (masked by default)
BeneficiarySchema.virtual('account_number_masked').get(function() {
  return this.getMaskedAccountNumber();
});

module.exports = mongoose.model('Beneficiary', BeneficiarySchema);
