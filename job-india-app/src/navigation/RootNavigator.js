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
import { authApi } from '../api/auth.api';
import { jobseekerApi } from '../api/jobseeker.api';

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
    user,
    bootstrap,
  } = useAuthStore();


  useEffect(() => {
    bootstrap();
  }, []);

  // 🔄 Check role whenever navigation state changes (i.e. user navigates
  // anywhere) instead of a fixed timer. Catches server-side role changes
  // (admin promotes user, KYC approval flips driver status, etc.) the
  // moment the user moves around the app — no logout/login needed.
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastCheckedAt = 0;
    const MIN_GAP_MS = 5000; // don't re-check more than once every 5s even if nav fires rapidly

    const checkRole = async () => {
      const now = Date.now();
      if (now - lastCheckedAt < MIN_GAP_MS) return;
      lastCheckedAt = now;

      try {
        const res = await jobseekerApi.me(); // adjust to your actual "get current user" endpoint
     
        const latestRole = res?.userId?.role || res?.role;
        const currentRole = useAuthStore.getState().user?.userId?.role;

        if (latestRole && latestRole !== currentRole) {
          useAuthStore.setState((s) => ({
            user: { ...s.user, userId: { ...s.user?.userId, role: latestRole } },
          }));
        }
      } catch (err) {
        console.log('Role check failed:', err.message);
      }
    };

    // Run once immediately on auth, then on every navigation state change.
    checkRole();
    const unsubscribe = navRef.addListener?.('state', checkRole);

    return () => unsubscribe?.();
  }, [isAuthenticated, navRef]);

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

  // 🔑 Resolved once, reused for both the render below and the `key`.
  const currentRole = user?.userId?.role || 'jobseeker';

  return (
    <NavigationContainer
      ref={navRef}
      theme={navTheme}
    >
      {isAuthenticated ? (
        // key=currentRole forces React to fully unmount the previous role's
        // navigator (JobSeekerNavigator/DriverNavigator/EmployerNavigator)
        // and mount a brand new one instead of reconciling in place.
        // Without this, switching jobseeker -> logout -> driver reuses the
        // old navigator's internal navigation state (same route names =
        // React treats it as "the same tree, just re-rendered"), so stale
        // screens/params survive until a full app restart clears them.
        <RoleStack key={currentRole} role={currentRole} />
      ) : (
        <AuthNavigator key="auth" />
      )}

    </NavigationContainer>
  );
}

export default RootNavigator;