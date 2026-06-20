// services/notifications.js
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { userApi } from '../api/user.api';

// Foreground display behaviour.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const buildDeviceInfo = () => ({
  platform: Platform.OS,
  type: Device.deviceType === 1 ? 'phone' : Device.deviceType === 2 ? 'tablet' : 'unknown',
  brand: Device.brand,
  model: Device.modelName,
  os: Device.osName,
  osVer: Device.osVersion,
  isDevice: Device.isDevice,
});

/**
 * Asks permission, gets the raw FCM device token (since the backend sends
 * via Firebase Admin SDK directly — NOT the Expo push service), and syncs
 * it + device info to the backend. Safe to call after login; no-ops on
 * simulators / web.
 */
export async function registerForPushNotifications() {
  try {
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F6EF7',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    // Backend sends via Firebase Admin SDK → we need the raw device FCM
    // token, NOT the Expo push token. getExpoPushTokenAsync() is not used
    // anywhere in this flow.
    const nativeToken = await Notifications.getDevicePushTokenAsync();
    const fcmToken = nativeToken?.data;
    if (!fcmToken) return null;

    console.log('FCM Device Token:', fcmToken);

    await userApi.updatePushToken({
      fcmToken,
      deviceInfo: buildDeviceInfo(),
    });

    return fcmToken;
  } catch (e) {
    console.error('Push registration failed:', e);
    return null;
  }
}

// Wire tap / receive listeners. Returns an unsubscribe fn.
export function attachNotificationListeners({ onReceive, onResponse } = {}) {
  const recSub = Notifications.addNotificationReceivedListener((n) => onReceive?.(n));
  const resSub = Notifications.addNotificationResponseReceivedListener((r) => onResponse?.(r));
  return () => {
    recSub.remove();
    resSub.remove();
  };
}