import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Loader, EmptyState, Card, Avatar, Badge } from '../../components/ui';
import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { useFetch } from '../../hooks/useFetch';
import { APPLICATION_STATUS } from '../../constants/config';
import { timeAgo } from '../../utils/format';
import { toast } from '../../utils/toast';

const NEXT = { applied: 'shortlisted', shortlisted: 'interview_scheduled', interview_scheduled: 'hired' };

export function JobApplicantsScreen({ route, navigation }) {
  const { jobId, title } = route.params;
  const { data, loading, refetch } = useFetch(() => jobsApi.jobApplications(jobId, { limit: 50 }), []);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch().catch(() => {}); setRefreshing(false); }, [refetch]);

  const advance = async (app) => {
    const next = NEXT[app.status];
    if (!next) return;
    try { await jobsApi.updateApplicationStatus(app._id, { status: next }); toast.success('Updated', `Moved to ${next}`); refetch(); }
    catch (e) { toast.error('Error', e.message); }
  };
  const reject = async (app) => {
    try { await jobsApi.updateApplicationStatus(app._id, { status: 'rejected' }); refetch(); }
    catch (e) { toast.error('Error', e.message); }
  };

  const apps = data?.data || [];
  return (
    <Screen>
      <Header title="Applicants" subtitle={title} onBack={() => navigation.goBack()} />
      <FlatList
        data={apps}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => {
          const s = APPLICATION_STATUS[item.status] || { label: item.status, color: COLORS.gray500 };
          return (
            <Card style={{ gap: SPACING.md }}>
              <View style={styles.row}>
                <Avatar name={item.applicantName || 'Candidate'} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.applicantName || 'Candidate'}</Text>
                  <Text style={styles.meta}>{item.applicantPhone || ''} · {timeAgo(item.appliedAt)}</Text>
                </View>
                <Badge label={s.label} color={s.color} />
              </View>
              {item.status !== 'rejected' && item.status !== 'hired' && (
                <View style={styles.actions}>
                  {NEXT[item.status] && (
                    <Pressable style={[styles.actBtn, { backgroundColor: COLORS.primaryLight }]} onPress={() => advance(item)}>
                      <Ionicons name="arrow-forward-circle-outline" size={16} color={COLORS.primary} />
                      <Text style={[styles.actText, { color: COLORS.primary }]}>{NEXT[item.status].replace('_', ' ')}</Text>
                    </Pressable>
                  )}
                  <Pressable style={[styles.actBtn, { backgroundColor: COLORS.dangerLight }]} onPress={() => reject(item)}>
                    <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                    <Text style={[styles.actText, { color: COLORS.danger }]}>Reject</Text>
                  </Pressable>
                </View>
              )}
            </Card>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="people-outline" title="No applicants yet" subtitle="Applications will show up here" />}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  list: { padding: SPACING.lg, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  name: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 10 },
  actText: { fontSize: FONTS.sizes.sm, fontWeight: '700', textTransform: 'capitalize' },
});
