const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not set — running without Redis (sessions disabled)');
    return null;
  }

  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    await redisClient.connect();
    logger.info('Redis connected');
    return redisClient;
  } catch (err) {
    logger.error(`Redis connection failed: ${err.message} — continuing without it`);
    redisClient = null;
    return null;
  }
};

const getRedis = () => redisClient;

module.exports = { connectRedis, getRedis };
