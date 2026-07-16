import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, Linking, Image, TextInput, FlatList, ActivityIndicator, Modal, Platform, Keyboard, Alert } from 'react-native';
import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react'
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
import * as Location from 'expo-location';

// ---- "Why us" trust section, India-app style ----
const TRUST_ITEMS = [
  {
    id: '1',
    icon: 'shield-checkmark',
    title: '100% Verified',
    desc: 'Every employer is manually verified for your safety.',
    color: COLORS.primary,
    bg: COLORS.primaryLight,
  },
  {
    id: '2',
    icon: 'flash',
    title: 'One-Tap Apply',
    desc: 'Apply instantly without filling out long forms.',
    color: COLORS.accent,
    bg: COLORS.warningLight,
  },
  {
    id: '3',
    icon: 'location',
    title: 'Jobs Across India',
    desc: 'Discover opportunities in small towns and metro cities alike.',
    color: COLORS.secondary,
    bg: COLORS.secondaryLight,
  },
  {
    id: '4',
    icon: 'wallet',
    title: 'Always Free',
    desc: 'Finding your next job will never cost you anything.',
    color: COLORS.success,
    bg: COLORS.successLight,
  },
];

const KM_OPTIONS = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '15', label: '15 km' },
  { value: '20', label: '20 km' },
  { value: '25', label: '25 km' },
];

const GOOGLE_PLACES_API_KEY = 'AIzaSyDnyLLiPykuaRbCKZEmBPa0jzdiB61qRpc';

function WhyUsSection() {
  return (
    <View style={styles.whyWrap}>
      <Text style={styles.sectionTitle}>Why Choose Us?</Text>
      <Text style={styles.sectionSub}>
        Built for job seekers with features that make finding your next opportunity faster and easier.
      </Text>
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
function CategoryCard({ icon, label, image, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.catItem}>
      <View style={[styles.catIconBox, active && styles.catIconBoxActive]}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.catImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.catIconEmoji}>{icon}</Text>
        )}
      </View>

      <Text
        style={[styles.catTitle, active && styles.catTitleActive]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const CATEGORY_PREVIEW_LIMIT = 8;

function CategoriesGrid({ categories, category, onSelect, onSeeAll }) {
  const [expanded, setExpanded] = useState(false);
  const list = categories || [];
  const hasMore = list.length > CATEGORY_PREVIEW_LIMIT;
  const visible = expanded ? list : list.slice(0, CATEGORY_PREVIEW_LIMIT);

  return (
    <View style={styles.categoriesWrap}>
      <View style={styles.categoriesTitleRow}>
        <Text style={styles.categoriesTitle}>Browse Categories</Text>
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAllSmall}>See all</Text>
        </Pressable>
      </View>
      <View style={styles.catGrid}>
        {visible.map((c) => (
          <CategoryCard
            key={c._id}
            icon={c.icon}
            image={c.image}

            label={c.name}
            active={category === c.name}
            onPress={() => onSelect(c.name)}
          />
        ))}
      </View>
      {hasMore && (
        <Pressable onPress={() => setExpanded((p) => !p)} style={styles.viewMoreBtn} hitSlop={8}>
          <Text style={styles.viewMoreText}>{expanded ? 'View less' : 'View more'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.primary} />
        </Pressable>
      )}
    </View>
  );
}

