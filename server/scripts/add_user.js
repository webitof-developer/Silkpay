require('dotenv').config();
const connectDB = require('../src/shared/config/database');
const Merchant = require('../src/modules/merchant/merchant.model');
const User = require('../src/modules/user/user.model');
const logger = require('../src/shared/utils/logger');

/**
 * Add an Admin User to the database
 * Run: node scripts/add_user.js
 */
async function addAdminUser() {
  try {
    await connectDB();

    console.log('Connecting to database...');

    // 1. Ensure a Merchant exists
    let merchant = await Merchant.findOne({ email: 'admin@webitof.com' });
    
    if (!merchant) {
      console.log('Creating default merchant...');
      const merchantNo = await Merchant.generateMerchantNo();
      merchant = await Merchant.create({
        merchant_no: merchantNo,
        name: 'Webitof SilkPay',
        email: 'admin@webitof.com',
        mobile: '+910000000000',
        password: 'admin123',
        status: 'ACTIVE',
        balance: {
          available: 0,
          pending: 0,
          total: 0
        }
      });
      console.log(`✅ Merchant created: ${merchant.merchant_no}`);
    } else {
      console.log(`ℹ️ Merchant already exists: ${merchant.merchant_no}`);
    }

    // 2. Ensure the Admin User exists
    let user = await User.findOne({ email: 'admin@webitof.com' });

    if (!user) {
      console.log('Creating admin user...');
      user = await User.create({
        merchant_id: merchant._id,
        name: 'Webitof Admin',
        email: 'admin@webitof.com',
        password: 'admin123',
        role: 'ADMIN',
        status: 'ACTIVE'
      });
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('ℹ️ Admin user already exists.');
      // Optionally update password if requested, but let's keep it simple
    }

    console.log('\n-----------------------------------');
    console.log('Credentials for Login:');
    console.log(`Email:    admin@webitof.com`);
    console.log(`Password: admin123`);
    console.log('-----------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding user:', error);
    process.exit(1);
  }
}

addAdminUser();
