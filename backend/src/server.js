require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { startNotificationWorker, stopNotificationWorker } = require('./queue');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDB();
  await connectRedis(); // optional — app runs even if Redis is down
  await startNotificationWorker(); // BullMQ worker + daily plan-expiry scan

  const server = app.listen(PORT, () =>
    logger.info(`🚀 ${process.env.SERVICE_NAME || 'backend'} running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
  );

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    stopNotificationWorker().catch(() => {});
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force-exit if it hangs
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  });
};

start();
