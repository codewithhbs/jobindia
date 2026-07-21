import React, { useEffect, useState } from 'react';

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
import { adminApi } from '../api/admin.api';
import { MaintenanceScreen } from '../screens/auth/MaintenanceScreen';
import { useAuthStore } from '../store/authStore';
import { ROLES } from '../constants/config';
import { attachNotificationListeners } from '../services/notifications';
import { COLORS } from '../constants/theme';
import { jobseekerApi } from '../api/jobseeker.api';
import { checkUpdateRequired } from '../utils/versionCheck';
import { UpdateModal } from '../components/ui/UpdateModal';
import { ActivityIndicator } from 'react-native';

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
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [updateInfo, setUpdateInfo] = useState({ updateNeeded: false });
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // 🔑 role SIRF store se — checkRole isi ko update karta hai, live rehta hai
  const { isLoading, isAuthenticated, user, bootstrap } = useAuthStore();
  const currentRole = user?.userId?.role || ROLES.JOB_SEEKER;

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (settings) {
      setUpdateInfo(checkUpdateRequired(settings));
    }
  }, [settings]);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.publicSettings();
        setSettings(res);
      } catch (e) {
        console.log('Settings fetch failed:', e.message);
        setSettings(null); // fail-open — maintenance block skip ho jayega agar API down ho
      } finally {
        setSettingsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let lastCheckedAt = 0;
    const MIN_GAP_MS = 5000;

    const checkRole = async () => {
      const now = Date.now();
      if (now - lastCheckedAt < MIN_GAP_MS) return;
      lastCheckedAt = now;

      try {
        const res = await jobseekerApi.me();

        const latestRole = res?.userId?.role || res?.role;
        const currRole = useAuthStore.getState().user?.userId?.role;

        if (latestRole && latestRole !== currRole) {
          useAuthStore.setState((s) => ({
            user: { ...s.user, userId: { ...s.user?.userId, role: latestRole } },
          }));
        }
      } catch (err) {
        console.log('Role check failed:', err.message);
      }
    };

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

  if (isLoading || settingsLoading) {
    return <ActivityIndicator  />;
  }

  if (settings?.maintenance_mode) {
    return <MaintenanceScreen settings={settings} />;
  }

  const showUpdateModal =
    updateInfo.updateNeeded && (updateInfo.forceUpdate || !updateDismissed);

  return (
    <>
      <NavigationContainer ref={navRef} theme={navTheme}>
        {isAuthenticated ? (
          <RoleStack key={currentRole} role={currentRole} />
        ) : (
          <AuthNavigator key="auth" />
        )}
      </NavigationContainer>

      <UpdateModal
        visible={showUpdateModal}
        forceUpdate={updateInfo.forceUpdate}
        storeUrl={updateInfo.storeUrl}
        onDismiss={() => setUpdateDismissed(true)}
      />
    </>
  );
}

export default RootNavigator;