import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';
import { employerApi } from '../../api/employer.api';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import { Loader, Screen } from '../../components/ui/Screen';
import { Badge, Card } from '../../components/ui';
import { Button } from '../../components/ui/Button';

export default function EmployerDashboardScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const { data, loading, refetch } = useFetch(() => employerApi.dashboard(), []);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch().catch(() => {}); setRefreshing(false);
  }, [refetch]);

  if (loading && !data) return <Screen><Loader text="Loading..." /></Screen>;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>Hi, {user?.name || 'Recruiter'} 👋</Text>
            <Text style={styles.sub}>Manage your hiring</Text>
          </View>
          <Badge label={(data?.subscriptionPlan || 'free').toUpperCase()} color={COLORS.accent} />
        </View>

        <View style={styles.statGrid}>
          <StatBox icon="briefcase" label="Total Jobs" value={data?.totalJobs || 0} color={COLORS.primary} />
          <StatBox icon="flash" label="Active" value={data?.activeJobs || 0} color={COLORS.secondary} />
          <StatBox icon="people" label="Applicants" value={data?.totalApplications || 0} color={COLORS.accent} />
          <StatBox icon="sparkles" label="New" value={data?.newApplications || 0} color={COLORS.success} />
        </View>

        <Button title="Post a New Job" icon="add-circle-outline" size="lg" onPress={() => navigation.navigate('PostJob')} />

        <Card style={{ gap: SPACING.sm }}>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('MyJobs')}>
            <Ionicons name="list-outline" size={20} color={COLORS.primary} />
            <Text style={styles.linkText}>My Job Postings</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray300} />
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('EmployerProfile')}>
            <Ionicons name="business-outline" size={20} color={COLORS.primary} />
            <Text style={styles.linkText}>Company Profile {data?.verificationStatus === 'approved' ? '✓' : ''}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray300} />
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Plans')}>
            <Ionicons name="rocket-outline" size={20} color={COLORS.accent} />
            <Text style={styles.linkText}>Upgrade Plan</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray300} />
          </Pressable>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}><Ionicons name={icon} size={20} color={color} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greet: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  statBox: { width: '47%', flexGrow: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, gap: SPACING.sm, ...SHADOWS.sm },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  linkText: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
});
