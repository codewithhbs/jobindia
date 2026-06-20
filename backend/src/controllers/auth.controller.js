const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { ok } = require('../utils/ApiResponse');
const { ROLES, ADMIN_ROLES } = require('../config/constants');
const { User, JobSeekerProfile, EmployerProfile, DriverProfile, RefreshToken } = require('../models');
const otpService = require('../services/otp.service');
const tokenService = require('../services/token.service');
const { enqueueSingle } = require('../queue');

// Creates the user + the matching role profile if it does not exist yet.
const findOrCreateUser = async (phone, role = ROLES.JOBSEEKER) => {
  let user = await User.findOne({ phone });
  if (user) return user;

  user = await User.create({ phone, role, isPhoneVerified: true });
  if (role === ROLES.DRIVER) await DriverProfile.create({ userId: user._id });
  else if (role === ROLES.JOBSEEKER) await JobSeekerProfile.create({ userId: user._id });
  else if (role === ROLES.EMPLOYER) await EmployerProfile.create({ userId: user._id });

  // Welcome notification for brand-new registrations (queued — non-blocking).
  enqueueSingle({
    userId: user._id,
    title: 'Welcome to Job India 👋',
    body: 'Your account is ready. Complete your profile to get started.',
    category: 'system',
    data: { type: 'welcome', role },
  });

  return user;
};

const redirectFor = (role) => {
  if (role === ROLES.DRIVER) return 'EditProfile';
  if (role === ROLES.JOBSEEKER) return 'complete_profile_seeker';
  if (role === ROLES.EMPLOYER) return 'complete_profile_employer';
  return null;
};

// ───────────────────────── USER OTP ─────────────────────────

// POST /api/v1/auth/send-otp
exports.sendOTP = catchAsync(async (req, res) => {
  const { phone, purpose = 'login' } = req.body;
  const { isTest, code, expiresIn } = await otpService.issueOTP(phone, purpose);
  ok(res, {
    phone,
    expiresIn,
    ...(process.env.NODE_ENV === 'development' && { otp: code }),
    ...(isTest && { test: true }),
  }, 'OTP sent successfully');
});

// POST /api/v1/auth/verify-otp
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { phone, otp, purpose = 'login', userAgent, role = ROLES.JOBSEEKER } = req.body;

  const result = await otpService.verifyOTP(phone, otp, purpose);
  if (!result.ok) return next(new AppError(result.reason, result.status));

  const user = await findOrCreateUser(phone, role);
  const tokens = await tokenService.issueAuthTokens(user, { userAgent, ipAddress: req.ip });

  ok(res, {
    ...tokens,
    redirect: redirectFor(user.role),
    user: {
      _id: user._id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      isProfileComplete: user.isProfileComplete,
      isKYCVerified: user.isKYCVerified,
    },
  }, purpose === 'register' ? 'Registration successful' : 'Login successful');
});

// ───────────────────────── ADMIN OTP ─────────────────────────

// POST /api/v1/auth/send-otp-admin
exports.adminOtp = catchAsync(async (req, res, next) => {
  const { phone, purpose = 'login' } = req.body;
  const admin = await User.findOne({ phone, role: { $in: ADMIN_ROLES } });
  if (!admin) return next(new AppError('Admin account not found', 404));

  await otpService.issueOTP(phone, purpose);
  ok(res, null, 'OTP sent successfully');
});

// POST /api/v1/auth/verify-otp-admin
exports.verifyAdminOtp = catchAsync(async (req, res, next) => {
  const { phone, otp, userAgent, purpose = 'login' } = req.body;
  if (!phone || !otp) return next(new AppError('Phone and OTP are required', 400));

  const result = await otpService.verifyOTP(phone, otp, purpose);
  if (!result.ok) return next(new AppError(result.reason, result.status));

  const admin = await User.findOne({ phone, role: { $in: ADMIN_ROLES } });
  if (!admin) return next(new AppError('Admin not found', 404));

  const tokens = await tokenService.issueAuthTokens(admin, { userAgent, ipAddress: req.ip });
  ok(res, {
    ...tokens,
    user: {
      _id: admin._id,
      phone: admin.phone,
      role: admin.role,
      name: admin.name,
      isProfileComplete: admin.isProfileComplete,
      isKYCVerified: admin.isKYCVerified,
    },
  }, 'Login successful');
});

// ───────────────────────── TOKENS / SESSION ─────────────────────────

// POST /api/v1/auth/refresh-token
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  const record = await RefreshToken.findOne({
    token: refreshToken,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
  if (!record) return next(new AppError('Invalid or expired refresh token', 401));

  const user = await User.findById(record.userId);
  if (!user) return next(new AppError('User not found', 404));

  const accessToken = tokenService.signAccessToken(user);
  await tokenService.cacheSession(user);
  ok(res, { accessToken, expiresIn: tokenService.ACCESS_TTL_SECONDS });
});

// POST /api/v1/auth/logout
exports.logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await RefreshToken.updateOne({ token: refreshToken }, { isRevoked: true });
  if (req.user?.userId) await tokenService.clearSession(req.user.userId);
  ok(res, null, 'Logged out successfully');
});

// POST /api/v1/auth/logout-all
exports.logoutAll = catchAsync(async (req, res) => {
  await RefreshToken.updateMany({ userId: req.user.userId }, { isRevoked: true });
  await tokenService.clearSession(req.user.userId);
  ok(res, null, 'Logged out from all devices');
});

// POST /api/v1/auth/validate-token  (internal/util)
exports.validateToken = catchAsync(async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
    ok(res, decoded);
  } catch (err) {
    return next(new AppError('Invalid token', 401));
  }
});
