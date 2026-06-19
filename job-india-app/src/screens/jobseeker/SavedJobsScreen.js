import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Screen, Loader, EmptyState } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { JobCard } from '../../components/cards/JobCard';
import { COLORS, SPACING } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { useFetch } from '../../hooks/useFetch';
import { toast } from '../../utils/toast';

export default function SavedJobsScreen({ navigation }) {
  const { data, loading, refetch } = useFetch(() => jobsApi.savedJobs(), []);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch().catch(() => {}); setRefreshing(false);
  }, [refetch]);

  const unsave = async (id) => {
    try { await jobsApi.save(id); refetch(); } catch (e) { toast.error('Error', e.message); }
  };

  return (
    <Screen>
      <Header title="Saved Jobs" />
      <FlatList
        data={data || []}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <JobCard job={item} saved onSave={() => unsave(item._id)} onPress={() => navigation.navigate('JobDetail', { jobId: item._id })} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="bookmark-outline" title="No saved jobs" subtitle="Tap the bookmark on any job to save it" />}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({ list: { padding: SPACING.lg, flexGrow: 1 } });
