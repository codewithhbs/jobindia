import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Loader, EmptyState } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { useFetch } from '../../hooks/useFetch';
import { toast } from '../../utils/toast';
import { Chip } from '../../components/ui';
import { EmployerJobCard } from '../../components/cards/EmployerJobCard';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', value: undefined },
  { key: 'active', label: 'Active', value: 'active' },
  { key: 'paused', label: 'Paused', value: 'paused' },
  { key: 'closed', label: 'Closed', value: 'closed' },
  { key: 'draft', label: 'Draft', value: 'draft' },
  { key: 'expired', label: 'Expired', value: 'expired' },
];

export function MyJobsScreen({ navigation }) {
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchParams = useMemo(() => {
    const params = { limit: 50 };
    const selected = STATUS_FILTERS.find((f) => f.key === statusFilter);
    if (selected?.value) params.status = selected.value;
    return params;
  }, [statusFilter]);

  const { data, loading, refetch } = useFetch(() => jobsApi.myJobs(fetchParams), [fetchParams]);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch().catch(() => {});
    setRefreshing(false);
  }, [refetch]);

  const jobs = data?.data || [];
  const total = data?.pagination?.total ?? jobs.length;

  const handleDelete = async (jobId) => {
    setDeletingId(jobId);
    try {
      await jobsApi.remove(jobId);
      toast.success('Deleted', 'Job posting removed');
      refetch();
    } catch (e) {
      toast.error('Could not delete', e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Screen style={{paddingBottom:15}} edges={['top']} noPadding>
      <Header
        title="My Job Postings"
        onBack={() => navigation.goBack()}
        right={
          <Pressable style={styles.addBtn} onPress={() => navigation.navigate('PostJob')}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </Pressable>
        }
      />

      {/* Status filter chips — wraps, no scroll */}
      <View style={styles.filterWrap}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            active={statusFilter === f.key}
            onPress={() => setStatusFilter(f.key)}
          />
        ))}
      </View>

      {!loading && jobs.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {total} {total === 1 ? 'job' : 'jobs'}
            {statusFilter !== 'all' ? ` · ${STATUS_FILTERS.find((f) => f.key === statusFilter)?.label}` : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={jobs}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <EmployerJobCard
            job={item}
            onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
            onViewApplicants={() => navigation.navigate('JobApplicants', { jobId: item._id, title: item.title })}
            onEdit={() => navigation.navigate('PostJob', { id: item._id })}
            onDelete={() => handleDelete(item._id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListEmptyComponent={
          loading ? (
            <Loader />
          ) : (
            <EmptyState
              icon="briefcase-outline"
              title={statusFilter === 'all' ? 'No jobs posted' : `No ${statusFilter} jobs`}
              subtitle={
                statusFilter === 'all'
                  ? 'Tap the + button to create your first listing'
                  : 'Try a different filter or post a new job'
              }
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: SPACING.lg, flexGrow: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${COLORS.primary}14`,
  },

  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  countBar: { paddingHorizontal: SPACING.lg, paddingBottom: 4 },
  countText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
});