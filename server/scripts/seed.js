require('dotenv').config();
const connectDB = require('../src/shared/config/database');
const Merchant = require('../src/modules/merchant/merchant.model');
const logger = require('../src/shared/utils/logger');

/**
 * Seed database with sample merchant
 * Run: node scripts/seed.js
 */
async function seedDatabase() {
  try {
    await connectDB();

    // Clear existing merchants (development only!)
    if (process.env.NODE_ENV === 'development') {
      await Merchant.deleteMany({});
      logger.info('Cleared existing merchants');
    }

    // Create sample merchant
    const merchantNo = await Merchant.generateMerchantNo();
    
    const merchant = await Merchant.create({
      merchant_no: merchantNo,
      name: 'Test Merchant',
      email: 'test@silkpay.local',
      mobile: '+919876543210',
      password: 'password123', // Will be hashed automatically
      status: 'ACTIVE',
      balance: {
        available: 10000.00,
        pending: 0,
        total: 10000.00
      }
    });

    logger.info('✅ Sample merchant created:');
    logger.info(`   Email: ${merchant.email}`);
    logger.info(`   Password: password123`);
    logger.info(`   Merchant No: ${merchant.merchant_no}`);
    logger.info(`   Balance: ₹${merchant.balance.available}`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();
