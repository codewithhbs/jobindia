import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Badge, Avatar } from '../../components/ui';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { useLocation } from '../../hooks/useLocation';
import { formatSalary, jobLocation } from '../../utils/format';
import { toast } from '../../utils/toast';
import { Screen } from '../../components/ui/Screen';

// optional haptics — safe if expo-haptics not installed
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch (_e) {}
const tap = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch (_e) {} };

const DEFAULT_REGION = { latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.15, longitudeDelta: 0.15 };

// short salary label for marker pill, e.g. "₹8-12k", "₹45k+"
function shortSalary(salary) {
  if (!salary) return 'Job';
  const min = salary.min ?? salary.from ?? salary;
  const max = salary.max ?? salary.to;
  const fmt = (n) => {
    if (!n || isNaN(n)) return null;
    if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return `${n}`;
  };
  const a = fmt(min);
  const b = fmt(max);
  if (a && b && a !== b) return `₹${a}-${b}`;
  if (a) return `₹${a}`;
  return 'Job';
}

// ---- custom map marker: briefcase pin + tricolor accent + salary pill ----
function JobMarker({ job, selected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.18 : 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 180,
    }).start();
  }, [selected]);

  return (
    <Marker
      coordinate={{
        latitude: job.location.coordinates[1],
        longitude: job.location.coordinates[0],
      }}
      onPress={(e) => { e.stopPropagation(); onPress(job); }}
      anchor={{ x: 0.5, y: 1 }} // tip of the pin touches the coordinate
      tracksViewChanges={false} // perf: flip to true only while animating if needed
    >
      <Animated.View style={[styles.markerWrap, { transform: [{ scale }] }]}>
        {/* salary pill above the pin */}
        <View style={[styles.salaryPill, selected && styles.salaryPillActive]}>
          <Text style={[styles.salaryPillText, selected && styles.salaryPillTextActive]} numberOfLines={1}>
            {shortSalary(job.salary)}
          </Text>
        </View>

        {/* pin body */}
        <View style={[styles.pinBody, selected && styles.pinBodyActive]}>
          <Ionicons name="briefcase" size={16} color="#fff" />
          {/* tricolor strip — saffron / white / green, India touch */}
          <View style={styles.tricolorStrip}>
            <View style={[styles.stripBand, { backgroundColor: '#FF9933' }]} />
            <View style={[styles.stripBand, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.stripBand, { backgroundColor: '#138808' }]} />
          </View>
        </View>

        {/* pin tail */}
        <View style={[styles.pinTail, selected && styles.pinTailActive]} />
      </Animated.View>
    </Marker>
  );
}

// ---- animated bottom card ----
function JobCard({ job, bottomInset, onClose, onOpen }) {
  const ty = useRef(new Animated.Value(140)).current; // start below screen
  const opacity = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.spring(ty, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180, mass: 0.8 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const animateOut = (cb) => {
    Animated.parallel([
      Animated.timing(ty, { toValue: 160, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => cb && cb());
  };

  // entrance + re-trigger on job change
  useEffect(() => {
    tap();
    ty.setValue(140); opacity.setValue(0);
    animateIn();
  }, [job._id]);

  const close = () => animateOut(onClose);

  // swipe-down to dismiss
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => { if (g.dy > 0) ty.setValue(g.dy); },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 70 || g.vy > 0.6) animateOut(onClose);
        else Animated.spring(ty, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.card,
        { bottom: bottomInset + SPACING.md, opacity, transform: [{ translateY: ty }] },
      ]}
    >
      <View style={styles.handleWrap} {...pan.panHandlers}>
        <View style={styles.handle} />
      </View>

      <Pressable style={styles.closeBtn} hitSlop={10} onPress={close}>
        <Ionicons name="close" size={18} color={COLORS.textSecondary} />
      </Pressable>

      <Pressable onPress={onOpen}>
        <View style={styles.cardTop}>
          <Avatar uri={job.companyLogo} name={job.companyName || job.title} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.company} numberOfLines={1}>{job.companyName || 'Company'}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Badge label={formatSalary(job.salary)} color={COLORS.secondary} />
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>{jobLocation(job.location) || '—'}</Text>
          </View>
        </View>
      </Pressable>

      <Pressable style={styles.cta} onPress={onOpen}>
        <Text style={styles.ctaText}>View Details</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

export default function JobMapScreen({ navigation }) {
  const { request } = useLocation();
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let lat = DEFAULT_REGION.latitude;
        let lng = DEFAULT_REGION.longitude;
        try {
          const c = await request();
          lat = c.lat; lng = c.lng;
          setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.12, longitudeDelta: 0.12 });
        } catch (_e) { /* fall back to default region */ }

        const data = await jobsApi.nearby({ lat, lng, radius: 25000 });
        const withCoords = (Array.isArray(data) ? data : data?.data || []).filter(
          (j) => j.location?.coordinates?.length === 2
        );
        setJobs(withCoords);
      } catch (e) {
        toast.error('Could not load nearby jobs', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Jobs Near You" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            region={region}
            showsUserLocation
            onPress={() => setSelected(null)}
          >
            {jobs.map((job) => (
              <JobMarker
                key={job._id}
                job={job}
                selected={selected?._id === job._id}
                onPress={setSelected}
              />
            ))}
          </MapView>

          {loading && (
            <View style={[styles.loadingPill, { top: insets.top + SPACING.md }]}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.loadingText}>Finding jobs...</Text>
            </View>
          )}

          {selected && (
            <JobCard
              key={selected._id}
              job={selected}
              bottomInset={insets.bottom}
              onClose={() => setSelected(null)}
              onOpen={() => navigation.navigate('JobDetail', { jobId: selected._id })}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const PIN_SIZE = 38;

const styles = StyleSheet.create({
  loadingPill: {
    position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: SPACING.sm,
    alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, ...SHADOWS.md,
  },
  loadingText: { color: COLORS.text, fontWeight: '600', fontSize: FONTS.sizes.sm },

  // ---- custom marker ----
  markerWrap: { alignItems: 'center', width: 70 },
  salaryPill: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 4,
    maxWidth: 70,
    ...SHADOWS.sm,
  },
  salaryPillActive: {
    backgroundColor: COLORS.primary,
  },
  salaryPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  salaryPillTextActive: {
    color: '#fff',
  },
  pinBody: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  pinBodyActive: {
    backgroundColor: '#1A1A2E',
    borderColor: '#FF9933',
  },
  // thin tricolor strip along the bottom edge of the pin circle
  tricolorStrip: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    right: -2,
    height: 6,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stripBand: { flex: 1 },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
    marginTop: -1,
  },
  pinTailActive: {
    borderTopColor: '#1A1A2E',
  },

  card: {
    position: 'absolute', left: SPACING.lg, right: SPACING.lg,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, paddingTop: SPACING.sm,
    gap: SPACING.md, ...SHADOWS.lg,
  },
  handleWrap: { alignItems: 'center', paddingVertical: SPACING.xs },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.gray400 || '#ccc' },
  closeBtn: {
    position: 'absolute', top: SPACING.md, right: SPACING.md, zIndex: 2,
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingRight: 28 },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  company: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, flex: 1 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.lg,
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
});