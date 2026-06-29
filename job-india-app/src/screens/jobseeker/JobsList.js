import React, { forwardRef, useState, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import {
    View, Text, TextInput, FlatList, StyleSheet, RefreshControl,
    ActivityIndicator, Alert, Pressable, Platform, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { jobsApi } from '../../api/jobs.api';
import { adminApi } from '../../api/admin.api';
import { useAuthStore } from '../../store/authStore';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';
import { EmptyState, Loader, Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { JobListCard } from '../../components/cards/JobListCard';
import { Input } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';

const PAGE_LIMIT = 15;
const KM_OPTIONS = [
    { value: '5', label: '5 km' },
    { value: '10', label: '10 km' },
    { value: '15', label: '15 km' },
    { value: '20', label: '20 km' },
    { value: '25', label: '25 km' },
];

// TODO: replace with your own Google Places API key.
const GOOGLE_PLACES_API_KEY = 'AIzaSyDnyLLiPykuaRbCKZEmBPa0jzdiB61qRpc';

const MODES = [
    { key: 'recommended', label: 'Recommended', icon: 'sparkles-outline' },
    { key: 'all', label: 'All jobs', icon: 'grid-outline' },
];

function dedupeJobs(list) {
    const seen = new Set();
    const out = [];
    for (const job of list) {
        const id = job?._id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(job);
    }
    return out;
}

// ---- Picker wrapper: native dropdown(Android)/modal sheet(iOS). No z-index ever. ----
function PickerField({ value, options, onChange, placeholder = 'Select' }) {
    const [iosVisible, setIosVisible] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const selectedLabel = options.find((o) => o.value === value)?.label;

    if (Platform.OS === 'android') {
        return (
            <View style={styles.pickerBoxAndroid}>
                <Picker
                    selectedValue={value}
                    onValueChange={(v) => onChange(v)}
                    style={styles.pickerAndroidInner}
                    dropdownIconColor={COLORS.textSecondary}
                    mode="dropdown"
                >
                    {options.map((opt) => (
                        <Picker.Item key={opt.value || 'all'} label={opt.label} value={opt.value} />
                    ))}
                </Picker>
            </View>
        );
    }

    return (
        <>
            <Pressable
                onPress={() => { setTempValue(value); setIosVisible(true); }}
                style={styles.pickerBoxIos}
            >
                <Text
                    numberOfLines={1}
                    style={[styles.pickerBoxText, !selectedLabel && { color: COLORS.textLight }]}
                >
                    {selectedLabel || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={12} color={COLORS.textLight} />
            </Pressable>

            <Modal visible={iosVisible} transparent animationType="slide" onRequestClose={() => setIosVisible(false)}>
                <Pressable style={styles.iosBackdrop} onPress={() => setIosVisible(false)} />
                <View style={styles.iosSheet}>
                    <View style={styles.iosSheetHeader}>
                        <Pressable onPress={() => setIosVisible(false)}>
                            <Text style={styles.iosCancel}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={() => { onChange(tempValue); setIosVisible(false); }}>
                            <Text style={styles.iosDone}>Done</Text>
                        </Pressable>
                    </View>
                    <Picker selectedValue={tempValue} onValueChange={setTempValue}>
                        {options.map((opt) => (
                            <Picker.Item key={opt.value || 'all'} label={opt.label} value={opt.value} />
                        ))}
                    </Picker>
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
    const categoryOptions = [
        { value: '', label: 'Job Profile' },
        ...(categories || []).map((c) => ({ value: c.name, label: c.name })),
    ];

    const hasActiveFilters = !!(category || areaCoords || radiusKm);

    return (
        <View style={styles.filterCard}>
            {/* ---- Row 1: GPS, category, km ---- */}
            <View style={styles.filterRow1}>
                <Pressable onPress={onUseCurrentLocation} style={styles.locPinBtn} hitSlop={8}>
                    {locLoading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <Ionicons name="locate" size={18} color={COLORS.primary} />
                    )}
                </Pressable>

                <View style={styles.categoryWrap}>
                    <PickerField
                        value={category}
                        options={categoryOptions}
                        onChange={(v) => onCategoryChange(v)}
                        placeholder="Categories"
                    />
                </View>

                <View style={styles.kmWrap}>
                    <PickerField
                        value={radiusKm}
                        options={KM_OPTIONS}
                        onChange={onRadiusChange}
                        placeholder="Km"
                    />
                </View>
            </View>

            {/* ---- Row 2: area / location search ---- */}
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
                        <Pressable
                            key={s.place_id}
                            onPress={() => onSelectSuggestion(s)}
                            style={styles.suggestionRow}
                        >
                            <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
                            <Text style={styles.suggestionText} numberOfLines={1}>{s.description}</Text>
                        </Pressable>
                    ))}
                </View>
            )}

            {geocoding && (
                <Text style={styles.areaHint}>Finding "{areaInput}"...</Text>
            )}
            {areaCoords?.label ? (
                <View style={styles.areaResolvedRow}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.areaResolvedText} numberOfLines={1}>{areaCoords.label}</Text>
                </View>
            ) : null}
            {!areaCoords && (
                <Text style={styles.areaHint}>Set a location above to filter by distance</Text>
            )}

            {hasActiveFilters ? (
                <Pressable onPress={onClear} style={styles.filterClearBtn}>
                    <Ionicons name="close-circle-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.filterClearText}>Clear filters</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const JobsList = forwardRef(function JobsList({ route }, ref) {
    const navigation = useNavigation();
    const user = useAuthStore((s) => s.user);
    const [mode, setMode] = useState('all');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({ sortBy: 'createdAt' });
    const [coords, setCoords] = useState(null);
    const [locLoading, setLocLoading] = useState(false);
    const type = user?.userId?.role ==="jobseeker" ? false:true
  
    const { data: categories } = useFetch(() => adminApi.categories(type), []);
    const [category, setCategory] = useState('');
    const [areaInput, setAreaInput] = useState('');
    const [areaCoords, setAreaCoords] = useState(null);
    const [radiusKm, setRadiusKm] = useState(null);
    const [geocoding, setGeocoding] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const suggestDebounceRef = useRef(null);

    const [jobs, setJobs] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [savedIds, setSavedIds] = useState(new Set());
    const [appliedIds, setAppliedIds] = useState(new Set());
    const [applyingId, setApplyingId] = useState(null);

    const requestIdRef = useRef(0);

    useEffect(() => {
        const initialCategory = route?.params?.category;
        if (initialCategory) {
            setCategory(initialCategory);
            setMode('all');
        }
    }, [route?.params?.category]);

    useEffect(() => {
        setFilters((f) => {
            const next = { sortBy: f.sortBy || 'createdAt' };
            if (category) next.category = category;
            if (areaCoords && radiusKm) {
                next.lat = areaCoords.lat;
                next.lng = areaCoords.lng;
                next.radius = Number(radiusKm) * 1000;
            }
            return next;
        });
    }, [category, areaCoords, radiusKm]);

    useEffect(() => () => {
        if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    }, []);

    const fetchSuggestions = useCallback(async (query) => {
        try {
            setSuggestLoading(true);
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&components=country:in&types=geocode`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.status === 'OK') {
                setSuggestions(json.predictions || []);
            } else {
                setSuggestions([]);
            }
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
        if (!q) {
            setSuggestions([]);
            return;
        }
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
                setMode('all');
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
        if (coords) return coords;

        const profileLat = user?.location?.lat;
        const profileLng = user?.location?.lng;
        if (profileLat && profileLng) {
            const c = { lat: profileLat, lng: profileLng };
            setCoords(c);
            return c;
        }

        try {
            setLocLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Location needed', 'Enable location access to see nearby jobs');
                return null;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const c = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            setCoords(c);
            return c;
        } catch (e) {
            Alert.alert('Could not get location', 'Please try again');
            return null;
        } finally {
            setLocLoading(false);
        }
    }, [coords, user]);

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
            setMode('all');
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
        setMode('all');
        setRadiusKm((prev) => prev || '10');
    }, [ensureCoords]);

    const onClearFilters = useCallback(() => {
        setCategory('');
        setAreaInput('');
        setAreaCoords(null);
        setRadiusKm(null);
        setSuggestions([]);
    }, []);

    const fetchPage = useCallback(async (pageNum, append) => {
        const requestId = ++requestIdRef.current;

        try {
            if (append) setLoadingMore(true); else setLoading(true);

            let res;
            if (mode === 'recommended') {
                res = await jobsApi.recomended({ page: pageNum, limit: PAGE_LIMIT });
            } else if (mode === 'nearby') {
                const c = await ensureCoords();
                if (requestId !== requestIdRef.current) return;
                if (!c) { setJobs([]); setHasMore(false); return; }
                res = await jobsApi.nearby({ lat: c.lat, lng: c.lng, page: pageNum, limit: PAGE_LIMIT });
            } else {
                res = await jobsApi.list({
                    ...filters,
                    search: search || undefined,
                    page: pageNum,
                    limit: PAGE_LIMIT,
                });
            }

            if (requestId !== requestIdRef.current) return;

            const list = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.data?.jobs)
                    ? res.data.jobs
                    : [];

            setJobs((prev) => dedupeJobs(append ? [...prev, ...list] : list));
            setHasMore(list.length >= PAGE_LIMIT);
            setPage(pageNum);
        } catch (e) {
            if (requestId !== requestIdRef.current) return;
            if (!append) setJobs([]);
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    }, [mode, filters, search, ensureCoords]);

    useEffect(() => {
        fetchPage(1, false);
    }, [mode, filters, search]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPage(1, false);
        setRefreshing(false);
    }, [fetchPage]);

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore || loading) return;
        fetchPage(page + 1, true);
    }, [page, hasMore, loadingMore, loading, fetchPage]);

    const toggleSave = useCallback(async (job) => {
        const id = job._id;
        setSavedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
        try {
            await jobsApi.save(id);
        } catch (e) {
            setSavedIds((prev) => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
            });
        }
    }, []);

    const quickApply = useCallback(async (job) => {
        const id = job._id;
        if (appliedIds.has(id) || applyingId === id) return;
        try {
            setApplyingId(id);
            await jobsApi.apply(id, {});
            setAppliedIds((prev) => new Set(prev).add(id));
        } catch (e) {
            Alert.alert('Could not apply', e?.response?.data?.message || 'Please try again');
        } finally {
            setApplyingId(null);
        }
    }, [appliedIds, applyingId]);

    const runSearch = useCallback(() => {
        setMode('all');
        setSearch(searchInput.trim());
    }, [searchInput]);

    const clearSearch = useCallback(() => {
        setSearchInput('');
        if (search) {
            setSearch('');
            setMode('recommended');
        }
    }, [search]);

    useImperativeHandle(ref, () => ({ refresh: onRefresh }));

    const resultCount = jobs.length;

    return (
        <Screen style={{ paddingBottom: 40 }}>
            <Header title="Jobs" onBack={() => navigation.goBack()} />

            <FlatList
                data={jobs}
                keyExtractor={(item, index) => item?._id ? String(item._id) : `job-${index}`}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                ListHeaderComponent={
                    <View>
                        <View style={styles.modeRow}>
                            {MODES?.map((m) => {
                                const active = mode === m.key;
                                return (
                                    <Pressable
                                        key={m.key}
                                        onPress={() => setMode(m.key)}
                                        style={[styles.modeChip, active && styles.modeChipActive]}
                                    >
                                        {m.key === 'nearby' && locLoading ? (
                                            <ActivityIndicator size="small" color={active ? COLORS.white : COLORS.primary} />
                                        ) : (
                                            <Ionicons name={m.icon} size={15} color={active ? COLORS.white : COLORS.textSecondary} />
                                        )}
                                        <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{m.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {mode === 'all' && (
                            <JobSearchFilters
                                categories={categories}
                                category={category}
                                onCategoryChange={(v) => { setCategory(v); setMode('all'); }}
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
                        )}

                        {!loading && resultCount > 0 && (
                            <View style={styles.resultRow}>
                                <Text style={styles.resultText}>
                                    {resultCount} {resultCount === 1 ? 'job' : 'jobs'} found
                                </Text>
                                {search ? (
                                    <Pressable onPress={clearSearch} style={styles.resultClear}>
                                        <Ionicons name="close" size={12} color={COLORS.primary} />
                                        <Text style={styles.resultClearText}>"{search}"</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        )}
                    </View>
                }
                renderItem={({ item }) => (
                    <JobListCard
                        job={item}
                        saved={savedIds.has(item._id)}
                        applied={appliedIds.has(item._id)}
                        applying={applyingId === item._id}
                        onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
                        onSave={() => toggleSave(item)}
                        onApply={() => quickApply(item)}
                    />
                )}
                ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
                ListFooterComponent={loadingMore ? (
                    <View style={styles.footerLoader}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                ) : null}
                ListEmptyComponent={
                    loading ? (
                        <Loader text="Finding jobs..." />
                    ) : (
                        <EmptyState
                            icon="briefcase-outline"
                            title="No jobs found"
                            subtitle={mode === 'nearby' ? 'No jobs near your location right now' : 'Try adjusting your filters or search'}
                        />
                    )
                }
            />
        </Screen>
    );
});

export default JobsList;

const styles = StyleSheet.create({
    list: { padding: SPACING.lg, flexGrow: 1 },

    modeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
    modeChip: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
        paddingVertical: 10, borderRadius: RADIUS.lg,
        backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    },
    modeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    modeChipText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary },
    modeChipTextActive: { color: COLORS.white },

    filterCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
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

    // ---- Android picker: native dialog/dropdown, system overlay, no z-index needed ----
    pickerBoxAndroid: {
        height: 44,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceAlt,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    pickerAndroidInner: {
        color: COLORS.text,
        marginVertical: -8, // trims extra native vertical padding Android adds
    },

    // ---- iOS trigger box (opens modal sheet) ----
    pickerBoxIos: {
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
    pickerBoxText: {
        flex: 1,
        fontSize: FONTS.sizes.xs,
        color: COLORS.text,
        fontWeight: '600',
    },

    // ---- iOS modal sheet ----
    iosBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    iosSheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        paddingBottom: SPACING.lg,
        ...SHADOWS.md,
    },
    iosSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iosCancel: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONTS.sizes.sm },
    iosDone: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },

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

    resultRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: SPACING.sm, paddingHorizontal: 2,
    },
    resultText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },
    resultClear: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: COLORS.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    resultClearText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600', maxWidth: 120 },

    footerLoader: { paddingVertical: SPACING.lg, alignItems: 'center' },
});