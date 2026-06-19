const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { getRedis } = require('../config/redis');

/**
 * Verifies the Bearer JWT and attaches `req.user`.
 * If Redis is up, also confirms the session still exists (supports logout-all).
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new AppError('No token provided', 401);

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const redis = getRedis();
    if (redis) {
      const session = await redis.get(`session:${decoded.userId}`);
      if (!session) throw new AppError('Session expired, please login again', 401);
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(err);
  }
};

// Soft auth — attaches req.user if a valid token is present, never blocks.
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    }
  } catch (_e) {
    /* ignore */
  }
  next();
};

const authorize = (roles = []) => (req, _res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

module.exports = { authenticate, optionalAuth, authorize };
