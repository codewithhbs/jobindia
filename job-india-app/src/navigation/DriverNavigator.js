import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import ApplicationsScreen from '../screens/jobseeker/ApplicationsScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';

import HomeScreen from '../screens/jobseeker/HomeScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JobDetailScreen from '../screens/jobseeker/JobDetailScreen';
import JobMapScreen from '../screens/jobseeker/JobMapScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import SupportScreen from '../screens/common/SupportScreen';
import KycScreen from '../screens/common/KycScreen';
import CmsScreen from '../screens/common/CmsScreen';
import JobsList from '../screens/jobseeker/JobsList';
import BasicDetails from '../screens/jobseeker/BasicDetails';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const TAB_ICONS = {
  Jobs: {
    active: 'car',
    inactive: 'car-outline',
  },
  JobMap: {
    active: 'map',
    inactive: 'map-outline',
  },
  Applications: {
    active: 'document-text',
    inactive: 'document-text-outline',
  },
  Profile: {
    active: 'person',
    inactive: 'person-outline',
  },

  Kyc: {
    active: 'shield-checkmark',
    inactive: 'shield-checkmark-outline',
  },
};
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
          <Ionicons
            name={
              focused
                ? TAB_ICONS[route.name].active
                : TAB_ICONS[route.name].inactive
            }
            size={22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Jobs" component={HomeScreen} />
      <Tab.Screen name="JobMap" component={JobMapScreen} />

      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen name="Kyc" component={DriverProfileScreen} />
      <Tab.Screen name="Profile" component={BasicDetails} />

    </Tab.Navigator>
  );
}

export function DriverNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="JobMap" component={JobMapScreen} />
      <Stack.Screen name="JobsList" component={JobsList} />
      <Stack.Screen name="basicdetails" component={BasicDetails} />

      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Kyc" component={KycScreen} />
      <Stack.Screen name="Cms" component={CmsScreen} />
    </Stack.Navigator>
  );
}
