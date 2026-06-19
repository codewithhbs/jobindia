// models/notification.model.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['push', 'sms', 'email', 'in_app'], default: 'push' },
  category: { type: String, enum: ['system', 'job', 'application', 'kyc', 'promotion', 'general'], default: 'general' },
  data: mongoose.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  isSent: { type: Boolean, default: false },
  sentAt: Date,
  targetType: { type: String, enum: ['user', 'role', 'all'], default: 'user' },
  targetRole: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
