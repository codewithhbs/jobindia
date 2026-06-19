const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging: firebaseGetMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let initialized = false;

const admin = {
  initializeApp,
  cert,
  getApps,
};

const initFirebase = () => {
  if (initialized) return admin;

  try {
    const fileName =
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      'jobindia-dd491-firebase-adminsdk-fbsvc-5a175506eb.json';

    const saPath = path.isAbsolute(fileName)
      ? fileName
      : path.join(process.cwd(), fileName);

    if (!fs.existsSync(saPath)) {
      logger.warn(
        `Firebase service account not found at ${saPath} — FCM push disabled`
      );
      return null;
    }

    const serviceAccount = require(saPath);

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    initialized = true;
    logger.info('Firebase Admin initialized');

    return admin;
  } catch (err) {
    logger.error(`Firebase init failed: ${err.message}`);
    return null;
  }
};

const getMessaging = () => {
  const a = initFirebase();
  return a ? firebaseGetMessaging() : null;
};

module.exports = {
  initFirebase,
  getMessaging,
  admin,
};