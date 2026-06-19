import React, { forwardRef, useState, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import {
    View, Text, TextInput, FlatList, StyleSheet, RefreshControl,
    ActivityIndicator, Alert, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { jobsApi } from '../../api/jobs.api';
import { useAuthStore } from '../../store/authStore';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';
import { EmptyState, Loader, Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { JobListCard } from '../../components/cards/JobListCard';
import { FilterBar } from '../../components/cards/FilterBar';

const PAGE_LIMIT = 15;

const MODES = [
    { key: 'recommended', label: 'Recommended', icon: 'sparkles-outline' },
    { key: 'all', label: 'All jobs', icon: 'grid-outline' },
];

// merge two job lists, keeping first occurrence of each _id
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

const JobsList = forwardRef(function JobsList(_, ref) {
    const navigation = useNavigation();
    const user = useAuthStore((s) => s.user);

    const [mode, setMode] = useState('recommended');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({ sortBy: 'createdAt' });
    const [coords, setCoords] = useState(null);
    const [locLoading, setLocLoading] = useState(false);

    const [jobs, setJobs] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [savedIds, setSavedIds] = useState(new Set());
    const [appliedIds, setAppliedIds] = useState(new Set());
    const [applyingId, setApplyingId] = useState(null);

    // guards against stale/out-of-order responses (mode/filter/search switched mid-flight)
    const requestIdRef = useRef(0);

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

    const fetchPage = useCallback(async (pageNum, append) => {
        const requestId = ++requestIdRef.current;

        try {
            if (append) setLoadingMore(true); else setLoading(true);

            let res;
            if (mode === 'recommended') {
                res = await jobsApi.recomended({ page: pageNum, limit: PAGE_LIMIT });
            } else if (mode === 'nearby') {
                const c = await ensureCoords();
                // bail if a newer request started while we were waiting on location/coords
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

            // a newer fetchPage call superseded this one — drop this stale response
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
        <Screen>
            <Header title="Jobs" onBack={() => navigation.goBack()} />

            <FlatList
                data={jobs}
                keyExtractor={(item, index) => item?._id ? String(item._id) : `job-${index}`}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                ListHeaderComponent={
                    <>
                        {/* <Hero
                            searchInput={searchInput}
                            onChangeSearch={setSearchInput}
                            onSubmit={runSearch}
                            onClear={clearSearch}
                        /> */}

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
                            <FilterBar
                                filters={filters}
                                onChange={setFilters}
                                onClear={() => setFilters({ sortBy: 'createdAt' })}
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
                    </>
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

function Hero({ searchInput, onChangeSearch, onSubmit, onClear }) {
    return (
        <View style={styles.hero}>
            <View style={styles.heroGlowTop} />
            <View style={styles.heroGlowBottom} />

            <View style={styles.heroBadge}>
                <Ionicons name="briefcase" size={13} color={COLORS.white} />
                <Text style={styles.heroBadgeText}>Live openings</Text>
            </View>

            <Text style={styles.heroTitle}>Find your next role</Text>
            <Text style={styles.heroSubtitle}>Handpicked jobs, updated every day</Text>

    
        </View>
    );
}

const styles = StyleSheet.create({
    list: { padding: SPACING.lg, flexGrow: 1 },

    hero: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    heroGlowTop: {
        position: 'absolute', top: -40, right: -40,
        width: 140, height: 140, borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    heroGlowBottom: {
        position: 'absolute', bottom: -50, left: -30,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    heroBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: RADIUS.full, marginBottom: SPACING.md,
    },
    heroBadgeText: { color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: '700' },
    heroTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white, lineHeight: FONTS.sizes.xxl * 1.15 },
    heroSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.primaryMid, marginTop: 6, marginBottom: SPACING.lg },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md, paddingVertical: 12,
        ...SHADOWS.sm,
    },
    searchInput: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.text },

    modeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
    modeChip: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
        paddingVertical: 10, borderRadius: RADIUS.lg,
        backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    },
    modeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    modeChipText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary },
    modeChipTextActive: { color: COLORS.white },

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