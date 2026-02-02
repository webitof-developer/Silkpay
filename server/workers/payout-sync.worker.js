require('dotenv').config();
const cron = require('node-cron');
const connectDB = require('../src/shared/config/database');
const Payout = require('../src/modules/payout/payout.model');
const payoutService = require('../src/modules/payout/payout.service');
const silkpayService = require('../src/shared/services/silkpayService');
const logger = require('../src/shared/utils/logger');

/**
 * Payout Status Sync Worker
 * Polls SilkPay API for pending payout status updates
 * 
 * Run: npm run worker:payout-sync
 */

let isRunning = false;

async function syncPayoutStatuses() {
  if (isRunning) {
    logger.debug('Payout sync already running, skipping...');
    return;
  }

  isRunning = true;

  try {
    // Find all payouts that are not in final state
    const pendingPayouts = await Payout.find({
      status: { $in: ['PENDING', 'PROCESSING'] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days only
    }).limit(100); // Process max 100 at a time

    if (pendingPayouts.length === 0) {
      logger.debug('No pending payouts to sync');
      isRunning = false;
      return;
    }

    logger.info(`Syncing ${pendingPayouts.length} pending payouts`);

    for (const payout of pendingPayouts) {
      try {
        const statusResponse = await silkpayService.queryPayout(payout.out_trade_no);

        // Service returns normalized object { status, external_id, raw }
        if (statusResponse && statusResponse.status) {
          const currentStatus = statusResponse.status;

          // Update if status changed
          if (currentStatus !== payout.status) {
            await payoutService.updatePayoutStatus(payout, currentStatus, statusResponse.raw);
            logger.info(`Payout status updated: ${payout.out_trade_no} -> ${currentStatus}`);
          }
        }

        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      } catch (error) {
        logger.error(`Failed to sync payout ${payout.out_trade_no}:`, error.message);
        // Continue with next payout
      }
    }

    logger.info('Payout sync completed');
  } catch (error) {
    logger.error('Payout sync worker error:', error);
  } finally {
    isRunning = false;
  }
}

// Connect to MongoDB
connectDB().then(() => {
  logger.info('🔄 Payout Sync Worker started');

  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    logger.info('Running payout status sync...');
    syncPayoutStatuses();
  });

  // Run immediately on startup
  syncPayoutStatuses();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down payout sync worker');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down payout sync worker');
  process.exit(0);
});
