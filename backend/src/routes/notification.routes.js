const express = require('express');
const router = express.Router();
const c = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/authenticate');
const { ADMIN_ROLES } = require('../config/constants');

router.get('/', authenticate, c.getMyNotifications);
router.put('/read-all', authenticate, c.markAllRead);
router.put('/:id/read', authenticate, c.markRead);

router.post('/send', authenticate, authorize(ADMIN_ROLES), c.send);
router.post('/broadcast', authenticate, authorize(ADMIN_ROLES), c.broadcast);
router.post('/send-bulk', authenticate, authorize(ADMIN_ROLES), c.sendToSelected);
module.exports = router;
