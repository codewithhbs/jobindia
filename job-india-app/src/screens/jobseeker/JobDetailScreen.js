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
import { BASE_API_URL, JOB_TYPES } from '../../constants/config';
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
  if (salary.isHidden) return 'Not disclosed';
  const { min, max, currency = 'INR', period = 'monthly' } = salary;
  if (!min && !max) return 'Not disclosed';
  const symbol = currency === 'INR' ? '₹' : `${currency} `;
  if (min && max) return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()} / ${period}`;
  if (min) return `${symbol}${min.toLocaleString()}+ / ${period}`;
  return `Up to ${symbol}${max.toLocaleString()} / ${period}`;
}

function formatLocationDisplay(location) {
  if (!location) return 'Not specified';
  const parts = [location.city, location.state].filter(Boolean);
  if (location.isRemote) return parts.length ? `Remote • ${parts.join(', ')}` : 'Remote';
  return parts.length ? parts.join(', ') : 'Not specified';
}

function experienceLabel(exp) {
  if (!exp) return 'Any experience';
  const { min, max, unit = 'years' } = exp;
  if (!min && !max) return 'Fresher welcome';
  if (min && max) return `${min}–${max} ${unit} experience`;
  if (min) return `${min}+ ${unit} experience`;
  return `Up to ${max} ${unit} experience`;
}

function formatDateDisplay(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Days left/expired for expiry countdown ──
function daysUntil(d) {
  if (!d) return null;
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function expiryMeta(d) {
  const days = daysUntil(d);
  if (days === null) return null;
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, color: COLORS.danger || '#EF4444' };
  if (days === 0) return { label: 'Expires today', color: COLORS.danger || '#EF4444' };
  if (days <= 3) return { label: `${days}d left to apply`, color: COLORS.warning || '#F59E0B' };
  return { label: `${days}d left to apply`, color: COLORS.success || '#22C55E' };
}

function educationLabel(v) {
  if (!v || v === 'none' || v === 'any') return null;
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function JobDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const { jobId } = route.params;

  const { data: job, loading } = useFetch(() => jobsApi.get(jobId), [jobId]);
  const { data: profile, refetch } = useFetch(() => jobseekerApi.me(), [navigation]);
  console.log(job)
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

  // ✅ company info now lives under employerProfile (real API shape)
  const ep = job.employerProfile || {};
  const companyName = ep.companyName || job.companyName;
  const companyLogo = ep.companyLogo
    ? (ep.companyLogo.startsWith('http') ? ep.companyLogo : `${BASE_API_URL || ''}${ep.companyLogo}`)
    : job.companyLogo;
  const companyPhone = ep.contactPerson?.phone || job.companyPhone;

  const hasCompany = !!(companyName || companyPhone);
  const callNumber = companyPhone || DEFAULT_SUPPORT_NUMBER;

  const handleCall = () => {
    Linking.openURL(`tel:${callNumber}`).catch(() =>
      toast.error('Could not open dialer')
    );
  };
  const handleWhatsapp = async () => {
    const phone = callNumber.replace(/\D/g, ""); // Remove spaces, +, etc.
    const url = `whatsapp://send?phone=91${phone}`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      Linking.openURL(url);
    } else {
      toast.error("WhatsApp is not installed");
    }
  };
  const typeLabel = JOB_TYPES.find((t) => t.value === job.jobType)?.label || job.jobType;
  const req = job.requirements || {};
  const expiry = expiryMeta(job.expiryDate);
  const educationText = educationLabel(req.education);
  const qualificationText = req.qualification && req.qualification !== 'any' ? req.qualification.replace(/_/g, ' ') : null;

  // ✅ banner: driver -> KYC based, jobseeker -> % based
  const showCompletenessBanner = isDriver
    ? !isKYCVerified
    : (!!profile && !account?.isProfileComplete);

  const applyBusy = applying || uploadingResume;

  return (
    <Screen edges={['top']} noPadding>
      <Header title="Job Details" onBack={() => navigation.goBack()} />
      {/* ✅ Free job notice */}

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
        <View style={styles.freeNotice}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
          <Text style={styles.freeNoticeText}>This job is free. Don't pay any money to anyone.</Text>
        </View>
        {/* ✅ Expiry / deadline banner */}
        {expiry && (
          <View style={[styles.expiryBanner, { backgroundColor: `${expiry.color}14`, borderColor: `${expiry.color}33` }]}>
            <Ionicons name="time-outline" size={16} color={expiry.color} />
            <Text style={[styles.expiryBannerText, { color: expiry.color }]}>{expiry.label}</Text>
            {job.applicationDeadline ? (
              <Text style={styles.expiryBannerSub}>Deadline: {formatDateDisplay(job.applicationDeadline)}</Text>
            ) : null}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.top}>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{job.title}</Text>
              <Text style={styles.company}>{companyName || 'Company'}</Text>
              {job.subCategory ? <Text style={styles.subCategory}>{job.subCategory}</Text> : null}
            </View>
            {job.isFeatured ? <Badge label="Featured" color={COLORS.accent} /> : null}
          </View>
          <View style={styles.tags}>
            <Badge label={typeLabel} color={COLORS.secondary} />
            {job.category ? <Badge label={job.category} color={COLORS.primary} /> : null}
            {job.location?.isRemote ? <Badge label="Remote" color={COLORS.accent} /> : null}
            {ep.verificationStatus === 'approved' ? <Badge label="Verified company" color={COLORS.success} /> : null}
          </View>

          {/* views / applications mini-row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.metaText}>{job.views ?? 0} views</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.metaText}>{job.applications ?? 0} applied</Text>
            </View>
            {job.vacancies ? (
              <View style={styles.metaItem}>
                <Ionicons name="briefcase-outline" size={14} color={COLORS.textLight} />
                <Text style={styles.metaText}>{job.vacancies} openings</Text>
              </View>
            ) : null}
            {job.shortlisted ? (
              <View style={styles.metaItem}>
                <Ionicons name="ribbon-outline" size={14} color={COLORS.textLight} />
                <Text style={styles.metaText}>{job.shortlisted} shortlisted</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ✅ Company details card — real employerProfile data */}
        <View style={styles.card}>
          {hasCompany ? (
            <>
              <View style={styles.companyRow}>
                <Avatar uri={companyLogo} name={companyName || job.title} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyName}>{companyName || 'Company'}</Text>
                  {companyPhone ? (
                    <Text style={styles.companyPhone}>{companyPhone}</Text>
                  ) : (
                    <Text style={styles.companyPhone}>Contact via support</Text>
                  )}
                </View>

                <Pressable onPress={handleCall} style={styles.callBtn}>
                  <Ionicons name="call" size={18} color={COLORS.surface} />
                </Pressable>
                <Pressable onPress={handleWhatsapp} style={styles.callBtn}>
                  <Ionicons name="logo-whatsapp" size={18} color={COLORS.surface} />
                </Pressable>

              </View>

              {(ep.industry || ep.companySize || ep.foundedYear) ? (
                <View style={styles.companyMetaRow}>
                  {ep.industry ? (
                    <View style={styles.companyMetaItem}>
                      <Ionicons name="layers-outline" size={14} color={COLORS.textLight} />
                      <Text style={styles.companyMetaText}>{ep.industry}</Text>
                    </View>
                  ) : null}
                  {ep.companySize ? (
                    <View style={styles.companyMetaItem}>
                      <Ionicons name="people-outline" size={14} color={COLORS.textLight} />
                      <Text style={styles.companyMetaText}>{ep.companySize} employees</Text>
                    </View>
                  ) : null}
                  {ep.foundedYear ? (
                    <View style={styles.companyMetaItem}>
                      <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
                      <Text style={styles.companyMetaText}>Since {ep.foundedYear}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {ep.description ? (
                <Text style={styles.companyDesc}>{ep.description}</Text>
              ) : null}

              {ep.address?.city ? (
                <View style={styles.companyMetaItem}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
                  <Text style={styles.companyMetaText}>
                    {[ep.address.street, ep.address.city, ep.address.pincode].filter(Boolean).join(', ')}
                  </Text>
                </View>
              ) : null}

              {ep.website ? (
                <Pressable onPress={() => Linking.openURL(ep.website)}>
                  <View style={styles.companyMetaItem}>
                    <Ionicons name="globe-outline" size={14} color={COLORS.primary} />
                    <Text style={[styles.companyMetaText, { color: COLORS.primary }]}>{ep.website}</Text>
                  </View>
                </Pressable>
              ) : null}
            </>
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
          <Stat icon="briefcase-outline" label="Experience" value={experienceLabel(req.experience)} />
        </View>

        <Section title="Job Description">
          <Text style={styles.body}>{job.description}</Text>
        </Section>

        {(req.skills?.length || req.languages?.length || req.licenseRequired || req.vehicleRequired || req.gender || educationText || qualificationText || req.ageMin || req.ageMax) ? (
          <Section title="Requirements">
            {(educationText || qualificationText) ? (
              <View style={styles.bullet}>
                <Ionicons name="school-outline" size={16} color={COLORS.text} />
                <Text style={styles.body}>
                  {[qualificationText, educationText].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ) : null}

            {(req.ageMin || req.ageMax) ? (
              <View style={styles.bullet}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.text} />
                <Text style={styles.body}>
                  Age: {req.ageMin || '—'} – {req.ageMax || '—'} years
                </Text>
              </View>
            ) : null}

            {req.skills?.length ? (
              <View style={{ gap: SPACING.xs }}>
                <Text style={styles.subLabel}>Skills</Text>
                <View style={styles.tags}>
                  {req.skills.map((s) => <Badge key={s} label={s} color={COLORS.primary} />)}
                </View>
              </View>
            ) : null}

            {req.languages?.length ? (
              <View style={{ gap: SPACING.xs }}>
                <Text style={styles.subLabel}>Languages</Text>
                <View style={styles.tags}>
                  {req.languages.map((l) => <Badge key={l} label={l} color={COLORS.secondary} />)}
                </View>
              </View>
            ) : null}

            {req.licenseRequired ? (
              <View style={styles.bullet}>
                <Ionicons name="card-outline" size={16} color={COLORS.text} />
                <Text style={styles.body}>
                  License required{req.licenseType?.length ? `: ${req.licenseType.join(', ')}` : ''}
                </Text>
              </View>
            ) : null}

            {req.vehicleRequired ? (
              <View style={styles.bullet}>
                <Ionicons name="car-outline" size={16} color={COLORS.text} />
                <Text style={styles.body}>
                  Own vehicle required{req.vehicleType?.length ? `: ${req.vehicleType.join(', ')}` : ''}
                </Text>
              </View>
            ) : null}

            {req.gender  ? (
              <View style={styles.bullet}>
                <Ionicons name="person-outline" size={16} color={COLORS.text} />
                <Text style={styles.body}>Preferred Gender: {req.gender}</Text>
              </View>
            ) : null}
          </Section>
        ) : null}

        {(job.tags?.length || job.benefits?.length) ? (
          <Section title="Tags & Benefits">
            {job.tags?.length ? (
              <View style={{ gap: SPACING.xs }}>
                <Text style={styles.subLabel}>Tags</Text>
                <View style={styles.tags}>
                  {job.tags.map((t) => <Badge key={t} label={t} color={COLORS.accent} />)}
                </View>
              </View>
            ) : null}

            {job.benefits?.length ? (
              <View style={{ gap: SPACING.xs }}>
                <Text style={styles.subLabel}>Benefits</Text>
                {job.benefits.map((b) => (
                  <View key={b} style={styles.bullet}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.body}>{b}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Section>
        ) : null}

        {job.location?.address ? (
          <Section title="Job Location">
            <View style={styles.bullet}>
              <Ionicons name="location-outline" size={16} color={COLORS.text} />
              <Text style={styles.body}>{job.location.address}</Text>
            </View>
          </Section>
        ) : null}

        {/* ✅ Posting info — published / deadline / expiry dates together */}
        <Section title="Posting Info">
          {job.publishedAt ? (
            <View style={styles.bullet}>
              <Ionicons name="checkmark-done-outline" size={16} color={COLORS.text} />
              <Text style={styles.body}>Published: {formatDateDisplay(job.publishedAt)}</Text>
            </View>
          ) : null}
          {job.applicationDeadline ? (
            <View style={styles.bullet}>
              <Ionicons name="hourglass-outline" size={16} color={COLORS.text} />
              <Text style={styles.body}>Apply by: {formatDateDisplay(job.applicationDeadline)}</Text>
            </View>
          ) : null}
          {job.expiryDate ? (
            <View style={styles.bullet}>
              <Ionicons name="close-circle-outline" size={16} color={COLORS.text} />
              <Text style={styles.body}>Listing closes: {formatDateDisplay(job.expiryDate)}</Text>
            </View>
          ) : null}
        </Section>
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

  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  expiryBannerText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  expiryBannerSub: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginLeft: 'auto' },

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
  subCategory: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
  tags: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },

  metaRow: { flexDirection: 'row', gap: SPACING.lg, flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },

  companyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  companyName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  companyPhone: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  callBtn: {
    backgroundColor: COLORS.success,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  companyMetaRow: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' },
  companyMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  companyMetaText: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  companyDesc: { fontSize: FONTS.sizes.sm, color: COLORS.gray600, lineHeight: 20 },

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
  freeNotice: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: `${COLORS.success}14`,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: `${COLORS.success}33`,
    padding: SPACING.sm,
  },
  freeNoticeText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.success, flex: 1 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  subLabel: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase' },
  body: { fontSize: FONTS.sizes.md, color: COLORS.gray600, lineHeight: 22, flex: 1 },
  bullet: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingTop: SPACING.md, paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
});