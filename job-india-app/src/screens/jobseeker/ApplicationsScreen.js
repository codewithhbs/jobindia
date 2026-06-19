import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Loader, EmptyState } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { ApplicationCard } from '../../components/cards/JobCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { useFetch } from '../../hooks/useFetch';

const ACTIVE_STATUSES = ['applied', 'reviewing', 'shortlisted', 'interview'];
const CLOSED_STATUSES = ['selected', 'rejected', 'withdrawn'];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In progress' },
  { key: 'closed', label: 'Closed' },
];

export default function ApplicationsScreen({ navigation }) {
  const { data, loading, refetch } = useFetch(() => jobsApi.myApplications({ limit: 50 }), []);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch().catch(() => { }); setRefreshing(false);
  }, [refetch]);

  const apps = data?.data || [];

  const stats = useMemo(() => {
    const active = apps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;
    const selected = apps.filter((a) => a.status === 'selected').length;
    return { total: apps.length, active, selected };
  }, [apps]);

  const filteredApps = useMemo(() => {
    if (filter === 'active') return apps.filter((a) => ACTIVE_STATUSES.includes(a.status));
    if (filter === 'closed') return apps.filter((a) => CLOSED_STATUSES.includes(a.status));
    return apps;
  }, [apps, filter]);

  return (
    <Screen>

      <Header
      onBack={()=>navigation.goBack()}
       title="My Applications" />
      <FlatList
        data={filteredApps}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListHeaderComponent={
          apps.length > 0 ? (
            <>
              <StatsRow stats={stats} />
              <FilterChips filter={filter} onChange={setFilter} />
            </>
          ) : null
        }
        renderItem={({ item }) => (
          <ApplicationCard application={item} onPress={() => item.jobId?._id && navigation.navigate('JobDetail', { jobId: item.jobId._id })} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListEmptyComponent={
          loading ? (
            <Loader text="Loading your applications..." />
          ) : apps.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="No applications yet"
              subtitle="Jobs you apply to will show up here, with live status updates as recruiters review them."
              actionLabel="Browse jobs"
              onAction={() => navigation.navigate('Jobs')}
            />
          ) : (
            <View style={styles.noFilterMatch}>
              <Ionicons name="filter-outline" size={28} color={COLORS.textLight} />
              <Text style={styles.noFilterMatchText}>No applications in this category</Text>
            </View>
          )
        }
      />
    </Screen>
  );
}

function StatsRow({ stats }) {
  return (
    <View style={styles.statsRow}>
      <StatCard icon="paper-plane-outline" value={stats.total} label="Total" color={COLORS.primary} />
      <StatCard icon="hourglass-outline" value={stats.active} label="In progress" color={COLORS.accent} />
      <StatCard icon="checkmark-circle-outline" value={stats.selected} label="Selected" color={COLORS.success} />
    </View>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterChips({ filter, onChange }) {
  return (
    <View style={styles.chipsRow}>
      {FILTERS.map((f) => {
        const active = filter === f.key;
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: SPACING.lg, flexGrow: 1 },

  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    gap: 4,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textAlign: 'center' },

  chipsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },

  noFilterMatch: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xxl,
  },
  noFilterMatchText: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
});