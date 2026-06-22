import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { jobseekerApi } from '../../api/jobseeker.api';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toast';
import { Loader, Screen } from '../../components/ui/Screen';
import { Avatar, Badge, Card } from '../../components/ui';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useFocusEffect } from '@react-navigation/native';

const BASE_SERVER = 'https://jobapi.adsdigitalmedia.com';

export default function ProfileScreen({ navigation }) {
  const logout = useAuthStore((s) => s.logout);
  const { data: profile, loading, refetch } = useFetch(() => jobseekerApi.me(), []);
  const [openToWork, setOpenToWork] = useState(true);
  const authUser = useAuthStore((s) => s.user);
  const user = profile?.userId ?? authUser ?? {};

  React.useEffect(() => {
    if (profile) setOpenToWork(profile.isOpenToWork);
  }, [profile]);
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  const toggle = async (val) => {
    setOpenToWork(val);
    try { await jobseekerApi.toggleOpenToWork(val); } catch (e) { toast.error('Error', e.message); setOpenToWork(!val); }
  };

  if (loading && !profile) return <Screen><Loader text="Loading profile..." /></Screen>;

  const pct = profile?.profileCompleteness || 0;
  const imageUser = user?.avatar ?  `${BASE_SERVER}${user?.avatar}`:""

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Avatar uri={imageUser} name={user?.name} size={72} />
          <Text style={styles.name}>{user?.name || 'Complete your profile'}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          {profile?.headline ? <Badge label={profile.headline} color={COLORS.secondary} /> : null}
        </View>

        <Card style={styles.completeCard}>
          <View style={styles.completeRow}>
            <Text style={styles.completeLabel}>Job Profile {pct}% complete</Text>
            <Pressable onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.bar}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
        </Card>

        <Card>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Open to work</Text>
              <Text style={styles.switchSub}>Let employers find you</Text>
            </View>
            <Switch thumbColor={COLORS.primaryLight} value={openToWork} onValueChange={toggle} trackColor={{ true: COLORS.primary }} />
          </View>
        </Card>

        <View style={styles.menu}>
          <MenuItem icon="document-text-outline" label="My Applications" onPress={() => navigation.navigate('Applications')} />
          <MenuItem icon="bookmark-outline" label="Saved Jobs" onPress={() => navigation.navigate('Saved')} />
          <MenuItem icon="shield-checkmark-outline" label="Basic Details " onPress={() => navigation.navigate('basicdetails')} />

          <MenuItem icon="create-outline" label="Job Profile & Resume" onPress={() => navigation.navigate('EditProfile')} />

          <MenuItem icon="help-buoy-outline" label="Help & Support" onPress={() => navigation.navigate('Support')} />
          <MenuItem icon="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} />
          <MenuItem icon="log-out-outline" label="Logout" danger onPress={() => logout()} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function MenuItem({ icon, label, onPress, danger }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: COLORS.gray50 }]}>
      <View style={[styles.menuIcon, danger && { backgroundColor: COLORS.dangerLight }]}>
        <Ionicons name={icon} size={18} color={danger ? COLORS.danger : COLORS.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.gray300} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  headerCard: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg },
  name: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text },
  phone: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  completeCard: { gap: SPACING.sm },
  completeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completeLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  editLink: { color: COLORS.primary, fontWeight: '700' },
  bar: { height: 8, borderRadius: 4, backgroundColor: COLORS.gray200, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  switchSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  menu: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  menuIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
});
