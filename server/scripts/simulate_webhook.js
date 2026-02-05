
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Adjust path for scripts folder
const connectDB = require('../src/shared/config/database');
const Payout = require('../src/modules/payout/payout.model');
const payoutService = require('../src/modules/payout/payout.service');

async function run() {
  await connectDB();
  
  // 1. Create Dummy Payout
  const dummyMOrderId = `TEST_WEBHOOK_${Date.now()}`;
  const dummyPayout = new Payout({
      merchant_id: new mongoose.Types.ObjectId(), // Fake ID
      merchant_no: 'M_TEST',
      beneficiary_id: new mongoose.Types.ObjectId(),
      silkpay_order_no: `SP_${Date.now()}`,
      out_trade_no: dummyMOrderId,
      amount: 100.00,
      status: 'PROCESSING',
      beneficiary_details: { 
          name: 'Test', 
          account_number: '123456', 
          ifsc_code: 'TEST0001' 
      }
  });
  await dummyPayout.save();
  console.log(`[SETUP] Created Dummy Payout: ${dummyMOrderId} (Status: ${dummyPayout.status})`);

  try {
      // 2. Simulate Webhook Call
      console.log('[ACTION] Simulating Webhook with SUCCESS...');
      
      const updated = await payoutService.handleWebhookUpdate(
          dummyMOrderId,
          'SUCCESS',
          { message: 'Simulated Webhook' }
      );

      // 3. Verify
      console.log('--- Verification Results ---');
      console.log(`Status: ${updated.status} (Expected: SUCCESS)`);
      console.log(`Webhook Received: ${updated.webhook_received} (Expected: true)`);
      console.log(`Completed At: ${updated.completed_at ? 'SET' : 'NULL'} (Expected: SET)`);
      console.log(`Finalized By: ${updated.finalized_by} (Expected: WEBHOOK)`);
      
      if (updated.status === 'SUCCESS' && updated.finalized_by === 'WEBHOOK') {
          console.log('✅ TEST PASSED: Payout finalized correctly by WEBHOOK.');
      } else {
          console.error('❌ TEST FAILED: Payout state invalid.');
          process.exit(1);
      }

  } catch (e) {
      console.error('TEST ERROR:', e);
  } finally {
      // Cleanup
      await Payout.deleteOne({ _id: dummyPayout._id });
      console.log('[CLEANUP] Deleted dummy payout');
      process.exit(0);
  }
}

run();
