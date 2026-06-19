import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Screen, Loader, EmptyState } from '../../components/ui';
import { Header } from '../../components/ui/Header';
import { JobCard } from '../../components/cards/JobCard';
import { COLORS, SPACING } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { useFetch } from '../../hooks/useFetch';

export function MyJobsScreen({ navigation }) {
  const { data, loading, refetch } = useFetch(() => jobsApi.myJobs({ limit: 50 }), []);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch().catch(() => {}); setRefreshing(false); }, [refetch]);

  const jobs = data?.data || [];
  return (
    <Screen>
      <Header title="My Job Postings" onBack={() => navigation.goBack()} />
      <FlatList
        data={jobs}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobApplicants', { jobId: item._id, title: item.title })} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="briefcase-outline" title="No jobs posted" subtitle="Tap Post a Job to create your first listing" />}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({ list: { padding: SPACING.lg, flexGrow: 1 } });
