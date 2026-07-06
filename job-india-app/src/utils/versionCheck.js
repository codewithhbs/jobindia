import * as Application from 'expo-application';
import { Platform } from 'react-native';

// Compares "1.2.3" vs "1.10.0" correctly (not string compare)
export function isVersionLower(current, minimum) {
  if (!current || !minimum) return false;
  const c = String(current).split('.').map(Number);
  const m = String(minimum).split('.').map(Number);
  const len = Math.max(c.length, m.length);
  for (let i = 0; i < len; i++) {
    const cv = c[i] || 0;
    const mv = m[i] || 0;
    if (cv < mv) return true;
    if (cv > mv) return false;
  }
  return false;
}

export function getCurrentAppVersion() {
  return Application.nativeApplicationVersion || '0.0.0';
}

export function checkUpdateRequired(settings) {
  if (!settings) return { updateNeeded: false };

  const current = getCurrentAppVersion();
  console.log(current)
  const minVersion = Platform.OS === 'ios'
    ? settings.min_app_version_ios
    : settings.min_app_version_android;

  const updateNeeded = isVersionLower(current, minVersion);
  const storeUrl = Platform.OS === 'ios'
    ? settings.app_store_url
    : (settings.play_store_url || settings.app_store_url);

  return {
    updateNeeded,
    forceUpdate: !!settings.force_update,
    storeUrl,
    currentVersion: current,
    minVersion,
  };
}