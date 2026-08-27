const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { ok } = require('../utils/ApiResponse');
const { KYC_STATUS } = require('../config/constants');
const { DriverProfile, User } = require('../models');

const getOrInit = async (userId) => {
  let profile = await DriverProfile.findOne({ userId });
  if (!profile) profile = await DriverProfile.create({ userId });
  return profile;
};

// GET /api/v1/drivers/me
exports.getMyProfile = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);
  ok(res, profile);
});

// PUT /api/v1/drivers/me — basic fields + documents (preserves original behaviour)
exports.updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const profile = await getOrInit(userId);

  const {
    aadharNumber,
    panNumber,
    licenseNumber,
    yearsOfExperience,
    currentSalary,
    expectedSalary,
    isBikeAvailable,
    vehicleCategories,
    dutyType,
    preferredCategories,
  } = req.body;

  const parseJsonArray = (val) => {
    if (!val) return [];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  if (aadharNumber !== undefined) profile.aadharNumber = aadharNumber;
  if (panNumber !== undefined) profile.panNumber = panNumber;
  if (licenseNumber !== undefined) profile.licenseNumber = licenseNumber;
  if (yearsOfExperience !== undefined) profile.yearsOfExperience = Number(yearsOfExperience) || 0;
  if (currentSalary !== undefined) profile.currentSalary = currentSalary;
  if (expectedSalary !== undefined) profile.expectedSalary = expectedSalary;
if (isBikeAvailable !== undefined) profile.isBikeAvailable = isBikeAvailable === 'true' || isBikeAvailable === true;
  if (dutyType !== undefined) profile.dutyType = dutyType;
  if (vehicleCategories !== undefined) profile.vehicleCategories = parseJsonArray(vehicleCategories);
  if (preferredCategories !== undefined) profile.preferredCategories = parseJsonArray(preferredCategories);

  // Documents (aadhar / driving licence front+back / pan)
  const uploaded = req.uploadedFiles || {};
  const buildDoc = (fieldId, fieldName) => {
    const file = uploaded[fieldId]?.[0];
    if (!file) return null;
    return {
      fieldId,
      fieldName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      uploadedAt: new Date(),
      verificationStatus: 'approved',
    };
  };

  const newDocs = [
    buildDoc('aadhar_front', 'Aadhaar Front'),
    buildDoc('aadhar_back', 'Aadhaar Back'),
    buildDoc('drivingLicense_front', 'Driving Licence Front'),
    buildDoc('drivingLicense_back', 'Driving Licence Back'),
    buildDoc('pan_card', 'Pan Card'),
  ].filter(Boolean);

  if (newDocs.length > 0) {
    const existing = profile.documents || [];
    const filtered = existing.filter((doc) => !newDocs.some((nd) => nd.fieldId === doc.fieldId));
    profile.documents = [...filtered, ...newDocs];
  }

  await profile.save();
  await User.findByIdAndUpdate(userId, { kycStatus: KYC_STATUS.PENDING, isProfileComplete: true });

  ok(res, profile, 'Driver profile updated successfully');
});
// PUT /api/v1/drivers/me/availability
exports.setAvailability = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);
  profile.isAvailable = req.body.isAvailable ?? !profile.isAvailable;
  await profile.save();
  ok(res, { isAvailable: profile.isAvailable }, 'Availability updated');
});

// ───────────────────────── ADMIN ─────────────────────────

// GET /api/v1/drivers — admin list (paginated, search by user name/phone)
exports.listDrivers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search, isAvailable } = req.query;

  const filter = {};
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

  let userFilter = { role: 'driver' };
  if (search) {
    userFilter.$or = [
      { name: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
  }

  const matchingUsers = search ? await User.find(userFilter).select('_id') : null;
  if (matchingUsers) filter.userId = { $in: matchingUsers.map((u) => u._id) };

  const skip = (Number(page) - 1) * Number(limit);
  const [drivers, total] = await Promise.all([
    DriverProfile.find(filter)
      .populate('userId', 'name phone email isActive kycStatus avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    DriverProfile.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Success',
    data: drivers,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/v1/drivers/:id — admin single (id = User._id)
exports.getSingleDriver = catchAsync(async (req, res, next) => {
  const profile = await DriverProfile.findOne({ userId: req.params.id }).populate(
    'userId',
    'name phone email isActive kycStatus avatar location createdAt'
  );
  if (!profile) return next(new AppError('Driver not found', 404));
  ok(res, profile);
});

// PUT /api/v1/drivers/:id — admin update (any field on the schema + document review)
exports.adminUpdateProfile = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const profile = await getOrInit(userId);

  const {
    aadharNumber,
    panNumber,
    licenseNumber,
    licenseExpiry,
    yearsOfExperience,
    currentSalary,
    expectedSalary,
    isBikeAvailable,
    vehicleCategories,
    dutyType,
    preferredCategories,
    documentReviews, // [{ documentId, status, rejectionReason }]
  } = req.body;

  const parseJsonArray = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return undefined;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch (e) {
      return undefined;
    }
  };

  if (aadharNumber !== undefined) profile.aadharNumber = aadharNumber;
  if (panNumber !== undefined) profile.panNumber = panNumber;
  if (licenseNumber !== undefined) profile.licenseNumber = licenseNumber;
  if (licenseExpiry !== undefined) profile.licenseExpiry = licenseExpiry || undefined;
  if (yearsOfExperience !== undefined) profile.yearsOfExperience = Number(yearsOfExperience) || 0;
  if (currentSalary !== undefined) profile.currentSalary = currentSalary;
  if (expectedSalary !== undefined) profile.expectedSalary = expectedSalary;
  if (isBikeAvailable !== undefined) profile.isBikeAvailable = isBikeAvailable === 'true' || isBikeAvailable === true;
  if (dutyType !== undefined) profile.dutyType = dutyType;

  const vc = parseJsonArray(vehicleCategories);
  if (vc !== undefined) profile.vehicleCategories = vc;
  const pc = parseJsonArray(preferredCategories);
  if (pc !== undefined) profile.preferredCategories = pc;

  // New document uploads (same field names as /me)
  const uploaded = req.uploadedFiles || {};
  const buildDoc = (fieldId, fieldName) => {
    const file = uploaded[fieldId]?.[0];
    if (!file) return null;
    return {
      fieldId,
      fieldName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      uploadedAt: new Date(),
      verificationStatus: 'approved',
    };
  };
  const newDocs = [
    buildDoc('aadhar_front', 'Aadhaar Front'),
    buildDoc('aadhar_back', 'Aadhaar Back'),
    buildDoc('drivingLicense_front', 'Driving Licence Front'),
    buildDoc('drivingLicense_back', 'Driving Licence Back'),
    buildDoc('pan_card', 'Pan Card'),
  ].filter(Boolean);
  if (newDocs.length > 0) {
    const existing = profile.documents || [];
    const filtered = existing.filter((doc) => !newDocs.some((nd) => nd.fieldId === doc.fieldId));
    profile.documents = [...filtered, ...newDocs];
  }

  // Admin document review (approve/reject existing documents by their _id)
  const reviews = parseJsonArray(documentReviews);
  if (reviews?.length) {
    for (const r of reviews) {
      const doc = profile.documents.id(r.documentId);
      if (doc) {
        doc.verificationStatus = r.status;
      }
    }
  }

  await profile.save();

  ok(res, profile, 'Driver profile updated successfully');
});
