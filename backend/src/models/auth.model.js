const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  attempts: { type: Number, default: 0, max: 5 },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  purpose: {
    type: String,
    enum: ['login', 'register', 'reset', 'verify'],
    default: 'login',
  },
  createdAt: { type: Date, default: Date.now },
});

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  token: { type: String, required: true, unique: true },
  userAgent: String,
  ipAddress: String,
  isRevoked: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  createdAt: { type: Date, default: Date.now },
});

const OTP = mongoose.model('OTP', otpSchema);
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = { OTP, RefreshToken };
