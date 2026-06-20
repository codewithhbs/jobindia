import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { MyJobsScreen } from '../screens/employer/MyJobsScreen';
import { PostJobScreen } from '../screens/employer/PostJobScreen';
import { JobApplicantsScreen } from '../screens/employer/JobApplicantsScreen';
import { EmployerProfileScreen } from '../screens/employer/EmployerProfileScreen';
import { PlansScreen } from '../screens/employer/PlansScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SettingsScreen from '../screens/common/SettingsScreen';
import SupportScreen from '../screens/common/SupportScreen';
import CmsScreen from '../screens/common/CmsScreen';
import EmployerDashboardScreen from '../screens/employer/EmployerDashboardScreen';
import JobDetailScreen from '../screens/jobseeker/JobDetailScreen';
import ViewJobSeeker from '../screens/employer/ViewJobSeeker';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ICONS = { Home: 'grid', Jobs: 'briefcase', Post: 'add-circle', Company: 'business' };

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
      <Tab.Screen name="Home" component={EmployerDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Jobs" component={MyJobsScreen} />
      <Tab.Screen name="Post" component={PostJobScreen} />
      <Tab.Screen name="Company" component={EmployerProfileScreen} />
    </Tab.Navigator>
  );
}

export function EmployerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="PostJob" component={PostJobScreen} />
      <Stack.Screen name="MyJobs" component={MyJobsScreen} />
      <Stack.Screen name="JobApplicants" component={JobApplicantsScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="ApplicantProfile" component={ViewJobSeeker} />

      <Stack.Screen name="EmployerProfile" component={EmployerProfileScreen} />
      <Stack.Screen name="Plans" component={PlansScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Cms" component={CmsScreen} />
    </Stack.Navigator>
  );
}
