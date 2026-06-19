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
  const { vehicleTypes, vehicleNumber, vehicleModel, licenseNumber, licenseExpiry, yearsOfExperience, preferredRoutes, isAvailable } = req.body;

  const profile = await getOrInit(userId);

  if (vehicleTypes) profile.vehicleTypes = typeof vehicleTypes === 'string' ? JSON.parse(vehicleTypes) : vehicleTypes;
  if (vehicleNumber) profile.vehicleNumber = vehicleNumber;
  if (vehicleModel) profile.vehicleModel = vehicleModel;
  if (licenseNumber) profile.licenseNumber = licenseNumber;
  if (licenseExpiry) profile.licenseExpiry = licenseExpiry;
  if (yearsOfExperience !== undefined) profile.yearsOfExperience = yearsOfExperience;
  if (isAvailable !== undefined) profile.isAvailable = isAvailable;
  if (preferredRoutes) profile.preferredRoutes = typeof preferredRoutes === 'string' ? JSON.parse(preferredRoutes) : preferredRoutes;

  // Documents (aadhar / driving licence front+back)
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
      verificationStatus: 'pending',
    };
  };

  const newDocs = [
    buildDoc('aadhar_front', 'Aadhaar Front'),
    buildDoc('aadhar_back', 'Aadhaar Back'),
    buildDoc('drivingLicense_front', 'Driving Licence Front'),
    buildDoc('drivingLicense_back', 'Driving Licence Back'),
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
