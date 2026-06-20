import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { jobseekerApi } from '../../api/jobseeker.api';
import { useFetch } from '../../hooks/useFetch';
import { formatSalary, jobLocation } from '../../utils/format';
import { JOB_TYPES } from '../../constants/config';
import { toast } from '../../utils/toast';
import { Alert } from '../../components/ui/AppAlert';
import { Header } from '../../components/ui/Header';
import { Loader, Screen } from '../../components/ui/Screen';
import { Avatar, Badge } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

export default function JobDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const { jobId } = route.params;

  const { data: job, loading } = useFetch(() => jobsApi.get(jobId), [jobId]);
  const { data: profile } = useFetch(() => jobseekerApi.me(), []);

  // `profile` is the jobseeker doc itself (completeness, resume, etc live here).
  // `account` is the embedded auth user (role, name, isProfileComplete live here).
  const account = profile?.userId ?? authUser ?? null;

  const [applying, setApplying] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (job?.applied) setApplied(true);
  }, [job]);

  if (loading || !job) {
    return (
      <Screen>
        <Header title="Job Details" onBack={() => navigation.goBack()} />
        <Loader text="Loading..." />
      </Screen>
    );
  }

  const apply = async () => {
    setApplying(true);
    try {
      await jobsApi.apply(jobId, {});
      setApplied(true);
      toast.success('Applied!', 'Your application was submitted');
    } catch (e) {
      if (e.status === 409) {
        setApplied(true);
        toast.info('Already applied to this job');
      } else {
        toast.error('Could not apply', e.message);
      }
    } finally {
      setApplying(false);
    }
  };

  // Lets the alert's "Upload Resume" button pick + upload a file, then
  // automatically continue into the actual apply() call on success.
  const pickResumeAndApply = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets[0];
      setUploadingResume(true);
      const fd = new FormData();
      fd.append('resume', { uri: file.uri, name: file.name, type: file.mimeType || 'application/pdf' });
      await jobseekerApi.uploadResume(fd);
      toast.success('Resume uploaded');
      await apply();
    } catch (e) {
      toast.error('Upload failed', e.message);
    } finally {
      setUploadingResume(false);
    }
  };

  // Resume check happens regardless of profile completeness — this is the
  // shared "final step" before actually applying.
  const checkResumeThenApply = () => {
    const hasResume = !!profile?.resume?.uploadedAt;

    if (!hasResume) {
      Alert.show({
        variant: 'info',
        icon: 'document-attach-outline',
        title: 'Add your resume',
        message: 'Upload a CV so this employer can review your application properly. This only takes a few seconds.',
        buttons: [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upload Resume', style: 'primary', onPress: pickResumeAndApply },
        ],
      });
      return;
    }

    apply();
  };

  const handleApplyPress = () => {
    if (!profile) return; // wait for the profile fetch to resolve

    const isProfileComplete = account?.isProfileComplete;
    const completeness = profile.profileCompleteness ?? 0;

    // Under 70% (or flagged incomplete) -> nudge them to finish the profile,
    // but "Later" still lets them go straight to the resume check + apply.
    if (!isProfileComplete || completeness < 70) {
      Alert.show({
        variant: 'warning',
        icon: 'person-circle-outline',
        title: 'Complete your profile',
        message: `Your profile is only ${completeness}% complete. A complete profile gets noticed faster by employers — finish it before applying, or continue for now.`,
        buttons: [
          { text: 'Later', style: 'cancel', onPress: checkResumeThenApply },
          { text: 'Complete Profile', style: 'primary', onPress: () => navigation.navigate('EditProfile') },
        ],
      });
      return;
    }

    checkResumeThenApply();
  };

  const typeLabel = JOB_TYPES.find((t) => t.value === job.jobType)?.label || job.jobType;
  const isEmployer = account?.role === 'employer';
  const showCompletenessBanner = !!profile && !account?.isProfileComplete;
  const applyBusy = applying || uploadingResume;

  return (
    <Screen edges={['top']} noPadding>
      <Header title="Job Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {showCompletenessBanner && (
          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            style={({ pressed }) => [styles.completeBanner, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="alert-circle" size={18} color={COLORS.accent} />
            <Text style={styles.completeBannerText}>
              Your profile is {profile?.profileCompleteness ?? 0}% complete — finish it to apply faster
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
          </Pressable>
        )}

        <View style={styles.card}>
          <View style={styles.top}>
            <Avatar uri={job.companyLogo} name={job.companyName || job.title} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{job.title}</Text>
              <Text style={styles.company}>{job.companyName || 'Company'}</Text>
            </View>
          </View>
          <View style={styles.tags}>
            <Badge label={typeLabel} color={COLORS.secondary} />
            {job.category ? <Badge label={job.category} color={COLORS.primary} /> : null}
            {job.location?.isRemote ? <Badge label="Remote" color={COLORS.accent} /> : null}
          </View>
        </View>

        <View style={styles.statRow}>
          <Stat icon="cash-outline" label="Salary" value={formatSalary(job.salary)} />
          <Stat icon="location-outline" label="Location" value={jobLocation(job.location) || '—'} />
          <Stat icon="people-outline" label="Openings" value={String(job.vacancies || 1)} />
        </View>

        <Section title="Job Description">
          <Text style={styles.body}>{job.description}</Text>
        </Section>

        {job.requirements?.skills?.length ? (
          <Section title="Skills Required">
            <View style={styles.tags}>
              {job.requirements.skills.map((s) => <Badge key={s} label={s} color={COLORS.primary} />)}
            </View>
          </Section>
        ) : null}

        {job.benefits?.length ? (
          <Section title="Benefits">
            {job.benefits.map((b) => (
              <View key={b} style={styles.bullet}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.body}>{b}</Text>
              </View>
            ))}
          </Section>
        ) : null}
      </ScrollView>

      {!isEmployer && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
          <Button
            title={applied ? 'Applied ✓' : uploadingResume ? 'Uploading resume...' : 'Apply Now'}
            onPress={handleApplyPress}
            loading={applyBusy}
            disabled={applied || !profile}
            size="md"
          />
        </View>
      )}
    </Screen>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 120 },

  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#F3DDAF',
    padding: SPACING.md,
  },
  completeBannerText: { flex: 1, fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text },
  company: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginTop: 2 },
  tags: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },

  statRow: { flexDirection: 'row', gap: SPACING.md },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },

  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  body: { fontSize: FONTS.sizes.md, color: COLORS.gray600, lineHeight: 22, flex: 1 },
  bullet: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingTop: SPACING.md, paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
});