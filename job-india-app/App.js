import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { RootNavigator } from './src/navigation/RootNavigator';
import { AppAlertHost } from './src/components/ui/AppAlert';
import { userApi } from './src/api/user.api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) return;

      let { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        const permission = await Notifications.requestPermissionsAsync();
        status = permission.status;
      }

      if (status !== 'granted') return;

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;

      if (projectId) {
        const expoToken = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        console.log('Expo Push Token:', expoToken.data);
      }

      const nativeToken = await Notifications.getDevicePushTokenAsync();

      const fcmToken = nativeToken?.data;

      if (!fcmToken) return;


      await userApi.updatePushToken({
        fcmToken,
      });
    } catch (error) {
      console.error('Push registration failed:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootNavigator />
        <Toast />
        <AppAlertHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}