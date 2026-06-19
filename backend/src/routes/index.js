const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(mongoStatus === 'connected' ? 200 : 503).json({
    service: process.env.SERVICE_NAME || 'job-marketplace-backend',
    status: mongoStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    dependencies: { mongodb: mongoStatus },
  });
});

// Versioned API
const v1 = express.Router();
v1.use('/auth', require('./auth.routes'));
v1.use('/users', require('./user.routes'));
v1.use('/jobseekers', require('./jobseeker.routes'));
v1.use('/employers', require('./employer.routes'));
v1.use('/drivers', require('./driver.routes'));
v1.use('/jobs', require('./job.routes'));
v1.use('/kyc', require('./kyc.routes'));
v1.use('/notifications', require('./notification.routes'));
v1.use('/support', require('./support.routes'));
v1.use('/payments', require('./payment.routes'));
v1.use('/media', require('./media.routes'));
v1.use('/admin', require('./admin.routes'));

router.use('/api/v1', v1);

module.exports = router;
