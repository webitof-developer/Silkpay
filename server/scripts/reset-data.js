const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env from ../.env (relative to server/scripts)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Models (Adjusted paths for server/scripts execution)
const Payout = require('../src/modules/payout/payout.model');
const Transaction = require('../src/modules/transaction/transaction.model');
const Beneficiary = require('../src/modules/beneficiary/beneficiary.model');
const Merchant = require('../src/modules/merchant/merchant.model');

const cleanData = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Deleting all Transactions...');
        const txResult = await Transaction.deleteMany({});
        console.log(`   Deleted ${txResult.deletedCount} transactions.`);

        console.log('🗑️  Deleting all Payouts...');
        const poResult = await Payout.deleteMany({});
        console.log(`   Deleted ${poResult.deletedCount} payouts.`);

        console.log('🗑️  Deleting all Beneficiaries...');
        const benResult = await Beneficiary.deleteMany({});
        console.log(`   Deleted ${benResult.deletedCount} beneficiaries.`);
        
        console.log('🔄 Resetting Merchant Balances...');
        const merchants = await Merchant.find({});
        for (const m of merchants) {
             m.balance.pending = 0;
             m.balance.total = m.balance.available; 
             await m.save();
             console.log(`   Reset balance for ${m.merchant_no}`);
        }

        console.log('✨ Data cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning data:', error);
        process.exit(1);
    }
};

cleanData();
