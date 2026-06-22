import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, Linking } from 'react-native';
import React, { useCallback, useRef, useState } from 'react'
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../api/admin.api';
import { useFetch } from '../../hooks/useFetch';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Chip, Input } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useNavigation } from '@react-navigation/native';
import { FeaturedJobs } from './FeaturedJobs';
import AppFooter from '../../components/ui/AppFooter';
import HomeSlider from '../../components/ui/HomeSlider';

// ---- "Why us" trust section, India-app style ----
const TRUST_ITEMS = [
  { id: '1', icon: 'shield-checkmark', title: '100% Verified', desc: 'Har company manually verify hoti hai', color: COLORS.primary, bg: COLORS.primaryLight },
  { id: '2', icon: 'flash', title: 'Apply in 1 Tap', desc: 'Bina form bhare, instant apply karo', color: COLORS.accent, bg: COLORS.warningLight },
  { id: '3', icon: 'location', title: 'Pan-India Jobs', desc: 'Chhote shehar se metro tak, sab jagah', color: COLORS.secondary, bg: COLORS.secondaryLight },
  { id: '4', icon: 'wallet', title: 'Hamesha Free', desc: 'Job dhundna kabhi paid nahi hoga', color: COLORS.success, bg: COLORS.successLight },
];

function WhyUsSection() {
  return (
    <View style={styles.whyWrap}>
      <Text style={styles.sectionTitle}>Kyu chunein humein?</Text>
      <Text style={styles.sectionSub}>Banaya gaya hai job seekers ke liye, unki hi zaroorat samajh kar</Text>
      <View style={styles.whyGrid}>
        {TRUST_ITEMS.map((item) => (
          <View key={item.id} style={styles.whyCard}>
            <View style={[styles.whyIconWrap, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.whyTitle}>{item.title}</Text>
            <Text style={styles.whyDesc}>{item.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}


export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation()
  const { data: categories } = useFetch(() => adminApi.categories(user?.userId?.role === "driver" ? true:false), [refreshing]);
  const { data: Banners, refetch } = useFetch(() => adminApi.sliders(user?.userId?.role === "driver" ? "driver" : "jobseeker"), [refreshing])
  const featuredJobsRef = useRef(null);

  const onSearch = () => featuredJobsRef.current?.refetch().catch(() => { });
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await featuredJobsRef.current?.refetch().catch(() => { });
    refetch()
    setRefreshing(false);
  }, []);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ---- Top header ---- */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>Hi, {user?.name || 'there'} 👋</Text>
            <Text style={styles.sub}>Find your next opportunity</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.lg, alignItems: 'center' }}>
            <Pressable onPress={() => navigation.navigate('JobMap')} hitSlop={10}>
              <Ionicons name="map-outline" size={24} color={COLORS.text} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={10}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            </Pressable>
          </View>
        </View>

        {/* ---- Search ---- */}
        <View style={styles.searchRow}>
          <Input
            placeholder="Search jobs, roles, skills..."
            icon="search-outline"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearch}
            returnKeyType="search"
            containerStyle={{ flex: 1 }}
          />
        </View>
        {Banners && Banners.length > 0 && (
          <HomeSlider data={Banners} />

        )}

        {/* ---- Categories ---- */}
        <View style={styles.categoriesWrap}>
          <View style={styles.categoriesTitleRow}>
            <Text style={styles.categoriesTitle}>Browse Categories</Text>
            <Pressable onPress={() => navigation.navigate('JobsList')} hitSlop={8}>
              <Text style={styles.seeAllSmall}>See all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, marginHorizontal: 12, paddingBottom: SPACING.sm }}>
            <Chip
              label="All"
              active={!category}
              onPress={() => setCategory(null)}
            />
            {(categories || []).map((c) => (
              <Chip
                key={c._id}
                label={c.name}
                active={category === c.name}
                onPress={() => setCategory(c.name)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ---- Jobs section, fully delegated ---- */}
        <FeaturedJobs refreshing={refreshing} ref={featuredJobsRef} search={search} category={category} />

        {/* ---- Trust / good things section ---- */}
        <WhyUsSection />

        <AppFooter refreshing={refreshing} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: SPACING.xxxl, flexGrow: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  greet: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },

  searchRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },

  categoriesWrap: { paddingBottom: SPACING.md },
  categoriesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  categoriesTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  seeAllSmall: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.primary },

  // ---- Why-us / trust section ----
  whyWrap: { marginTop: SPACING.xxl, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  sectionSub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  whyCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  whyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  whyTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  whyDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, lineHeight: 16 },


});