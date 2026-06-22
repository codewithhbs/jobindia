import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { employerApi } from '../../api/employer.api';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import { Loader, Screen } from '../../components/ui/Screen';
import HomeSlider from '../../components/ui/HomeSlider';
import { adminApi } from '../../api/admin.api';
const BASE_SERVER = 'https://jobapi.adsdigitalmedia.com';

const STATUS_META = {
  approved: { label: 'Verified', color: '#22C55E' },
  pending: { label: 'Pending review', color: '#F59E0B' },
  rejected: { label: 'Rejected', color: '#EF4444' },
};

export default function EmployerDashboardScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const { data: profile, refetch: profileRefetch } = useFetch(() => employerApi.me(), []);
  const { data: banners, refetch: bannerRefetch } = useFetch(() => adminApi.sliders(), []);
  const { data, loading, refetch } = useFetch(() => employerApi.dashboard(), []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch().catch(() => { }), profileRefetch().catch(() => { }), bannerRefetch().catch(() => { })]);
    setRefreshing(false);
  }, [refetch, profileRefetch, bannerRefetch]);

  if (loading && !data) return <Screen><Loader text="Loading..." /></Screen>;

  const status = STATUS_META[profile?.verificationStatus] || STATUS_META.pending;
  const logoUri = profile?.companyLogo
    ? profile.companyLogo.startsWith('http')
      ? profile.companyLogo
      : `${BASE_SERVER}${profile.companyLogo}`
    : null;

  const stats = [
    { key: 'total', icon: 'briefcase', label: 'Total Jobs', value: data?.totalJobs || 0, tint: '#4F46E5' },
    { key: 'active', icon: 'flash', label: 'Active', value: data?.activeJobs || 0, tint: '#0EA5E9' },
    { key: 'applicants', icon: 'people', label: 'Applicants', value: data?.totalApplications || 0, tint: '#F59E0B' },
    { key: 'new', icon: 'sparkles', label: 'New', value: data?.newApplications || 0, tint: '#22C55E' },
  ];

  const manageItems = [
    { key: 'myjobs', icon: 'briefcase', label: 'My Jobs', sub: `${data?.totalJobs || 0} posted`, tint: '#4F46E5', route: 'MyJobs' },
    { key: 'profile', icon: 'business', label: 'Company Profile', sub: status.label, tint: '#0EA5E9', route: 'EmployerProfile' },
    { key: 'applicants', icon: 'people', label: 'Applicants', sub: `${data?.totalApplications || 0} total`, tint: '#F59E0B', route: 'Applicants' },
    { key: 'plans', icon: 'rocket', label: 'Upgrade Plan', sub: (data?.subscriptionPlan || 'free').toUpperCase(), tint: '#A855F7', route: 'Plans' },
  ];

  return (
    <Screen edges={['top']} noPadding>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient colors={['#1E1B4B', '#4338CA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>WELCOME BACK</Text>
              <Text style={styles.heroGreet}>{profile?.companyName || user?.name || 'Recruiter'}</Text>
            </View>
            <Pressable style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={19} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.planChipRow}>
            <View style={styles.planChip}>
              <Ionicons name="diamond-outline" size={13} color="#fff" />
              <Text style={styles.planChipText}>{(data?.subscriptionPlan || 'free').toUpperCase()}</Text>
            </View>
            <Text style={styles.planChipSub}>{profile?.jobPostLimit ?? 0} job slots available</Text>
          </View>
        </LinearGradient>

        {/* Identity card — overlaps hero */}
        <View style={styles.identityCard}>
          <View style={styles.logoFrame}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImg} />
            ) : (
              <View style={[styles.logoImg, styles.logoFallback]}>
                <Ionicons name="business" size={24} color={COLORS.primary} />
              </View>
            )}
          </View>

          <View style={styles.identityInfo}>
            <Text style={styles.companyName} numberOfLines={1}>
              {profile?.companyName || 'Your Company'}
            </Text>
            <Text style={styles.companyMeta} numberOfLines={1}>
              {[profile?.industry, profile?.companySize && `${profile.companySize} employees`]
                .filter(Boolean)
                .join('  ·  ') || 'Add industry & size'}
            </Text>
          </View>

          <View style={styles.statusDotWrap}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Banner slider */}
        {banners && banners.length > 0 && (
          <View style={styles.sliderWrap}>
            <HomeSlider data={banners} />
          </View>
        )}

        {/* Post job — signature CTA */}
        <Pressable
          style={({ pressed }) => [styles.postCta, pressed && styles.postCtaPressed]}
          onPress={() => navigation.navigate('PostJob')}
        >
          <LinearGradient
            colors={['#4338CA', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.postCtaGradient}
          >
            <View style={styles.postCtaIconWrap}>
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <View style={styles.postCtaTextWrap}>
              <Text style={styles.postCtaTitle}>Post a New Job</Text>
              <Text style={styles.postCtaSub}>Reach candidates in minutes</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        </Pressable>

        {/* Overview stats */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statStrip}
        >
          {stats.map((s) => (
            <View key={s.key} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: `${s.tint}14` }]}>
                <Ionicons name={s.icon} size={18} color={s.tint} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Manage grid */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Manage</Text>
        </View>
        <View style={styles.manageGrid}>
          {manageItems.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.manageCard, pressed && styles.manageCardPressed]}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.manageIconWrap, { backgroundColor: `${item.tint}14` }]}>
                <Ionicons name={item.icon} size={20} color={item.tint} />
              </View>
              <Text style={styles.manageLabel} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.manageSub} numberOfLines={1}>{item.sub}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: SPACING.xxxl },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.2, marginBottom: 4,
  },
  heroGreet: { color: '#fff', fontSize: 22, fontWeight: '800' },
  bellBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  planChipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  planChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  planChipText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  planChipSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '500' },

  // Identity card (overlaps hero)
  identityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -40,
    padding: 14,
    borderRadius: 20,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  logoFrame: {
    width: 54, height: 54, borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  logoImg: { width: '100%', height: '100%' },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  identityInfo: { flex: 1, gap: 2 },
  companyName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  companyMeta: { fontSize: 12.5, color: COLORS.textSecondary, fontWeight: '500' },
  statusDotWrap: { alignItems: 'center', gap: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 10, fontWeight: '700' },

  // Slider
  sliderWrap: { marginTop: 18, paddingHorizontal: 5 },

  // Post job CTA — the signature element
  postCta: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  postCtaPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  postCtaGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 20,
  },
  postCtaIconWrap: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  postCtaTextWrap: { flex: 1 },
  postCtaTitle: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
  postCtaSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', marginTop: 1 },

  // Section heads
  sectionHead: { paddingHorizontal: 20, marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 0.2 },

  // Stat strip
  statStrip: { paddingHorizontal: 20, gap: 12 },
  statCard: {
    width: 108,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11.5, color: COLORS.textSecondary, fontWeight: '600' },

  // Manage grid — 2 columns
  manageGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 12,
  },
  manageCard: {
    width: '47%', flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  manageCardPressed: { backgroundColor: '#FAFAFE' },
  manageIconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  manageLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  manageSub: { fontSize: 11.5, color: COLORS.textSecondary, fontWeight: '500' },
});