const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { RefreshToken } = require('../models');
const { getRedis } = require('../config/redis');

const ACCESS_TTL_SECONDS = 900; // 15 min (must align with JWT_EXPIRES_IN)

const signAccessToken = (user) =>
  jwt.sign(
    { userId: user._id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

const createRefreshToken = async (userId, { userAgent, ipAddress } = {}) => {
  const token = uuidv4();
  await RefreshToken.create({
    userId,
    token,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  return token;
};

const cacheSession = async (user) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.setEx(
    `session:${user._id}`,
    ACCESS_TTL_SECONDS,
    JSON.stringify({ userId: user._id, role: user.role, phone: user.phone })
  );
};

const clearSession = async (userId) => {
  const redis = getRedis();
  if (redis) await redis.del(`session:${userId}`);
};

/**
 * Issues a full token bundle (access + refresh) and caches the session.
 */
const issueAuthTokens = async (user, meta = {}) => {
  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user._id, meta);
  await cacheSession(user);
  return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SECONDS };
};

module.exports = {
  signAccessToken,
  createRefreshToken,
  cacheSession,
  clearSession,
  issueAuthTokens,
  ACCESS_TTL_SECONDS,
};
