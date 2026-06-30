import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { useFetch } from '../hooks/useFetch';
import { kycApi } from '../api/kyc.api';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const TAB_ICONS = {
  Home: { active: 'car', inactive: 'car-outline' },
  Jobs: { active: 'map', inactive: 'map-outline' },
  Applications: { active: 'document-text', inactive: 'document-text-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
  Kyc: { active: 'shield-checkmark', inactive: 'shield-checkmark-outline' },
};

function Tabs({ kycStatus }) {
  const insets = useSafeAreaInsets();
  const initialRoute = kycStatus === 'not_submitted' ? 'Kyc' : 'Home';
  const isForced = kycStatus === 'not_submitted';

  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
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
            name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive}
            size={22}
            color={color}
          />
        ),
        // forced hone par dusre tabs disable — tap karne pe kuch na ho
        tabBarButton: isForced && route.name !== 'Kyc'
          ? (props) => <View {...props} style={[props.style, { opacity: 0.4 }]} pointerEvents="none" />
          : undefined,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jobs" component={JobsList} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen
        name="Kyc"
        component={DriverProfileScreen}
        initialParams={{ forced: isForced }}
      />
      <Tab.Screen name="Profile" component={BasicDetails} />
    </Tab.Navigator>
  );
}
export function DriverNavigator() {
  const { data, loading } = useFetch(() => kycApi.status(), []);

  // status fetch hone tak block — galat tab flash na ho
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {() => <Tabs kycStatus={data?.overallStatus} />}
      </Stack.Screen>
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