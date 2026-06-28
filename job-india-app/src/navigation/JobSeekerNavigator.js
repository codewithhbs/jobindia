import React from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import { useFetch } from '../hooks/useFetch';
import { userApi } from '../api/user.api';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = { Home: 'home', Jobs: 'briefcase', Applications: 'document-text', Dashboard: 'stats-chart', Account: 'person' };

// Backend already tells us via `isProfileComplete` whether basic info is done.
function isBasicInfoComplete(user) {
  if (!user || !user._id) return false;
  return Boolean(user.isProfileComplete);
}

// Below this, the jobseeker's extended profile (skills, experience, etc.)
// is considered too thin and we send them to EditProfile to fill it in.
const PROFILE_COMPLETENESS_THRESHOLD = 50;

function isExtendedProfileComplete(profile) {
  const pct = profile?.profileCompleteness;
  if (typeof pct !== 'number') return true; // unknown -> don't block
  return pct >= PROFILE_COMPLETENESS_THRESHOLD;
}

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
  const { data, loading } = useFetch(() => userApi.getProfile(), []);
  const user = data?.user || {};
  const profile = data?.profile || {};

  // While the profile is loading we don't yet know whether the user needs
  // to be sent to BasicDetails/EditProfile, so we show a loader instead of
  // rendering the Stack — this is what prevents the Home/Tabs flash.
  if (loading || !user?._id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background || '#fff' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Decide the very first screen of the stack:
  // 1. Basic info (name/email/location) missing -> basicdetails
  // 2. Basic info done but extended jobseeker profile too thin -> EditProfile
  // 3. Both done -> Tabs
  // initialRouteName is only read on first mount, but since this component
  // only mounts the Stack AFTER loading is false, the value is always
  // correct for this session — no flash, no race with navigate().
  let initialRouteName;
  let basicDetailsParams;
  let editProfileParams;

  if (!isBasicInfoComplete(user)) {
    initialRouteName = 'basicdetails';
    basicDetailsParams = { redirect: 'Tabs', complete: true };
  } else if (!isExtendedProfileComplete(profile)) {
    initialRouteName = 'EditProfile';
    editProfileParams = { redirectFrom: 'basicDetail' };
  } else {
    initialRouteName = 'Tabs';
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="JobMap" component={JobMapScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} initialParams={editProfileParams} />
      <Stack.Screen name="Saved" component={SavedJobsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="basicdetails" component={BasicDetails} initialParams={basicDetailsParams} />
      <Stack.Screen name="Cms" component={CmsScreen} />
      <Stack.Screen name="JobsList" component={JobsList} />
    </Stack.Navigator>
  );
}