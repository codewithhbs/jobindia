import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import JobDetailScreen from '../screens/jobseeker/JobDetailScreen';
import JobMapScreen from '../screens/jobseeker/JobMapScreen';
import ApplicationsScreen from '../screens/jobseeker/ApplicationsScreen';
import SavedJobsScreen from '../screens/jobseeker/SavedJobsScreen';
import DashboardScreen from '../screens/jobseeker/DashboardScreen';
import ProfileScreen from '../screens/jobseeker/ProfileScreen';
import EditProfileScreen from '../screens/jobseeker/EditProfileScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import SupportScreen from '../screens/common/SupportScreen';
import KycScreen from '../screens/common/KycScreen';
import CmsScreen from '../screens/common/CmsScreen';
import HomeScreen from '../screens/jobseeker/HomeScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BasicDetails from '../screens/jobseeker/BasicDetails';
import JobsList from '../screens/jobseeker/JobsList';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = { Home: 'home', Jobs: 'briefcase', Applications: 'document-text', Dashboard: 'stats-chart', Account: 'person' };

function Tabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.surface, borderTopColor: COLORS.border, height: 60 + insets.bottom,
          paddingBottom: insets.bottom, paddingTop: 6
        },
        tabBarLabelStyle: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`} size={22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jobs" component={JobsList} />

      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Account" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function JobSeekerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="JobMap" component={JobMapScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Saved" component={SavedJobsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="basicdetails" component={BasicDetails} />
      <Stack.Screen name="Cms" component={CmsScreen} />
      <Stack.Screen name="JobsList" component={JobsList} />



    </Stack.Navigator>
  );
}
