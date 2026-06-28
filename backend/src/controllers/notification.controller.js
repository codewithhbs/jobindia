const catchAsync = require('../utils/catchAsync');
const { ok } = require('../utils/ApiResponse');
const { Notification } = require('../models');
const notificationService = require('../services/notification.service');

// POST /api/v1/notifications/send  (admin / internal)
exports.send = catchAsync(async (req, res) => {
  const notification = await notificationService.sendToUser(req.body);
  ok(res, notification);
});

// POST /api/v1/notifications/broadcast (admin)
exports.broadcast = catchAsync(async (req, res) => {
  const notification = await notificationService.broadcast(req.body);
  ok(res, notification, 'Broadcast queued');
});

// POST /api/v1/notifications/send-bulk (admin)
// Send the same push to an explicit list of selected userIds, any role mix.
exports.sendToSelected = catchAsync(async (req, res, next) => {
  const { userIds, title, body, category, data, type } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return next(new AppError('userIds must be a non-empty array', 400));
  }
  if (!title?.trim() || !body?.trim()) {
    return next(new AppError('title and body are required', 400));
  }

  const result = await notificationService.sendToMany({
    userIds,
    title: title.trim(),
    body: body.trim(),
    type: type || 'push',
    category: category || 'general',
    data,
  });

  ok(res, result, `Notification queued for ${result.count} user(s)`);
});

// GET /api/v1/notifications — current user's feed
exports.getMyNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const filter = { userId: req.user.userId };

  const [notifs, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit, 10)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  res.json({ success: true, data: notifs, unreadCount: unread, pagination: { total, page: parseInt(page, 10) } });
});

// PUT /api/v1/notifications/:id/read
exports.markRead = catchAsync(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, { isRead: true });
  ok(res, null, 'Marked as read');
});

// PUT /api/v1/notifications/read-all
exports.markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ userId: req.user.userId, isRead: false }, { isRead: true });
  ok(res, null, 'All marked as read');
});
