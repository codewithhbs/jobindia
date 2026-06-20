const { Notification, User } = require('../models');
const logger = require('../utils/logger');
const { getMessaging } = require('../config/firebase');

// FCM data payload must be a flat string -> string map.
const toStringData = (data = {}) => {
  const out = {};
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  });
  return out;
};

// Common Android/APNs options for a single + multicast message.
const androidOpts = {
  priority: 'high',
  notification: { channelId: 'default', color: '#4F6EF7', sound: 'default' },
};
const apnsOpts = { payload: { aps: { sound: 'default', badge: 1 } } };

const INVALID_TOKEN = 'messaging/registration-token-not-registered';

/**
 * Send a push to a single user by their stored FCM token (user.fcmToken),
 * and persist a Notification record. Falls back to store-only if Firebase
 * isn't configured or the user has no token.
 */
const sendToUser = async ({ userId, title, body, type = 'push', category = 'general', data }) => {
  const notification = await Notification.create({
    userId, title, body, type, category, data, targetType: 'user', isSent: false,
  });

  try {
    const messaging = getMessaging();
    const user = await User.findById(userId).select('fcmToken');
    const token = user?.fcmToken;

    if (!messaging) {
      logger.warn('Firebase unavailable — notification stored only');
      return notification;
    }
    if (!token || type !== 'push') return notification;

    await messaging.send({
      token,
      notification: { title, body },
      data: toStringData({ ...data, category, notificationId: String(notification._id) }),
      android: androidOpts,
      apns: apnsOpts,
    });

    notification.isSent = true;
    notification.sentAt = new Date();
    await notification.save();
  } catch (err) {
    // Drop dead tokens so we stop trying them.
    if (err.code === INVALID_TOKEN) {
      await User.updateOne({ _id: userId }, { $unset: { fcmToken: 1 } }).catch(() => { });
    }
    logger.error(`FCM send failed (user ${userId}): ${err.message}`);
  }

  return notification;
};

/**
 * Broadcast to all users or a single role. Fans out FCM tokens in batches
 * of 500 via sendEachForMulticast and prunes invalid tokens.
 */
const broadcast = async ({ title, body, targetRole, category = 'promotion', data }) => {
  const notification = await Notification.create({
    title, body, type: 'push', category, data,
    targetType: targetRole ? 'role' : 'all', targetRole,
  });

  try {
    const messaging = getMessaging();
    if (!messaging) {
      logger.warn('Firebase unavailable — broadcast stored only');
      return notification;
    }

    const filter = { fcmToken: { $exists: true, $nin: [null, ''] } };
    if (targetRole) filter.role = targetRole;

    const users = await User.find(filter).select('fcmToken');
    console.log(users)
    const tokens = users.map((u) => u.fcmToken).filter(Boolean);
    if (tokens.length === 0) {
      logger.info(`Broadcast "${title}" -> no devices`);
      return notification;
    }

    let sent = 0;
    let failed = 0;
    const invalid = [];

    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      // eslint-disable-next-line no-await-in-loop
      const res = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: toStringData({ ...data, category }),
        android: androidOpts,
        apns: apnsOpts,
      });
      sent += res.successCount;
      failed += res.failureCount;
      res.responses.forEach((r, idx) => {
        if (!r.success) {
          console.log('FCM Error:', {
            token: batch[idx],
            code: r.error?.code,
            message: r.error?.message,
          });

          if (r.error?.code === INVALID_TOKEN) {
            invalid.push(batch[idx]);
          }
        }
      });
    }

    if (invalid.length) {
      await User.updateMany({ fcmToken: { $in: invalid } }, { $unset: { fcmToken: 1 } }).catch(() => { });
    }

    notification.isSent = true;
    notification.sentAt = new Date();
    await notification.save().catch(() => { });
    logger.info(`Broadcast "${title}" -> sent ${sent}, failed ${failed} (${invalid.length} pruned)`);
  } catch (err) {
    logger.error(`Broadcast failed: ${err.message}`);
  }

  return notification;
};

/**
 * Send the same push to an explicit list of users (e.g. recommended seekers
 * for a new job). Persists one in-app Notification per user via insertMany,
 * then multicasts FCM in batches of 500 and prunes dead tokens. Designed to be
 * called from the queue worker so large fan-outs never block a request.
 */
const sendToMany = async ({ userIds = [], title, body, type = 'push', category = 'general', data }) => {
  const ids = [...new Set(userIds.map((id) => String(id)))];
  if (ids.length === 0) return { count: 0 };

  const docs = ids.map((userId) => ({
    userId, title, body, type, category, data, targetType: 'user', isSent: false,
  }));
  const createdDocs = await Notification.insertMany(docs, { ordered: false }).catch((err) => {
    logger.error(`sendToMany insert failed: ${err.message}`);
    return [];
  });

  try {
    const messaging = getMessaging();
    if (!messaging || type !== 'push') {
      if (!messaging) logger.warn('Firebase unavailable — multi-notification stored only');
      return { count: createdDocs.length };
    }

    const users = await User.find({
      _id: { $in: ids },
      fcmToken: { $exists: true, $nin: [null, ''] },
    }).select('fcmToken');

    const tokens = users.map((u) => u.fcmToken).filter(Boolean);
    if (tokens.length === 0) return { count: createdDocs.length };

    let sent = 0;
    let failed = 0;
    const invalid = [];

    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      // eslint-disable-next-line no-await-in-loop
      const res = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: toStringData({ ...data, category }),
        android: androidOpts,
        apns: apnsOpts,
      });
      sent += res.successCount;
      failed += res.failureCount;
      res.responses.forEach((r, idx) => {
        if (!r.success && r.error?.code === INVALID_TOKEN) invalid.push(batch[idx]);
      });
    }

    if (invalid.length) {
      await User.updateMany({ fcmToken: { $in: invalid } }, { $unset: { fcmToken: 1 } }).catch(() => {});
    }
    logger.info(`sendToMany "${title}" -> sent ${sent}, failed ${failed} (${invalid.length} pruned)`);
  } catch (err) {
    logger.error(`sendToMany failed: ${err.message}`);
  }

  return { count: createdDocs.length };
};

module.exports = { sendToUser, broadcast, sendToMany };