const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/authenticate');

// Public
router.get('/',optionalAuth, jobController.getJobs);
router.get('/full/:id',optionalAuth, jobController.jobDetailsForAdmin);
router.get('/pending-vericiation', jobController.getPeningJobVerication);



router.get('/for-home',optionalAuth, jobController.getRecommendedJobs);

router.get('/nearby', jobController.getNearbyJobs);
router.get('/:id',optionalAuth, jobController.getJob);

// Job Seeker
router.get('/me/applications', authenticate, jobController.getMyApplications);
router.get('/me/saved', authenticate, jobController.getSavedJobs);
router.post('/:id/apply', authenticate, jobController.applyJob);
router.post('/:id/save', authenticate, jobController.saveJob);

// Employer
router.post('/', authenticate, authorize(['employer', 'admin', 'superadmin']), jobController.createJob);
router.put('/:id', authenticate, jobController.updateJob);
router.delete('/:id', authenticate, jobController.deleteJob);
router.get('/me/jobs', authenticate, authorize(['employer', 'admin', 'superadmin']), jobController.getMyJobs);
router.get('/:id/applications', authenticate, jobController.getJobApplications);

// Application status update
router.put('/applications/:id/status', authenticate, jobController.updateApplicationStatus);

module.exports = router;
