import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';
import { jobseekerApi } from '../../api/jobseeker.api';
import { useFetch } from '../../hooks/useFetch';
import { APPLICATION_STATUS } from '../../constants/config';
import { Loader, Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui';

export default function DashboardScreen({ navigation }) {
  const { data, loading, refetch } = useFetch(() => jobseekerApi.dashboard(), []);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch().catch(() => {}); setRefreshing(false);
  }, [refetch]);

  if (loading && !data) return <Screen><Header title="Dashboard" /><Loader /></Screen>;

  const byStatus = data?.applicationsByStatus || {};

  return (
    <Screen>
      <Header title="Dashboard" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.statGrid}>
          <StatBox icon="document-text" label="Applications" value={data?.totalApplications || 0} color={COLORS.primary} />
          <StatBox icon="bookmark" label="Saved Jobs" value={data?.savedJobs || 0} color={COLORS.secondary} />
          <StatBox icon="trending-up" label="Profile" value={`${data?.profileCompleteness || 0}%`} color={COLORS.accent} />
          <StatBox icon="eye" label="Open to work" value={data?.isOpenToWork ? 'Yes' : 'No'} color={COLORS.success} />
        </View>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Application Status</Text>
          {Object.keys(byStatus).length === 0 ? (
            <Text style={styles.muted}>No applications yet</Text>
          ) : (
            Object.entries(byStatus).map(([k, v]) => {
              const s = APPLICATION_STATUS[k] || { label: k, color: COLORS.gray500 };
              return (
                <View key={k} style={styles.statusRow}>
                  <View style={[styles.dot, { backgroundColor: s.color }]} />
                  <Text style={styles.statusLabel}>{s.label}</Text>
                  <Text style={styles.statusCount}>{v}</Text>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  statBox: { width: '47%', flexGrow: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, gap: SPACING.sm, ...SHADOWS.sm },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  muted: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text },
  statusCount: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
});
