const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');

// ── validators ──
const phone = Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required().messages({
  'string.pattern.base': 'Invalid phone number format',
});
const purpose = Joi.string().valid('login', 'register', 'reset', 'verify').default('login');

const sendOTPSchema = Joi.object({ phone, purpose });
const verifyOTPSchema = Joi.object({
  phone,
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  purpose,
  role: Joi.string().valid('jobseeker', 'employer', 'driver', 'admin', 'superadmin').default('jobseeker'),
  userAgent: Joi.string().optional(),
});
const refreshTokenSchema = Joi.object({ refreshToken: Joi.string().uuid().required() });

// ── rate limiters ──
const otpLimiter = rateLimit({
  windowMs: parseInt(process.env.OTP_RATE_LIMIT_WINDOW || 15, 10) * 60 * 1000,
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX || 5, 10),
  message: { success: false, message: 'Too many OTP requests, please try again later' },
});
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many verification attempts' },
});

// admin
router.post('/send-otp-admin', otpLimiter, authController.adminOtp);
router.post('/verify-otp-admin', verifyLimiter, authController.verifyAdminOtp);

// public
router.post('/send-otp', otpLimiter, validate(sendOTPSchema), authController.sendOTP);
router.post('/verify-otp', verifyLimiter, validate(verifyOTPSchema), authController.verifyOTP);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// protected
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

// util
router.post('/validate-token', authController.validateToken);

module.exports = router;
