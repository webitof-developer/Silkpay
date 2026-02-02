const Transaction = require('./transaction.model');
const { Parser } = require('json2csv');
const logger = require('../../shared/utils/logger');

class TransactionService {
  /**
   * Get transactions with filters
   */
  async getTransactions(merchantId, filters = {}) {
    const { type, payout_id, start_date, end_date, search, page = 1, limit = 20 } = filters;
    
    const query = { merchant_id: merchantId };
    
    if (type) query.type = type;
    if (payout_id) query.payout_id = payout_id;
    
    // Date range filter
    if (start_date || end_date) {
      query.createdAt = {};
      if (start_date) query.createdAt.$gte = new Date(start_date);
      if (end_date) query.createdAt.$lte = new Date(end_date);
    }
    
    // Search in description or reference
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { reference_no: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('payout_id')
        .lean(),
      Transaction.countDocuments(query)
    ]);
    
    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single transaction
   */
  async getTransactionById(transactionId, merchantId) {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      merchant_id: merchantId
    }).lean();
    
    if (!transaction) {
      const error = new Error('Transaction not found');
      error.statusCode = 404;
      error.code = 'TRANSACTION_NOT_FOUND';
      throw error;
    }
    
    return transaction;
  }

  /**
   * Create transaction (internal use by other modules)
   */
  async createTransaction(data) {
    const transaction = await Transaction.create(data);
    
    logger.info(`Transaction created: ${transaction.type}`, {
      merchant_no: data.merchant_no,
      amount: data.amount,
      type: data.type
    });
    
    return transaction;
  }

  /**
   * Export transactions to CSV
   */
  async exportTransactions(merchantId, filters = {}) {
    // Get all matching transactions (no pagination)
    const query = { merchant_id: merchantId };
    
    if (filters.type) query.type = filters.type;
    if (filters.start_date || filters.end_date) {
      query.createdAt = {};
      if (filters.start_date) query.createdAt.$gte = new Date(filters.start_date);
      if (filters.end_date) query.createdAt.$lte = new Date(filters.end_date);
    }
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(10000) // Max 10k records
      .lean();
    
    if (transactions.length === 0) {
      const error = new Error('No transactions found to export');
      error.statusCode = 404;
      error.code = 'NO_DATA';
      throw error;
    }
    
    // Convert to CSV
    const fields = [
      { label: 'Date', value: 'createdAt' },
      { label: 'Type', value: 'type' },
      { label: 'Amount', value: 'amount' },
      { label: 'Currency', value: 'currency' },
      { label: 'Balance Before', value: 'balance_before' },
      { label: 'Balance After', value: 'balance_after' },
      { label: 'Description', value: 'description' },
      { label: 'Reference', value: 'reference_no' }
    ];
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transactions);
    
    logger.info(`Exported ${transactions.length} transactions for merchant ${merchantId}`);
    
    return csv;
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(merchantId, filters = {}) {
    const { start_date, end_date } = filters;
    
    const matchQuery = { merchant_id: merchantId };
    
    if (start_date || end_date) {
      matchQuery.createdAt = {};
      if (start_date) matchQuery.createdAt.$gte = new Date(start_date);
      if (end_date) matchQuery.createdAt.$lte = new Date(end_date);
    }
    
    const stats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          total_amount: { $sum: { $toDouble: '$amount' } }
        }
      }
    ]);
    
    // Format stats
    const formattedStats = {
      total_transactions: stats.reduce((sum, s) => sum + s.count, 0),
      by_type: {}
    };
    
    stats.forEach(stat => {
      formattedStats.by_type[stat._id] = {
        count: stat.count,
        total_amount: stat.total_amount
      };
    });
    
    return formattedStats;
  }
}

module.exports = new TransactionService();
