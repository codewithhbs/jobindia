const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let initialized = false;


const initFirebase = () => {
  if (initialized) return admin;
  try {
    const fileName =
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      'jobindia-dd491-firebase-adminsdk-fbsvc-5a175506eb.json';
    const saPath = path.isAbsolute(fileName) ? fileName : path.join(process.cwd(), fileName);

    if (!fs.existsSync(saPath)) {
      logger.warn(`Firebase service account not found at ${saPath} — FCM push disabled`);
      return null;
    }

    // eslint-disable-next-line import/no-dynamic-require, global-require
    const serviceAccount = require(saPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
    logger.info('Firebase Admin initialized');
    return admin;
  } catch (err) {
    logger.error(`Firebase init failed: ${err.message}`);
    return null;
  }
};

// Returns admin.messaging() or null if Firebase isn't configured.
const getMessaging = () => {
  const a = initFirebase();
  return a ? a.messaging() : null;
};

module.exports = { initFirebase, getMessaging, admin };