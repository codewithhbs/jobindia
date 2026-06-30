const express = require('express');
const router = express.Router();
const c = require('../controllers/driver.controller');
const { authenticate } = require('../middleware/authenticate');
const { upload, processUpload } = require('../middleware/upload.middleware');

router.get('/me', authenticate, c.getMyProfile);

router.put('/me', authenticate, upload.fields([
  { name: 'aadhar_front', maxCount: 1 },
  { name: 'aadhar_back', maxCount: 1 },
  { name: 'drivingLicense_front', maxCount: 1 },
  { name: 'drivingLicense_back', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 },
]), processUpload('documents'), c.updateProfile);


router.put('/me/availability', authenticate, c.setAvailability);

module.exports = router;
