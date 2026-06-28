import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, Linking, Image } from 'react-native';
import React, { useCallback, useRef, useState } from 'react'
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../api/admin.api';
import { useFetch } from '../../hooks/useFetch';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Chip, Input } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FeaturedJobs } from './FeaturedJobs';
import AppFooter from '../../components/ui/AppFooter';
import HomeSlider from '../../components/ui/HomeSlider';
import { notificationsApi } from '../../api/notifications.api';

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

// ---- "Search jobs by interest" style category grid (icon + title cards) ----
function CategoryCard({ icon, label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.catItem}>
      <View style={[styles.catIconBox, active && styles.catIconBoxActive]}>
        <Text style={styles.catIconEmoji}>{icon}</Text>
      </View>
      <Text style={[styles.catTitle, active && styles.catTitleActive]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function CategoriesGrid({ categories, category, onSelect, onSeeAll }) {
  return (
    <View style={styles.categoriesWrap}>
      <View style={styles.categoriesTitleRow}>
        <Text style={styles.categoriesTitle}>Browse Categories</Text>
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAllSmall}>See all</Text>
        </Pressable>
      </View>
      <View style={styles.catGrid}>
        {(categories || []).map((c) => (
          <CategoryCard
            key={c._id}
            icon={c.icon}
            label={c.name}
            active={category === c.name}
            onPress={() => onSelect(c.name)}
          />
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
  const { data: settings } = useFetch(() => adminApi.publicSettings())
  const { data: categories } = useFetch(() => adminApi.categories(user?.userId?.role === "driver" ? true : false), [refreshing]);
  const { data: Banners, refetch } = useFetch(() => adminApi.sliders(user?.userId?.role === "driver" ? "driver" : "jobseeker"), [refreshing])
  const featuredJobsRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await notificationsApi.list({ limit: 1 });
      setUnreadCount(res?.unreadCount ?? 0);
    } catch (e) {
      // silent — bell just won't show a count this time
    }
  }, []);


  useFocusEffect(
    useCallback(() => {
      fetchUnread();
    }, [fetchUnread, refreshing])
  );
  const onSearch = () => featuredJobsRef.current?.refetch().catch(() => { });
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await featuredJobsRef.current?.refetch().catch(() => { });
    refetch()
    setRefreshing(false);
  }, []);

  return (
    <Screen>
      {/* ---- Fixed top header: logo + map + notifications ---- */}
      <View style={styles.header}>
        {settings?.app_logo ? (
          <Image source={{ uri: settings.app_logo }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Text style={styles.logoFallback}>{settings?.app_name || 'App'}</Text>
        )}

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: 'row', gap: SPACING.lg, alignItems: 'center' }}>
          <Pressable onPress={() => navigation.navigate('JobMap')} hitSlop={10}>
            <Ionicons name="map-outline" size={24} color={COLORS.text} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={10} style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ---- Greeting ---- */}
        <View style={styles.greetWrap}>
          <Text style={styles.greet}>Hi, {user?.userId?.name || 'there'} 👋</Text>
          <Text style={styles.sub}>Find your next opportunity</Text>
        </View>

        {Banners && Banners.length > 0 && (
          <HomeSlider data={Banners} />

        )}

        {/* ---- Categories ---- */}
        <CategoriesGrid
          categories={categories}
          category={category}
          onSelect={(catName) => navigation.navigate('JobsList', { category: catName })}
          onSeeAll={() => navigation.navigate('JobsList')}
        />

        {/* ---- Jobs section, fully delegated ---- */}
        <FeaturedJobs refreshing={refreshing} ref={featuredJobsRef} search={search} category={category} />

        {/* ---- Trust / good things section ---- */}
        <WhyUsSection />

        <AppFooter refreshing={refreshing} />

      </ScrollView>
      {user?.userId?.role === 'driver' && settings?.whatsapp_link && (
        <Pressable
          onPress={() => Linking.openURL(settings.whatsapp_link).catch(() => { })}
          style={styles.waFloatBtn}
        >
          <Ionicons name="logo-whatsapp" size={26} color="#fff" />
        </Pressable>
      )}
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
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: { width: 150, height: 30 },
  logoFallback: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary },

  greetWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
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

  // ---- Category grid (icon + title cards) ----
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    justifyContent: 'flex-start',
    gap: SPACING.sm,
  },
  catItem: {
    width: '22%',
    alignItems: 'center',
  },
  catIconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.xs,
  },
  catIconBoxActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  catIconEmoji: { fontSize: 20 },
  catTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 12,
  },
  catTitleActive: { color: COLORS.primary },

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
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', lineHeight: 11 },
  waFloatBtn: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg || SHADOWS.md,
    elevation: 6,
  }
});