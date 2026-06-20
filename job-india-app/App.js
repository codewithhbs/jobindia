// App.js
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import { RootNavigator } from './src/navigation/RootNavigator';
import { AppAlertHost } from './src/components/ui/AppAlert';
import { registerForPushNotifications } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);

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