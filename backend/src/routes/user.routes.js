const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/authenticate');
const { upload, processUpload } = require('../middleware/upload.middleware');
const { ADMIN_ROLES } = require('../config/constants');

// self
router.get('/me/profile', authenticate, userController.getProfile);
router.put('/me/profile', authenticate, upload.single('avtar'), processUpload('profile_images'), userController.updateProfile);
router.put('/me/location', authenticate, userController.updateLocation);
router.put('/me/push-token', authenticate, userController.updatePushToken);
router.delete('/me', authenticate, userController.deactivateOwnAccount);

// discovery
router.get('/nearby/search', authenticate, userController.getNearbyUsers);

// admin
router.get('/', authenticate, authorize(ADMIN_ROLES), userController.listUsers);
router.get('/stats/overview', authenticate, authorize(ADMIN_ROLES), userController.getStats);
router.put('/:id/status', authenticate, authorize(ADMIN_ROLES), userController.updateUserStatus);
router.get('/:id', authenticate, userController.getUser);

module.exports = router;
