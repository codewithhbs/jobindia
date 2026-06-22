const express = require('express');
const router = express.Router();
const c = require('../controllers/jobseeker.controller');
const { authenticate, authorize } = require('../middleware/authenticate');
const { uploadDoc, processUpload } = require('../middleware/upload.middleware');
const { ROLES, ADMIN_ROLES } = require('../config/constants');

// self
router.get('/me', authenticate, c.getMyProfile);
router.put('/me', authenticate, c.upsertProfile);
router.put('/me/resume', authenticate, uploadDoc.single('resume'), processUpload('resumes'), c.uploadResume);
router.put('/me/open-to-work', authenticate, c.toggleOpenToWork);
router.get('/me/dashboard', authenticate, c.getDashboard);

router.post('/me/education', authenticate, c.addEducation);
router.put('/me/education/:itemId', authenticate, c.updateEducation);
router.delete('/me/education/:itemId', authenticate, c.deleteEducation);

router.post('/me/experience', authenticate, c.addExperience);
router.put('/me/experience/:itemId', authenticate, c.updateExperience);
router.delete('/me/experience/:itemId', authenticate, c.deleteExperience);

// employer/admin candidate search
router.get('/', authenticate, authorize([ROLES.EMPLOYER, ...ADMIN_ROLES]), c.searchCandidates);
router.get('/:id', authenticate, authorize([ROLES.EMPLOYER, ...ADMIN_ROLES]), c.getPublicProfile);
router.put('/:userId', authenticate, authorize([ROLES.EMPLOYER, ...ADMIN_ROLES]), c.fullUpdate);



module.exports = router;
