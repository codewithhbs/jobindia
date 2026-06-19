import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Badge, Avatar } from '../../components/ui';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { useLocation } from '../../hooks/useLocation';
import { formatSalary, jobLocation } from '../../utils/format';
import { toast } from '../../utils/toast';

const DEFAULT_REGION = { latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.15, longitudeDelta: 0.15 };

export default function JobMapScreen({ navigation }) {
  const { request } = useLocation();
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
        // keep only jobs with coordinates
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
            <Marker
              key={job._id}
              coordinate={{
                latitude: job.location.coordinates[1],
                longitude: job.location.coordinates[0],
              }}
              onPress={() => setSelected(job)}
              pinColor={COLORS.primary}
            />
          ))}
        </MapView>

        {loading && (
          <View style={styles.loadingPill}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.loadingText}>Finding jobs...</Text>
          </View>
        )}

        {selected && (
          <Pressable style={styles.card} onPress={() => navigation.navigate('JobDetail', { jobId: selected._id })}>
            <View style={styles.cardTop}>
              <Avatar uri={selected.companyLogo} name={selected.companyName || selected.title} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{selected.title}</Text>
                <Text style={styles.company} numberOfLines={1}>{selected.companyName || 'Company'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
            </View>
            <View style={styles.meta}>
              <Badge label={formatSalary(selected.salary)} color={COLORS.secondary} />
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{jobLocation(selected.location) || '—'}</Text>
              </View>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingPill: {
    position: 'absolute', top: SPACING.lg, alignSelf: 'center', flexDirection: 'row', gap: SPACING.sm,
    alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, ...SHADOWS.md,
  },
  loadingText: { color: COLORS.text, fontWeight: '600', fontSize: FONTS.sizes.sm },
  card: {
    position: 'absolute', left: SPACING.lg, right: SPACING.lg, bottom: SPACING.lg,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, gap: SPACING.md, ...SHADOWS.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  company: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
});
