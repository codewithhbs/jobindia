import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
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
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
const DEFAULT_SUPPORT_NUMBER = '+911234567890'; // ✅ apna default support number daal de


function formatSalaryDisplay(salary) {
  if (!salary) return 'Not disclosed';
  const { min, max, currency = '₹', period = 'month' } = salary;
  if (!min && !max) return 'Not disclosed';
  if (min && max) return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()} / ${period}`;
  if (min) return `${currency}${min.toLocaleString()}+ / ${period}`;
  return `Up to ${currency}${max.toLocaleString()} / ${period}`;
}

function formatLocationDisplay(location) {
  if (!location) return 'Not specified';
  const parts = [location.city, location.state].filter(Boolean);
  if (location.isRemote) return parts.length ? `Remote • ${parts.join(', ')}` : 'Remote';
  return parts.length ? parts.join(', ') : 'Not specified';
}
export default function JobDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const { jobId } = route.params;

  const { data: job, loading } = useFetch(() => jobsApi.get(jobId), [jobId]);
  const { data: profile, refetch } = useFetch(() => jobseekerApi.me(), [navigation]);

  // `profile` is the jobseeker doc itself (completeness, resume, etc live here).
  // `account` is the embedded auth user (role, name, isProfileComplete, kyc fields live here).
  const account = profile?.userId ?? authUser ?? null;

  const [applying, setApplying] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (job?.applied) setApplied(true);
  }, [job]);

  const isDriver = account?.role === 'driver';
  const isEmployer = account?.role === 'employer';

  // ✅ driver gate: KYC status based
  const isKYCVerified = !!account?.isKYCVerified;
  const kycStatus = account?.kycStatus; // 'pending' | 'rejected' | 'approved'

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

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

  // ✅ resume step sirf jobseeker ke liye, driver direct apply
  const checkResumeThenApply = () => {
    if (isDriver) {
      apply();
      return;
    }

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

  // ✅ driver -> kyc screen, others -> EditProfile
  const goToCompleteProfile = () => {
    if (isDriver) {

      navigation.navigate('Kyc');
    } else {
      navigation.navigate('EditProfile');
    }
  };

  const handleApplyPress = () => {
    if (!profile) return; // wait for the profile fetch to resolve

    if (isDriver) {
      // driver: KYC status based gate, no % completeness
      if (!isKYCVerified) {
        if (kycStatus === 'rejected') {
          Alert.show({
            variant: 'error',
            icon: 'close-circle-outline',
            title: 'KYC Rejected',
            message: 'Your KYC verification was rejected. Please resubmit your documents to apply for jobs.',
            buttons: [
              { text: 'Later', style: 'cancel' },
              { text: 'Resubmit KYC', style: 'primary', onPress: () => navigation.navigate('kyc') },
            ],
          });
        } else {
          // pending or not submitted
          Alert.show({
            variant: 'warning',
            icon: 'time-outline',
            title: 'KYC Pending',
            message: 'Your KYC verification is still under review. You can apply once it’s approved.',
            buttons: [
              { text: 'OK', style: 'cancel' },
              { text: 'View KYC', style: 'primary', onPress: () => navigation.navigate('kyc') },
            ],
          });
        }
        return;
      }

      checkResumeThenApply();
      return;
    }

    // jobseeker: profile completeness % based flow
    const isProfileComplete = account?.isProfileComplete;
    const completeness = profile.profileCompleteness ?? 0;

    if (!isProfileComplete || completeness < 70) {
      Alert.show({
        variant: 'warning',
        icon: 'person-circle-outline',
        title: 'Complete your profile',
        message: `Your profile is only ${completeness}% complete. A complete profile gets noticed faster by employers — finish it before applying, or continue for now.`,
        buttons: [
          { text: 'Later', style: 'cancel', onPress: checkResumeThenApply },
          { text: 'Complete Profile', style: 'primary', onPress: goToCompleteProfile },
        ],
      });
      return;
    }

    checkResumeThenApply();
  };

  // ✅ company / call card logic
  const hasCompany = !!(job.companyName || job.companyPhone);
  const callNumber = job.companyPhone || DEFAULT_SUPPORT_NUMBER;

  const handleCall = () => {
    Linking.openURL(`tel:${callNumber}`).catch(() =>
      toast.error('Could not open dialer')
    );
  };

  const typeLabel = JOB_TYPES.find((t) => t.value === job.jobType)?.label || job.jobType;

  // ✅ banner: driver -> KYC based, jobseeker -> % based
  const showCompletenessBanner = isDriver
    ? !isKYCVerified
    : (!!profile && !account?.isProfileComplete);

  const applyBusy = applying || uploadingResume;

  return (
    <Screen edges={['top']} noPadding>
      <Header title="Job Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {showCompletenessBanner && (
          <Pressable
            onPress={goToCompleteProfile}
            style={({ pressed }) => [styles.completeBanner, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="alert-circle" size={18} color={COLORS.accent} />
            <Text style={styles.completeBannerText}>
              {isDriver
                ? (kycStatus === 'rejected'
                  ? 'Your KYC was rejected — resubmit to apply for jobs'
                  : 'Your KYC is pending review — you can apply once approved')
                : `Your profile is ${profile?.profileCompleteness ?? 0}% complete — finish it to apply faster`}
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

        {/* ✅ Company details + call, ya default support call */}
        <View style={styles.card}>
          {hasCompany ? (
            <View style={styles.companyRow}>
              <Avatar uri={job.companyLogo} name={job.companyName || job.title} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{job.companyName || 'Company'}</Text>
                {job.companyPhone ? (
                  <Text style={styles.companyPhone}>{job.companyPhone}</Text>
                ) : (
                  <Text style={styles.companyPhone}>Contact via support</Text>
                )}
              </View>
              <Pressable onPress={handleCall} style={styles.callBtn}>
                <Ionicons name="call" size={18} color={COLORS.surface} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.companyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>Need help with this job?</Text>
                <Text style={styles.companyPhone}>Call our support team</Text>
              </View>
              <Pressable onPress={handleCall} style={styles.callBtn}>
                <Ionicons name="call" size={18} color={COLORS.surface} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.statRow}>
          <Stat icon="cash-outline" label="Salary" value={formatSalaryDisplay(job.salary)} />
          <Stat icon="location-outline" label="Location" value={formatLocationDisplay(job.location)} />
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
      <Text style={styles.statValue} numberOfLines={4}>{value}</Text>
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

  companyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  companyName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  companyPhone: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  callBtn: {
    backgroundColor: COLORS.success,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

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