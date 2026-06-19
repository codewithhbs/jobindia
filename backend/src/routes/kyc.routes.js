const express = require('express');
const router = express.Router();
const c = require('../controllers/kyc.controller');
const { authenticate, authorize } = require('../middleware/authenticate');
const { ADMIN_ROLES } = require('../config/constants');

router.post('/submit', authenticate, c.submitDocument);
router.get('/status', authenticate, c.getKYCStatus);

router.get('/pending', authenticate, authorize(ADMIN_ROLES), c.getPendingKYC);
router.get('/stats', authenticate, authorize(ADMIN_ROLES), c.getKYCStats);
router.put('/:userId/review', authenticate, authorize(ADMIN_ROLES), c.reviewKYC);

module.exports = router;
