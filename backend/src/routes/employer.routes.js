const express = require('express');
const router = express.Router();
const c = require('../controllers/employer.controller');
const { authenticate, authorize } = require('../middleware/authenticate');
const { upload, processUpload } = require('../middleware/upload.middleware');
const { ADMIN_ROLES } = require('../config/constants');

// self
router.get('/me', authenticate, c.getMyProfile);
router.put('/me', authenticate, upload.single('companyLogo'), processUpload('images'), c.upsertProfile);
router.post('/me/documents', authenticate, upload.fields([
  { name: 'gst', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'cin', maxCount: 1 },
]), processUpload('documents'), c.uploadDocuments);
router.get('/me/dashboard', authenticate, c.getDashboard);

// admin
router.get('/', authenticate, authorize(ADMIN_ROLES), c.listEmployers);
router.put('/:id/verify', authenticate, authorize(ADMIN_ROLES), c.verifyEmployer);
router.get('/:id', authenticate, authorize(ADMIN_ROLES), c.getSingleEmployer);
router.put('/:id', authenticate, authorize(ADMIN_ROLES), upload.single('companyLogo'), processUpload('images'), c.upsertProfileAdmin);

module.exports = router;
