// The actual "do the work" handlers for every notification job type.
// Kept separate from the queue/worker wiring so BOTH the BullMQ worker and the
// inline (no-Redis) fallback can call exactly the same code path.
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');
const { JobSeekerProfile } = require('../models');
const { Job } = require('../models/job.model');
const { Category } = require('../models/admin.model');

// ── single push to one user ────────────────────────────────────────────────
const processSingle = async (data) => {
  return notificationService.sendToUser(data);
};

// ── push to an explicit list of users ──────────────────────────────────────
const processMany = async (data) => {
  return notificationService.sendToMany(data);
};

// ── broadcast to a role / everyone ─────────────────────────────────────────
const processBroadcast = async (data) => {
  return notificationService.broadcast(data);
};

/**
 * Compute the jobseekers a freshly-published job is relevant to and notify
 * them. The heavy matching + FCM fan-out lives here (in the worker) so the
 * HTTP request that created the job returns instantly.
 */
const processRecommendJob = async ({ jobId }) => {
  const job = await Job.findById(jobId);
  if (!job) return { count: 0 };

  const orConds = [];

  const jobSkills = job.requirements?.skills || [];
  if (jobSkills.length) orConds.push({ skills: { $in: jobSkills } });

  if (job.location?.city) {
    orConds.push({
      'preferredLocations.city': new RegExp(`^${job.location.city}$`, 'i'),
    });
  }

  // job.category is stored as a name/slug string; resolve it to a Category _id
  // to match jobseekers' preferredCategories (ObjectId refs).
  if (job.category) {
    const cat = await Category.findOne({
      $or: [{ name: job.category }, { slug: job.category }],
    }).select('_id');
    if (cat) orConds.push({ preferredCategories: cat._id });
  }

  const query = orConds.length ? { $or: orConds } : {};

  const profiles = await JobSeekerProfile.find(query).select('userId').limit(500);

  const employerId = String(job.employerId);
  const userIds = profiles
    .map((p) => p.userId)
    .filter((id) => String(id) !== employerId);

  if (!userIds.length) {
    logger.info(`Recommend job ${jobId} -> no matching seekers`);
    return { count: 0 };
  }

  const company = job.companyName || 'A company';
  const city = job.location?.city ? ` in ${job.location.city}` : '';

  return notificationService.sendToMany({
    userIds,
    title: 'New job for you 🚀',
    body: `${job.title}${city} — ${company} is hiring. Tap to apply.`,
    category: 'job',
    data: { type: 'new_job', jobId: String(job._id), category: job.category },
  });
};

/**
 * Daily scan: remind employers whose subscription is about to expire and
 * notify those whose plan has just expired. Tight date windows mean a daily
 * run fires each notification only once per employer (no flags / schema change).
 */
const processPlanExpiry = async () => {
  // Imported lazily to avoid any load-order edge cases.
  const { EmployerProfile } = require('../models');

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Expiring soon: enters the 2–3 day band once.
  const remindStart = new Date(now + 2 * day);
  const remindEnd = new Date(now + 3 * day);

  // Just expired: within the last 24h.
  const expiredStart = new Date(now - day);
  const expiredEnd = new Date(now);

  const [expiring, expired] = await Promise.all([
    EmployerProfile.find({
      subscriptionPlan: { $ne: 'free' },
      subscriptionExpiry: { $gte: remindStart, $lt: remindEnd },
    }).select('userId subscriptionPlan subscriptionExpiry'),
    EmployerProfile.find({
      subscriptionPlan: { $ne: 'free' },
      subscriptionExpiry: { $gte: expiredStart, $lte: expiredEnd },
    }).select('userId subscriptionPlan subscriptionExpiry'),
  ]);

  for (const emp of expiring) {
    // eslint-disable-next-line no-await-in-loop
    await notificationService
      .sendToUser({
        userId: emp.userId,
        title: 'Subscription expiring soon ⏳',
        body: `Your ${emp.subscriptionPlan} plan expires in 3 days. Renew to keep posting jobs.`,
        category: 'payment',
        data: { type: 'plan_expiring', plan: emp.subscriptionPlan },
      })
      .catch((e) => logger.error(`Plan-expiry remind failed: ${e.message}`));
  }

  for (const emp of expired) {
    // eslint-disable-next-line no-await-in-loop
    await notificationService
      .sendToUser({
        userId: emp.userId,
        title: 'Subscription expired',
        body: `Your ${emp.subscriptionPlan} plan has expired. Renew now to unlock job posting again.`,
        category: 'payment',
        data: { type: 'plan_expired', plan: emp.subscriptionPlan },
      })
      .catch((e) => logger.error(`Plan-expiry notice failed: ${e.message}`));
  }

  logger.info(
    `Plan-expiry scan -> ${expiring.length} expiring, ${expired.length} expired`
  );
  return { expiring: expiring.length, expired: expired.length };
};

// name -> handler map (used by both the worker and the inline fallback)
const HANDLERS = {
  single: processSingle,
  many: processMany,
  broadcast: processBroadcast,
  'recommend-job': processRecommendJob,
  'plan-expiry-scan': processPlanExpiry,
};

const runJob = async (name, data) => {
  const handler = HANDLERS[name];
  if (!handler) {
    logger.warn(`No handler for notification job "${name}"`);
    return null;
  }
  return handler(data || {});
};

module.exports = {
  HANDLERS,
  runJob,
  processSingle,
  processMany,
  processBroadcast,
  processRecommendJob,
  processPlanExpiry,
};