// ---- Picker wrapper: modal sheet with built-in search ----
function PickerField({ value, options, onChange, placeholder = 'Select' }) {
  const [visible, setVisible] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [search, setSearch] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e?.endCoordinates?.height || 0));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label;
  const filteredOptions = useMemo(() => (
    search ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options
  ), [options, search]);

  const openSheet = () => { setTempValue(value); setSearch(''); setVisible(true); };
  const confirm = (val) => { setTempValue(val); onChange(val); setVisible(false); };

  return (
    <>
      <Pressable onPress={openSheet} style={styles.pickerBox}>
        <Text numberOfLines={1} style={[styles.pickerBoxText, !selectedLabel && { color: COLORS.textLight }]}>
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={12} color={COLORS.textLight} />
      </Pressable>

      <Modal visible={visible} transparent animationType="none" onRequestClose={() => setVisible(false)}>
        <View style={{ flex: 1 }}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setVisible(false)} />
          <View style={[styles.sheet, { marginBottom: keyboardHeight }]}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setVisible(false)}><Text style={styles.sheetCancel}>Cancel</Text></Pressable>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{placeholder}</Text>
              <Pressable onPress={() => setVisible(false)}><Text style={styles.sheetDone}>Done</Text></Pressable>
            </View>

            <View style={styles.sheetSearchWrap}>
              <Ionicons name="search" size={16} color={COLORS.textLight} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search..."
                placeholderTextColor={COLORS.textLight}
                style={styles.sheetSearchInput}
                autoFocus
              />
              {search ? (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(opt) => String(opt.value || 'all')}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 320 }}
              ListEmptyComponent={<Text style={styles.sheetEmpty}>No results</Text>}
              renderItem={({ item: opt }) => (
                <Pressable
                  onPress={() => confirm(opt.value)}
                  style={[styles.sheetItem, tempValue === opt.value && { backgroundColor: COLORS.primaryLight }]}
                >
                  <Text style={{ color: tempValue === opt.value ? COLORS.primary : COLORS.text, fontWeight: '600' }}>
                    {opt.label}
                  </Text>
                  {tempValue === opt.value ? <Ionicons name="checkmark" size={18} color={COLORS.primary} /> : null}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---- Combined filter section: GPS + category + km row, then area search ----
function JobSearchFilters({
  categories, category, onCategoryChange,
  areaInput, onAreaInputChange, onSubmitArea, onUseCurrentLocation, geocoding, locLoading,
  suggestions, suggestLoading, onSelectSuggestion,
  areaCoords,
  radiusKm, onRadiusChange,
  onClear,
}) {
  const categoryOptions = useMemo(() => ([
    { value: '', label: 'Job Profile' },
    ...(categories || []).map((c) => ({ value: c.name, label: c.name })),
  ]), [categories]);

  const hasActiveFilters = !!(category || areaCoords || radiusKm);

  return (
    <View style={styles.filterCard}>
      <View style={styles.filterRow1}>
        <Pressable onPress={onUseCurrentLocation} style={styles.locPinBtn} hitSlop={8}>
          {locLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="locate" size={18} color={COLORS.primary} />
          )}
        </Pressable>

        <View style={styles.categoryWrap}>
          <PickerField value={category} options={categoryOptions} onChange={onCategoryChange} placeholder="Job Profile" />
        </View>

        <View style={styles.kmWrap}>
          <PickerField value={radiusKm} options={KM_OPTIONS} onChange={onRadiusChange} placeholder="Km" />
        </View>
      </View>

      <Input
        placeholder="Search by location"
        value={areaInput}
        onChangeText={onAreaInputChange}
        onSubmitEditing={onSubmitArea}
        returnKeyType="search"
      />

      {suggestLoading && <Text style={styles.areaHint}>Searching places...</Text>}

      {suggestions?.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((s) => (
            <Pressable key={s.place_id} onPress={() => onSelectSuggestion(s)} style={styles.suggestionRow}>
              <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.suggestionText} numberOfLines={1}>{s.description}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {geocoding && <Text style={styles.areaHint}>Finding "{areaInput}"...</Text>}
      {areaCoords?.label ? (
        <View style={styles.areaResolvedRow}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={styles.areaResolvedText} numberOfLines={1}>{areaCoords.label}</Text>
        </View>
      ) : null}
      {!areaCoords && <Text style={styles.areaHint}>Set a location above to filter by distance</Text>}

      {hasActiveFilters ? (
        <Pressable onPress={onClear} style={styles.filterClearBtn}>
          <Ionicons name="close-circle-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.filterClearText}>Clear filters</Text>
        </Pressable>
      ) : null}
    </View>
  );
}


export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(null);
  const [areaInput, setAreaInput] = useState('');
  const [areaCoords, setAreaCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestDebounceRef = useRef(null);
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

  useEffect(() => () => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    try {
      setSuggestLoading(true);
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&components=country:in&types=geocode`;
      const res = await fetch(url);
      const json = await res.json();
      setSuggestions(json.status === 'OK' ? (json.predictions || []) : []);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  const onAreaInputChange = useCallback((text) => {
    setAreaInput(text);
    setAreaCoords(null);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    const q = text.trim();
    if (!q) { setSuggestions([]); return; }
    suggestDebounceRef.current = setTimeout(() => fetchSuggestions(q), 350);
  }, [fetchSuggestions]);

  const onSelectSuggestion = useCallback(async (place) => {
    setSuggestions([]);
    setAreaInput(place.description);
    try {
      setGeocoding(true);
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=geometry,name&key=${GOOGLE_PLACES_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const loc = json?.result?.geometry?.location;
      if (loc) {
        setAreaCoords({ lat: loc.lat, lng: loc.lng, label: place.description });
        setRadiusKm((prev) => prev || '10');
      } else {
        Alert.alert('Could not resolve location', 'Please try another place');
      }
    } catch (e) {
      Alert.alert('Could not resolve location', 'Please try again');
    } finally {
      setGeocoding(false);
    }
  }, []);

  const ensureCoords = useCallback(async () => {
    const profileLat = user?.location?.lat;
    const profileLng = user?.location?.lng;
    if (profileLat && profileLng) return { lat: profileLat, lng: profileLng };

    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Enable location access to see nearby jobs');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch (e) {
      Alert.alert('Could not get location', 'Please try again');
      return null;
    } finally {
      setLocLoading(false);
    }
  }, [user]);

  const onSubmitArea = useCallback(async () => {
    const q = areaInput.trim();
    if (!q) return;
    setSuggestions([]);
    try {
      setGeocoding(true);
      const results = await Location.geocodeAsync(q);
      if (!results?.length) {
        Alert.alert('Not found', `Could not find "${q}". Try a more specific area name.`);
        return;
      }
      const { latitude, longitude } = results[0];
      setAreaCoords({ lat: latitude, lng: longitude, label: q });
      setRadiusKm((prev) => prev || '10');
    } catch (e) {
      Alert.alert('Could not search area', 'Please try again');
    } finally {
      setGeocoding(false);
    }
  }, [areaInput]);

  const onUseCurrentLocation = useCallback(async () => {
    const c = await ensureCoords();
    if (!c) return;
    setSuggestions([]);
    setAreaCoords({ lat: c.lat, lng: c.lng, label: 'Current location' });
    setAreaInput('');
    setRadiusKm((prev) => prev || '10');
  }, [ensureCoords]);

  const onClearFilters = useCallback(() => {
    setCategory(null);
    setAreaInput('');
    setAreaCoords(null);
    setRadiusKm(null);
    setSuggestions([]);
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

        <JobSearchFilters
          categories={categories}
          category={category}
          onCategoryChange={setCategory}
          areaInput={areaInput}
          onAreaInputChange={onAreaInputChange}
          onSubmitArea={onSubmitArea}
          onUseCurrentLocation={onUseCurrentLocation}
          geocoding={geocoding}
          locLoading={locLoading}
          suggestions={suggestions}
          suggestLoading={suggestLoading}
          onSelectSuggestion={onSelectSuggestion}
          areaCoords={areaCoords}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          onClear={onClearFilters}
        />

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
      {settings?.whatsapp_link && (
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
  logo: { width: 40, height: 50 },
  logoFallback: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary },

  greetWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  greet: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },

  searchRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },

  filterCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterRow1: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  categoryWrap: { flex: 1 },
  kmWrap: { flex: 1 },
  locPinBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.md,
  },
  pickerBoxText: { flex: 1, fontSize: FONTS.sizes.xs, color: COLORS.text, fontWeight: '600' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: SPACING.lg + 52,
    ...SHADOWS.md,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sheetCancel: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  sheetDone: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
  sheetSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sheetSearchInput: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.text, paddingVertical: 4 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sheetEmpty: { padding: 16, fontSize: 14, color: COLORS.textLight, textAlign: 'center' },
  areaHint: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  suggestionsBox: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  suggestionText: { fontSize: FONTS.sizes.sm, color: COLORS.text, flex: 1 },
  areaResolvedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  areaResolvedText: { fontSize: FONTS.sizes.xs, color: COLORS.success, fontWeight: '600', flex: 1 },
  filterClearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: SPACING.xs },
  filterClearText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },

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

    // backgroundColor: COLORS.surface,
    backgroundColor: "#3e7beb",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    // ...SHADOWS.xs,
  },
  catIconBoxActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  catImage: {
    width: 68,
    height: 68,
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

  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  viewMoreText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },

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