import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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
 * Asks permission, gets the Expo push token, and syncs it (+ device info)
 * to the backend so the notification service can target this device.
 * Safe to call after login; no-ops gracefully on simulators / web.
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

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const expoPushToken = tokenData.data;

    // Sync token + device info to backend (best-effort).
    await userApi
      .updateProfile(asForm({ expoPushToken, deviceInfo: JSON.stringify(buildDeviceInfo()) }))
      .catch(() => userApi.updatePushToken({ expoPushToken }).catch(() => {}));

    return expoPushToken;
  } catch (_e) {
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

// multipart helper (updateProfile expects form-data)
function asForm(obj) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => v != null && fd.append(k, v));
  return fd;
}
