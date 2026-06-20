const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { ok, paginated } = require('../utils/ApiResponse');
const { ROLES } = require('../config/constants');
const { User, JobSeekerProfile, EmployerProfile, DriverProfile } = require('../models');

const loadProfile = async (user) => {
  if (user.role === ROLES.DRIVER) return DriverProfile.findOne({ userId: user._id });
  if (user.role === ROLES.EMPLOYER) return EmployerProfile.findOne({ userId: user._id });
  if (user.role === ROLES.JOBSEEKER) return JobSeekerProfile.findOne({ userId: user._id });
  return null;
};

// GET /api/v1/users/:id
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-__v');
  if (!user) return next(new AppError('User not found', 404));
  ok(res, user);
});

// GET /api/v1/users/me/profile — self, with the role profile attached
exports.getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.userId).select('-__v');
  if (!user) return next(new AppError('User not found', 404));
  const profile = await loadProfile(user);
  ok(res, { user, profile });
});


// GET /api/v1/users/profile/:id — self, with the role profile attached
exports.getUniversalProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-__v -deviceInfo -isKYCVerified -isEmailVerified -isPhoneVerified -fcmToken');
  if (!user) return next(new AppError('User not found', 404));
  const profile = await loadProfile(user);
  ok(res, { user, profile });
});

// PUT /api/v1/users/me/profile — basic identity + avatar + device + location
exports.updateProfile = catchAsync(async (req, res, next) => {
  const uploaded = req.uploadedFiles
  const { name, email, gender, dateOfBirth, location, fcmToken, expoPushToken, apnsToken, deviceInfo } = req.body;
  const update = {};

  if (name) update.name = name;
  if (email) update.email = email;
  if (gender) update.gender = gender;
  if (dateOfBirth) update.dateOfBirth = dateOfBirth;
  if (uploaded.avatar) update.avatar = uploaded.avatar;
  if (uploaded.avtar) update.avatar = uploaded.avtar; // legacy field name tolerance

  if (location) {
    const loc = typeof location === 'string' ? JSON.parse(location) : location;
    if (!loc) return next(new AppError('Invalid location format', 400));
    update['location.city'] = loc.city || '';
    update['location.state'] = loc.state || '';
    update['location.pincode'] = loc.pincode || '';
    update['location.country'] = loc.country || 'India';
    update['location.address'] = loc.address || '';
    if (loc.lat && loc.lng) {
      update['location.type'] = 'Point';
      update['location.coordinates'] = [parseFloat(loc.lng), parseFloat(loc.lat)];
    }
  }

  if (fcmToken) update.fcmToken = fcmToken;
  if (expoPushToken) update.expoPushToken = expoPushToken;
  if (apnsToken) update.apnsToken = apnsToken;

  if (deviceInfo) {
    const d = typeof deviceInfo === 'string' ? JSON.parse(deviceInfo) : deviceInfo;
    if (d) {
      update['deviceInfo.platform'] = d.platform || null;
      update['deviceInfo.type'] = d.type || 'unknown';
      update['deviceInfo.brand'] = d.brand || null;
      update['deviceInfo.model'] = d.model || null;
      update['deviceInfo.os'] = d.os || null;
      update['deviceInfo.osVersion'] = d.osVer || d.osVersion || null;
      update['deviceInfo.isDevice'] = d.isDevice ?? true;
    }
  }

  update.lastSeen = new Date();

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { $set: update },
    { new: true, runValidators: true }
  ).select('-__v');
  if (!user) return next(new AppError('User not found', 404));

  const isComplete = !!(user.name && user.location?.city);
  if (user.isProfileComplete !== isComplete) {
    user.isProfileComplete = isComplete;
    await user.save();
  }

  ok(res, user, 'Profile updated');
});

// PUT /api/v1/users/me/location
exports.updateLocation = catchAsync(async (req, res) => {
  const { latitude, longitude, city, state, country, pincode, address } = req.body;
  await User.findByIdAndUpdate(req.user.userId, {
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
      city, state, country, pincode, address,
    },
  });
  ok(res, null, 'Location updated');
});

// PUT /api/v1/users/me/push-token — quick token-only update (app foreground)
exports.updatePushToken = catchAsync(async (req, res) => {
  const { fcmToken, expoPushToken, apnsToken } = req.body;
  const update = {};
  if (fcmToken) update.fcmToken = fcmToken;
  if (expoPushToken) update.expoPushToken = expoPushToken;
  if (apnsToken) update.apnsToken = apnsToken;
  await User.findByIdAndUpdate(req.user.userId, update);
  ok(res, null, 'Push token updated');
});

// DELETE /api/v1/users/me — soft delete own account
exports.deactivateOwnAccount = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.userId, { isActive: false });
  ok(res, null, 'Account deactivated');
});

// GET /api/v1/users/nearby/search?lat=&lng=&radius=&role=
exports.getNearbyUsers = catchAsync(async (req, res) => {
  const { lat, lng, radius = 10000, role } = req.query;
  const filter = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius, 10),
      },
    },
  };
  if (role) filter.role = role;
  const users = await User.find(filter).limit(50).select('name phone role location isKYCVerified');
  ok(res, users);
});

// ───────────────────────── ADMIN ─────────────────────────

// GET /api/v1/users
exports.listUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, role, search, kycStatus, isActive } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (kycStatus) filter.kycStatus = kycStatus;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-__v').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit, 10)),
    User.countDocuments(filter),
  ]);
  paginated(res, users, { total, page, limit });
});

// PUT /api/v1/users/:id/status
exports.updateUserStatus = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) return next(new AppError('User not found', 404));
  ok(res, user, `User ${isActive ? 'activated' : 'deactivated'}`);
});

// GET /api/v1/users/stats/overview
exports.getStats = catchAsync(async (req, res) => {
  const [total, drivers, employers, jobseekers, admins, activeToday] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.DRIVER }),
    User.countDocuments({ role: ROLES.EMPLOYER }),
    User.countDocuments({ role: ROLES.JOBSEEKER }),
    User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN] } }),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
  ]);
  ok(res, { total, drivers, employers, jobseekers, admins, activeToday });
});
