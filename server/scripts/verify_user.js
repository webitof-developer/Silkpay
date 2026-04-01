require('dotenv').config();
const connectDB = require('../src/shared/config/database');
const Merchant = require('../src/modules/merchant/merchant.model');
const User = require('../src/modules/user/user.model');

async function verifyUser() {
  try {
    await connectDB();

    const user = await User.findOne({ email: 'admin@webitof.com' });
    const merchant = await Merchant.findOne({ email: 'admin@webitof.com' });

    if (user && merchant) {
      console.log('✅ Verification successful!');
      console.log(`User ID: ${user._id}`);
      console.log(`Merchant ID: ${merchant._id}`);
      console.log(`Merchant No: ${merchant.merchant_no}`);
      console.log(`User Role: ${user.role}`);
    } else {
      console.log('❌ Verification failed: User or Merchant not found.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying user:', error);
    process.exit(1);
  }
}

verifyUser();
