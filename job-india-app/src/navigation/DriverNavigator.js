import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import ApplicationsScreen from '../screens/jobseeker/ApplicationsScreen';
import  DriverProfileScreen from '../screens/driver/DriverProfileScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';

import HomeScreen from '../screens/jobseeker/HomeScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JobDetailScreen from '../screens/jobseeker/JobDetailScreen';
import JobMapScreen from '../screens/jobseeker/JobMapScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import SupportScreen from '../screens/common/SupportScreen';
import KycScreen from '../screens/common/KycScreen';
import CmsScreen from '../screens/common/CmsScreen';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ICONS = { Jobs: 'car', Applications: 'document-text', Profile: 'person' };

function Tabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.surface, borderTopColor: COLORS.border, 
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
           paddingTop: 6
        },
        tabBarLabelStyle: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`} size={22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Jobs" component={HomeScreen} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen name="Profile" component={DriverProfileScreen} />
    </Tab.Navigator>
  );
}

export function DriverNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="JobMap" component={JobMapScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Kyc" component={KycScreen} />
      <Stack.Screen name="Cms" component={CmsScreen} />
    </Stack.Navigator>
  );
}
