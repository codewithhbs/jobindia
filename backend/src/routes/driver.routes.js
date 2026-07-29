const express = require('express');
const router = express.Router();
const c = require('../controllers/driver.controller');
const { authenticate, authorize } = require('../middleware/authenticate');
const { upload, processUpload } = require('../middleware/upload.middleware');
const { ADMIN_ROLES } = require('../config/constants');

router.get('/me', authenticate, c.getMyProfile);

router.put('/me', authenticate, upload.fields([
  { name: 'aadhar_front', maxCount: 1 },
  { name: 'aadhar_back', maxCount: 1 },
  { name: 'drivingLicense_front', maxCount: 1 },
  { name: 'drivingLicense_back', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 },
]), processUpload('documents'), c.updateProfile);


router.put('/me/availability', authenticate, c.setAvailability);

// ── Admin ──
router.get('/', authenticate, authorize(ADMIN_ROLES), c.listDrivers);
router.get('/:id', authenticate, authorize(ADMIN_ROLES), c.getSingleDriver);
router.put('/:id', authenticate, authorize(ADMIN_ROLES), upload.fields([
  { name: 'aadhar_front', maxCount: 1 },
  { name: 'aadhar_back', maxCount: 1 },
  { name: 'drivingLicense_front', maxCount: 1 },
  { name: 'drivingLicense_back', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 },
]), processUpload('documents'), c.adminUpdateProfile);

module.exports = router;
