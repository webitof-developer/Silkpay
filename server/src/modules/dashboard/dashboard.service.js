const Payout = require('../payout/payout.model');
const Beneficiary = require('../beneficiary/beneficiary.model');
const Transaction = require('../transaction/transaction.model');
const Merchant = require('../merchant/merchant.model');

class DashboardService {
  /**
   * Get dashboard overview stats
   */
  async getOverview(merchantId) {
    const merchant = await Merchant.findById(merchantId);
    
    // Get counts
    const [totalPayouts, totalBeneficiaries, pendingPayouts] = await Promise.all([
      Payout.countDocuments({ merchant_id: merchantId }),
      Beneficiary.countDocuments({ merchant_id: merchantId, status: 'ACTIVE' }),
      Payout.countDocuments({ merchant_id: merchantId, status: { $in: ['PENDING', 'PROCESSING'] } })
    ]);
    
    // Get payout stats by status
    const payoutStats = await Payout.aggregate([
      { $match: { merchant_id: merchantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total_amount: { $sum: { $toDouble: '$amount' } }
        }
      }
    ]);
    
    // Get today's stats
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayStats = await Payout.aggregate([
      { 
        $match: { 
          merchant_id: merchantId,
          createdAt: { $gte: startOfDay },
          status: 'SUCCESS' // Only count successful payouts for "Today's Payouts" amount
        } 
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total_amount: { $sum: { $toDouble: '$amount' } }
        }
      }
    ]);

    const todayTotal = todayStats.length > 0 ? todayStats[0].total_amount : 0;
    const todayCount = todayStats.length > 0 ? todayStats[0].count : 0;

    // Convert merchant to object to ensure getters (Decimal128 -> Number) are applied
    const merchantObj = merchant.toObject({ getters: true });

    const stats = {
      balance: merchantObj.balance,
      total_payouts: totalPayouts,
      total_beneficiaries: totalBeneficiaries,
      pending_payouts: pendingPayouts,
      today_payouts: {
          amount: todayTotal,
          count: todayCount
      },
      payout_breakdown: {}
    };
    
    payoutStats.forEach(stat => {
      stats.payout_breakdown[stat._id] = {
        count: stat.count,
        total_amount: stat.total_amount
      };
    });
    
    return stats;
  }

  /**
   * Get payout trends for charts (last 30 days)
   */
  async getPayoutTrends(merchantId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const trends = await Payout.aggregate([
      {
        $match: {
          merchant_id: merchantId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          total_amount: { $sum: { $toDouble: '$amount' } },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Format for frontend
    return trends.map(t => ({
      date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
      count: t.count,
      amount: t.total_amount,
      successful: t.successful,
      failed: t.failed
    }));
  }

  /**
   * Get top beneficiaries by payout count/amount
   */
  async getTopBeneficiaries(merchantId, limit = 5) {
    const topBeneficiaries = await Beneficiary.find({
      merchant_id: merchantId,
      status: 'ACTIVE'
    })
      .sort({ 'stats.total_amount': -1 })
      .limit(limit)
      .select('name stats')
      .lean();
    
    return topBeneficiaries;
  }

  /**
   * Get recent activity (transactions)
   */
  async getRecentActivity(merchantId, limit = 10) {
    const recentTransactions = await Transaction.find({ merchant_id: merchantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Explicitly convert Decimal128 to Number for frontend
    return recentTransactions.map(t => ({
      ...t,
      amount: t.amount?.$numberDecimal ? parseFloat(t.amount.$numberDecimal) : parseFloat(t.amount || 0),
      balance_before: t.balance_before?.$numberDecimal ? parseFloat(t.balance_before.$numberDecimal) : parseFloat(t.balance_before || 0),
      balance_after: t.balance_after?.$numberDecimal ? parseFloat(t.balance_after.$numberDecimal) : parseFloat(t.balance_after || 0),
    }));
  }
}

module.exports = new DashboardService();
