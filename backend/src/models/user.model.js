const mongoose = require('mongoose');
const { ALL_ROLES, ROLES, KYC_STATUS } = require('../config/constants');

/**
 * Base User — identity + auth + device. Role-specific data lives in the
 * dedicated profile models (JobSeekerProfile / EmployerProfile / DriverProfile).
 * The old free-form `dynamicFields` Map has been removed in favour of typed schemas.
 */
const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true, lowercase: true, trim: true },

    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.JOBSEEKER,
      index: true,
    },

    name: { type: String, trim: true },
    avatar: String,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: Date,

    isActive: { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    isKYCVerified: { type: Boolean, default: false },
    kycStatus: {
      type: String,
      enum: Object.values(KYC_STATUS),
      default: KYC_STATUS.NOT_SUBMITTED,
    },

    // GeoJSON Point — coordinates = [lng, lat]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String,
    },

    // Push tokens
    fcmToken: String,
    apnsToken: String,
    expoPushToken: String,

    deviceInfo: {
      platform: { type: String, enum: ['android', 'ios', 'web'] },
      type: { type: String, enum: ['phone', 'tablet', 'desktop', 'unknown'] },
      brand: String,
      model: String,
      os: String,
      osVersion: String,
      isDevice: Boolean,
    },

    lastSeen: Date,
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });
userSchema.index({ phone: 1, role: 1 });
userSchema.index({ 'deviceInfo.platform': 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
