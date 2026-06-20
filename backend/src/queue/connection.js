// Dedicated ioredis connection(s) for BullMQ.
// BullMQ needs `maxRetriesPerRequest: null` and its own connection (separate
// from the app's `redis` client in config/redis.js). If REDIS_URL is missing
// we run in "queue-disabled" mode and the queue layer falls back to inline
// (in-process) sending so the app keeps working without Redis.
const IORedis = require('ioredis');
const logger = require('../utils/logger');

const QUEUE_ENABLED = Boolean(process.env.REDIS_URL);

// BullMQ opens multiple blocking connections; reuse a single factory.
const createConnection = () => {
  if (!QUEUE_ENABLED) return null;
  const conn = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
  });
  conn.on('error', (err) => logger.error(`Queue Redis error: ${err.message}`));
  return conn;
};

module.exports = { QUEUE_ENABLED, createConnection };
