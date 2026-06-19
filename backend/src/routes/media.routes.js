const express = require('express');
const router = express.Router();
const c = require('../controllers/media.controller');
const { authenticate } = require('../middleware/authenticate');

router.post('/upload/document', authenticate, c.uploadDocument);
router.post('/upload/image', authenticate, c.uploadImage);
router.post('/upload/avatar', authenticate, c.uploadAvatar);
router.post('/upload/multiple', authenticate, c.uploadMultiple);
router.delete('/delete', authenticate, c.deleteFile);

module.exports = router;
