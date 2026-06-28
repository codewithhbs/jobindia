import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { useFetch } from '../../hooks/useFetch';
import { APPLICATION_STATUS, BASE_API_URL } from '../../constants/config';
import { toast } from '../../utils/toast';
import { EmptyState, Loader, Screen } from '../../components/ui/Screen';
import { Avatar, Badge } from '../../components/ui';

const BASE_SERVER =BASE_API_URL;
const NEXT = { applied: 'shortlisted', shortlisted: 'interview_scheduled', interview_scheduled: 'hired' };

function fileUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE_SERVER}${path}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function experienceSummary(profile) {
  const months = profile?.totalExperienceMonths;
  if (months == null) return null;
  if (months < 12) return `${months} mo experience`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m experience` : `${years}y experience`;
}

export function JobApplicantsScreen({ route, navigation }) {
  const { jobId, title } = route.params;
  const { data, loading, refetch } = useFetch(() => jobsApi.jobApplications(jobId, { limit: 50 }), []);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch().catch(() => { });
    setRefreshing(false);
  }, [refetch]);

  const advance = async (app) => {
    const next = NEXT[app.status];
    if (!next) return;
    try {
      await jobsApi.updateApplicationStatus(app._id, { status: next });
      toast.success('Updated', `Moved to ${next.replace('_', ' ')}`);
      refetch();
    } catch (e) {
      toast.error('Error', e.message);
    }
  };

  const reject = async (app) => {
    try {
      await jobsApi.updateApplicationStatus(app._id, { status: 'rejected' });
      refetch();
    } catch (e) {
      toast.error('Error', e.message);
    }
  };

  const callApplicant = (phone) => {
    if (!phone) return toast.error('No phone number available');
    Linking.openURL(`tel:${phone}`);
  };

  const openResume = (resume) => {
    const url = fileUrl(resume?.fileUrl);
    if (!url) return toast.error('No resume uploaded');
    Linking.openURL(url);
  };

  const downloadExcel = () => {
    const url = `${BASE_SERVER}/api/v1/jobs/${jobId}/applications/export`;
    Linking.openURL(url).catch(() => toast.error('Could not open download link'));
  };

  const apps = data?.data || [];

  return (
    <Screen edges={['top']} noPadding>
      <Header
        title="Applicants"
        subtitle={title}
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={downloadExcel} style={styles.downloadBtn} hitSlop={8}>
            <Ionicons name="download-outline" size={20} color={COLORS.primary} />
          </Pressable>
        }
      />

      {!loading && apps.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {apps.length} {apps.length === 1 ? 'applicant' : 'applicants'}
          </Text>
        </View>
      )}

      <FlatList
        data={apps}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => {
          const applicant = item.applicantId || {};
          const profile = item.profile || {};
          const s = APPLICATION_STATUS[item.status] || { label: item.status, color: COLORS.gray500 };
          const hasResume = !!profile.resume?.uploadedAt;
          const expSummary = experienceSummary(profile);
          const skills = profile.skills || [];
          const canAct = item.status !== 'rejected' && item.status !== 'hired';

          return (
            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.touchArea, pressed && styles.pressed]}
                onPress={() => navigation.navigate('ApplicantProfile', { applicationId: applicant._id })}
              >
                <View style={styles.topRow}>
                  <Avatar uri={fileUrl(applicant.avatar)} name={applicant.name || 'Candidate'} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{applicant.name || 'Candidate'}</Text>
                    {profile.headline ? (
                      <Text style={styles.headline} numberOfLines={1}>{profile.headline}</Text>
                    ) : null}
                  </View>
                  <Badge label={s.label} color={s.color} />
                </View>

                <View style={styles.infoRow}>
                  {expSummary && (
                    <View style={styles.infoItem}>
                      <Ionicons name="briefcase-outline" size={13} color={COLORS.textSecondary} />
                      <Text style={styles.infoText}>{expSummary}</Text>
                    </View>
                  )}
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>Applied {timeAgo(item.appliedAt)}</Text>
                  </View>
                </View>

                {skills.length > 0 && (
                  <View style={styles.skillsRow}>
                    {skills.slice(0, 4).map((sk) => (
                      <View key={sk} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{sk}</Text>
                      </View>
                    ))}
                    {skills.length > 4 && (
                      <View style={styles.skillChip}>
                        <Text style={styles.skillChipText}>+{skills.length - 4}</Text>
                      </View>
                    )}
                  </View>
                )}

                <Pressable
                  style={[styles.resumeRow, !hasResume && styles.resumeRowDisabled]}
                  onPress={() => hasResume && openResume(profile.resume)}
                  disabled={!hasResume}
                >
                  <Ionicons
                    name={hasResume ? 'document-text' : 'document-outline'}
                    size={15}
                    color={hasResume ? COLORS.primary : COLORS.textLight}
                  />
                  <Text style={[styles.resumeText, hasResume && { color: COLORS.primary }]}>
                    {hasResume ? 'View resume' : 'No resume uploaded'}
                  </Text>
                  {hasResume && <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />}
                </Pressable>
              </Pressable>

              <View style={styles.divider} />

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actBtn, styles.callBtn]}
                  onPress={() => callApplicant(applicant.phone)}
                >
                  <Ionicons name="call" size={15} color={COLORS.success} />
                  <Text style={[styles.actText, { color: COLORS.success }]}>Call</Text>
                </Pressable>

                <Pressable
                  style={[styles.actBtn, styles.detailsBtn]}
                  onPress={() => navigation.navigate('ApplicantProfile', { applicationId: applicant._id })}
                >
                  <Ionicons name="person-outline" size={15} color={COLORS.primary} />
                  <Text style={[styles.actText, { color: COLORS.primary }]}>View Details</Text>
                </Pressable>

                {canAct && NEXT[item.status] && (
                  <Pressable style={[styles.actBtn, styles.advanceBtn]} onPress={() => advance(item)}>
                    <Ionicons name="arrow-forward-circle-outline" size={15} color={COLORS.primary} />
                  </Pressable>
                )}
                {canAct && (
                  <Pressable style={[styles.actBtn, styles.rejectBtn]} onPress={() => reject(item)}>
                    <Ionicons name="close-circle-outline" size={15} color={COLORS.danger} />
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListEmptyComponent={
          loading ? (
            <Loader />
          ) : (
            <EmptyState icon="people-outline" title="No applicants yet" subtitle="Applications will show up here" />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: SPACING.lg, flexGrow: 1 },
  countBar: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 4 },
  countText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },

  downloadBtn: {
    width: 36, height: 36, borderRadius: RADIUS.md || 10,
    backgroundColor: `${COLORS.primary}14`,
    alignItems: 'center', justifyContent: 'center',
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl || 18,
    padding: SPACING.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  touchArea: { gap: SPACING.sm },
  pressed: { opacity: 0.96 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  name: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.text },
  headline: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },

  infoRow: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '500' },

  skillsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  skillChip: {
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 8,
  },
  skillChipText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },

  resumeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 10,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: RADIUS.md || 10,
  },
  resumeRowDisabled: { backgroundColor: '#F8FAFC' },
  resumeText: { flex: 1, fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textLight },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: SPACING.sm },

  actions: { flexDirection: 'row', gap: SPACING.sm },
  actBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderRadius: RADIUS.md || 10,
  },
  callBtn: { backgroundColor: '#22C55E14', flex: 1 },
  detailsBtn: { backgroundColor: `${COLORS.primary}14`, flex: 1.3 },
  advanceBtn: { backgroundColor: `${COLORS.primary}14`, paddingHorizontal: 12 },
  rejectBtn: { backgroundColor: COLORS.dangerLight || '#FEF2F2', paddingHorizontal: 12 },
  actText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
});