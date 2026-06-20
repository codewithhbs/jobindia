// The notification queue + the public enqueue API used across the app.
//
// Controllers/services should ONLY import the enqueue* helpers from here — they
// never call FCM directly anymore. If Redis is configured the job is pushed to
// BullMQ and handled by the worker (so the HTTP request returns instantly and
// the server stays light under load). If Redis is NOT configured we fall back
// to running the same handler inline via setImmediate (fire-and-forget) so the
// app keeps working exactly as before, just without the queue.
const { Queue } = require('bullmq');
const { QUEUE_ENABLED, createConnection } = require('./connection');
const { runJob } = require('./notification.processor');
const logger = require('../utils/logger');

const QUEUE_NAME = 'notifications';

let queue = null;

const getQueue = () => {
  if (!QUEUE_ENABLED) return null;
  if (queue) return queue;
  queue = new Queue(QUEUE_NAME, {
    connection: createConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
    },
  });
  logger.info('Notification queue ready (BullMQ)');
  return queue;
};

// Core dispatch: enqueue when possible, otherwise run inline without blocking
// the caller. Never throws — notification delivery must not break a request.
const dispatch = async (name, data, opts = {}) => {
  try {
    const q = getQueue();
    if (q) {
      await q.add(name, data, opts);
      return;
    }
  } catch (err) {
    logger.error(`Enqueue "${name}" failed, falling back inline: ${err.message}`);
  }
  // Inline fallback — don't await, don't block the HTTP response.
  setImmediate(() => {
    runJob(name, data).catch((e) =>
      logger.error(`Inline notification "${name}" failed: ${e.message}`)
    );
  });
};

// ── Public enqueue helpers ──────────────────────────────────────────────────
const enqueueSingle = (payload) => dispatch('single', payload);
const enqueueMany = (payload) => dispatch('many', payload);
const enqueueBroadcast = (payload) => dispatch('broadcast', payload);
const enqueueRecommendJob = (jobId) => dispatch('recommend-job', { jobId: String(jobId) });
const enqueuePlanExpiryScan = () => dispatch('plan-expiry-scan', {});

module.exports = {
  QUEUE_NAME,
  QUEUE_ENABLED,
  getQueue,
  enqueueSingle,
  enqueueMany,
  enqueueBroadcast,
  enqueueRecommendJob,
  enqueuePlanExpiryScan,
};
