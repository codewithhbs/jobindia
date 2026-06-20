// Single import surface for the notification queue layer.
//   const { enqueueSingle, enqueueRecommendJob } = require('../queue');
const queue = require('./notification.queue');
const { startNotificationWorker, stopNotificationWorker } = require('./notification.worker');

module.exports = {
  ...queue,
  startNotificationWorker,
  stopNotificationWorker,
};
