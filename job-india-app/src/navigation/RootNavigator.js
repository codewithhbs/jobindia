import React, { useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';

import { SplashScreen } from '../screens/auth/OnboardingScreen';
import { AuthNavigator } from './AuthNavigator';
import { JobSeekerNavigator } from './JobSeekerNavigator';
import { EmployerNavigator } from './EmployerNavigator';
import { DriverNavigator } from './DriverNavigator';

import { useAuthStore } from '../store/authStore';
import { ROLES } from '../constants/config';
import { attachNotificationListeners } from '../services/notifications';
import { COLORS } from '../constants/theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.primary,
  },
};

function RoleStack({ role }) {
  switch (role) {
    case ROLES.EMPLOYER:
      return <EmployerNavigator />;

    case ROLES.DRIVER:
      return <DriverNavigator />;

    case ROLES.JOB_SEEKER:
    default:
      return <JobSeekerNavigator />;
  }
}

export function RootNavigator() {
  const navRef = useNavigationContainerRef();

  const {
    isLoading,
    isAuthenticated,
    role,
    bootstrap,
  } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    const unsubscribe = attachNotificationListeners({
      onResponse: () => {
        try {
          if (navRef.isReady()) {
            navRef.navigate('Notifications');
          }
        } catch (error) {
          console.log('Navigation Error:', error);
        }
      },
    });

    return unsubscribe;
  }, [navRef]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      ref={navRef}
      theme={navTheme}
    >
      {isAuthenticated ? (
        <RoleStack role={role} />
      ) : (
        <AuthNavigator />
      )}
          
    </NavigationContainer>
  );
}

export default RootNavigator;