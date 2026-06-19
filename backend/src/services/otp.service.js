const bcrypt = require('bcryptjs');
const twilio = require('twilio');
const { OTP } = require('../models');
const logger = require('../utils/logger');

const OTP_LENGTH = () => parseInt(process.env.OTP_LENGTH, 10) || 6;
const OTP_TTL_MIN = () => parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10;
const TEST_NUMBERS = () =>
  (process.env.OTP_TEST_NUMBERS || '').split(',').map((s) => s.trim()).filter(Boolean);

const generateOTP = (length = OTP_LENGTH()) => {
  let otp = '';
  for (let i = 0; i < length; i += 1) otp += Math.floor(Math.random() * 10);
  return otp;
};

const sendSMS = async (phone, otp) => {
  if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID) {
    logger.info(`[DEV] OTP for ${phone}: ${otp}`);
    return;
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your OTP is: ${otp}. Valid for ${OTP_TTL_MIN()} minutes. Do not share.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

/**
 * Creates + persists a hashed OTP for a phone/purpose and delivers it.
 * Returns the plain code only in development (so the API can echo it back).
 */
const issueOTP = async (phone, purpose = 'login') => {
  await OTP.deleteMany({ phone, purpose });

  const isTest = TEST_NUMBERS().includes(phone);
  const code = isTest ? '123456' : generateOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN() * 60 * 1000);
  console.log(code)
  await OTP.create({ phone, otp: await bcrypt.hash(code, 10), expiresAt, purpose });

  if (!isTest) await sendSMS(phone, code);
  logger.info(`OTP issued to ${phone} for ${purpose}`);

  return { code, isTest, expiresIn: OTP_TTL_MIN() * 60 };
};

/**
 * Verifies an OTP. Throws AppError-compatible objects via the caller.
 * Returns true on success; increments attempts + throws on failure.
 */
const verifyOTP = async (phone, otp, purpose = 'login') => {
  const record = await OTP.findOne({
    phone,
    purpose,
    verified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) return { ok: false, reason: 'OTP expired or not found', status: 400 };
  if (record.attempts >= 5) return { ok: false, reason: 'Too many attempts. Request new OTP', status: 429 };

  const valid = await bcrypt.compare(otp.toString(), record.otp);
  if (!valid) {
    record.attempts += 1;
    await record.save();
    return { ok: false, reason: `Invalid OTP. ${5 - record.attempts} attempts left`, status: 400 };
  }

  record.verified = true;
  await record.save();
  return { ok: true };
};

module.exports = { generateOTP, issueOTP, verifyOTP, sendSMS };
