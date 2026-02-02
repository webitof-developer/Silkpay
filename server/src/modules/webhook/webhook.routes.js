const express = require('express');
const router = express.Router();
const webhookController = require('./webhook.controller');

// SilkPay Callback
router.post('/silkpay', webhookController.handleSilkPayCallback);

module.exports = router;
