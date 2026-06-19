const express = require('express');
const router = express.Router();
const c = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/authenticate');

router.post('/create-order', authenticate, c.createOrder);
router.post('/verify', authenticate, c.verifyPayment);
router.get('/me', authenticate, c.myPayments);

module.exports = router;
