const express = require('express');
const router = express.Router();
const c = require('../controllers/support.controller');
const { authenticate, authorize } = require('../middleware/authenticate');
const { ADMIN_ROLES } = require('../config/constants');

// user
router.post('/', authenticate, c.createTicket);
router.get('/my', authenticate, c.getMyTickets);
router.post('/:id/reply', authenticate, c.replyToTicket);
router.patch('/:id/close', authenticate, c.closeTicket);

// admin
router.get('/', authenticate, authorize(ADMIN_ROLES), c.getAllTickets);
router.post('/:id/admin-reply', authenticate, authorize(ADMIN_ROLES), c.adminReply);
router.patch('/:id/status', authenticate, authorize(ADMIN_ROLES), c.updateTicketStatus);

// keep param route last so it doesn't swallow /my
router.get('/:id', authenticate, c.getTicketById);

module.exports = router;
