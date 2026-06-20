// Starts the BullMQ worker that drains the notification queue and registers the
// daily plan-expiry scan as a repeatable job. If Redis isn't configured we skip
// the worker (enqueue helpers already run inline) and instead drive the daily
// plan-expiry scan with a plain setInterval so that feature still works.
const { Worker } = require('bullmq');
const { QUEUE_NAME, QUEUE_ENABLED, getQueue } = require('./notification.queue');
const { createConnection } = require('./connection');
const { runJob, processPlanExpiry } = require('./notification.processor');
const logger = require('../utils/logger');

// Daily at 09:00 server time.
const PLAN_EXPIRY_CRON = process.env.PLAN_EXPIRY_CRON || '0 9 * * *';
const DAY_MS = 24 * 60 * 60 * 1000;

let worker = null;
let intervalTimer = null;

const startNotificationWorker = async () => {
  if (!QUEUE_ENABLED) {
    logger.warn(
      'Notification worker not started (no REDIS_URL) — sending inline + interval plan-expiry scan'
    );
    // Fallback scheduler for the plan-expiry feature when Bull is unavailable.
    if (!intervalTimer) {
      intervalTimer = setInterval(() => {
        processPlanExpiry().catch((e) =>
          logger.error(`Interval plan-expiry scan failed: ${e.message}`)
        );
      }, DAY_MS);
      intervalTimer.unref();
    }
    return null;
  }

  // Concurrency keeps throughput up without hammering FCM/Mongo.
  worker = new Worker(
    QUEUE_NAME,
    async (job) => runJob(job.name, job.data),
    {
      connection: createConnection(),
      concurrency: Number(process.env.NOTIFICATION_CONCURRENCY || 5),
    }
  );

  worker.on('failed', (job, err) =>
    logger.error(`Notification job ${job?.name} (${job?.id}) failed: ${err.message}`)
  );
  worker.on('error', (err) => logger.error(`Notification worker error: ${err.message}`));

  // Register the repeatable plan-expiry scan (BullMQ dedupes by jobId/repeat key).
  try {
    const q = getQueue();
    await q.add(
      'plan-expiry-scan',
      {},
      { repeat: { pattern: PLAN_EXPIRY_CRON }, jobId: 'plan-expiry-cron' }
    );
    logger.info(`Notification worker started — plan-expiry scan @ "${PLAN_EXPIRY_CRON}"`);
  } catch (err) {
    logger.error(`Failed to schedule plan-expiry scan: ${err.message}`);
  }

  return worker;
};

const stopNotificationWorker = async () => {
  if (intervalTimer) clearInterval(intervalTimer);
  if (worker) await worker.close().catch(() => {});
};

module.exports = { startNotificationWorker, stopNotificationWorker };
