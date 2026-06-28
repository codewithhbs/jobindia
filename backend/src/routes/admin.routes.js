const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/authenticate');
const { upload, processUpload } = require('../middleware/upload.middleware');
const { getPublicRoleOptions, getAllRoleOptions, createRoleOption, updateRoleOption, deleteRoleOption, reorderRoleOptions } = require('../controllers/roleOption.controller');

const isAdmin = authorize(['admin', 'superadmin']);

// Public (mobile app fetches these without auth)
router.get('/settings/public', adminController.getPublicSettings);
router.get('/categories', adminController.getCategories);
router.get('/onboarding', adminController.getOnboarding);
router.get('/cms/:slug', adminController.getCMSPage);
router.get('/faqs', adminController.getFAQs);
router.get('/plans', adminController.getPlans);
router.get('/role-options', getPublicRoleOptions);


// public — used by app's LoginScreen


// admin-only — manage options
router.get('/role-options/all',authenticate, isAdmin, getAllRoleOptions);
router.post('/role-options', authenticate,isAdmin, createRoleOption);
router.put('/role-options/:id', authenticate,isAdmin, updateRoleOption);
router.delete('/role-options/:id', authenticate,isAdmin, deleteRoleOption);
router.patch('/role-options/reorder', authenticate,isAdmin, reorderRoleOptions);

// Mobile app: get dynamic form fields (auth required)
router.get('/forms/fields', authenticate, adminController.getFormFields);

// Admin-only routes
router.get('/settings', authenticate, isAdmin, adminController.getAllSettings);
router.post('/settings', authenticate, isAdmin, adminController.upsertSetting);
router.put('/settings/bulk', authenticate, isAdmin, adminController.bulkUpdateSettings);

router.get('/forms/fields/all', authenticate, isAdmin, adminController.getFormFields);
router.post('/forms/fields', authenticate, isAdmin, adminController.createFormField);
router.put('/forms/fields/:id', authenticate, isAdmin, adminController.updateFormField);
router.delete('/forms/fields/:id', authenticate, isAdmin, adminController.deleteFormField);
router.post('/forms/fields/reorder', authenticate, isAdmin, adminController.reorderFormFields);

router.post('/categories', authenticate, isAdmin, adminController.createCategory);
router.put('/categories/:id', authenticate, isAdmin, adminController.updateCategory);

router.get('/cms', adminController.listCMSPages);
router.post('/cms', authenticate, isAdmin, adminController.upsertCMSPage);

router.put('/onboarding/:id', upload.single("onboardImage"), processUpload("images"), adminController.updateOnboarding);
router.post('/onboarding', authenticate, isAdmin, upload.single("onboardImage"), processUpload("images"), adminController.createOnboarding);
router.delete('/onboarding/:id', authenticate, isAdmin, adminController.deleteOnboarding);

router.post('/faqs', authenticate, isAdmin, adminController.createFAQ);
router.put('/faqs/:id', authenticate, isAdmin, adminController.updateFAQ);
router.delete('/faqs/:id', authenticate, isAdmin, adminController.deleteFAQ);

router.post('/plans', authenticate, isAdmin, adminController.upsertPlan);

router.post('/home-sliders', upload.single("image"), processUpload("homeslider"), authenticate, isAdmin, adminController.createHomeSlider);
router.put('/home-sliders/:id', upload.single("image"), processUpload("homeslider"), authenticate, isAdmin, adminController.updateHomeSlider);
router.delete('/home-sliders/:id', authenticate, isAdmin, adminController.deleteHomeSlider);
router.get('/home-sliders', optionalAuth, adminController.getHomeSliders);
router.get('/home-sliders/:id', adminController.getHomeSlider);




module.exports = router;
