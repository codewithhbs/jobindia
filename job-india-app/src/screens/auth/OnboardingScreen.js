import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { adminApi } from '../../api/admin.api';
import { useFetch } from '../../hooks/useFetch';

const { width } = Dimensions.get('window');

// fallback slides — used if API has no data / fails / is still loading
const FALLBACK_SLIDES = [
  { key: '1', title: 'Find Jobs Near You', description: 'Discover thousands of verified jobs in your city and nearby areas.', icon: '📍' },
  { key: '2', title: 'Apply in One Tap', description: 'Upload your CV once and apply to jobs instantly. No long forms.', icon: '⚡' },
  { key: '3', title: 'Grow Your Career', description: 'Track applications, get interview updates, and land your dream job.', icon: '🚀' },
];

export function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { data, loading } = useFetch(() => adminApi.onboarding(), []);
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  // normalize API response → fall back to static slides if empty/missing
  const apiSlides = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const slides = apiSlides.length > 0
    ? apiSlides
      .filter((s) => s.isActive !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => ({
        key: s._id,
        title: s.title,
        description: s.description,
        image: s.image,
      }))
    : FALLBACK_SLIDES;

  const isLast = index === slides.length - 1;

  const next = () => {
    if (!isLast) {
      ref.current?.scrollToIndex({ index: index + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.skip, { top: insets.top + SPACING.md }]}
        onPress={() => navigation.replace('Login')}
        hitSlop={10}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={ref}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {item.image ? (
              <View style={styles.imageCard}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.image}
                  resizeMode="cover"
                />              </View>
            ) : (
              <LinearGradient colors={[COLORS.heroTop, COLORS.heroBot]} style={styles.iconCircle}>
                <Text style={{ fontSize: 56 }}>{item.icon || '✨'}</Text>
              </LinearGradient>
            )}
            <Text style={styles.title}>{item.title}</Text>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button title={isLast ? 'Get Started' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

export function SplashScreen() {
  return (
    <LinearGradient colors={[COLORS.heroTop, COLORS.heroBot]} style={styles.splash}>
     <View>
       <Text style={styles.splashLogo}>Job India</Text>
      <Text style={styles.splashTag}>Naukri ab aasaan</Text>
     </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  skip: { position: 'absolute', right: SPACING.xl, zIndex: 10 },
  skipText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxxl, gap: SPACING.lg },
  iconCircle: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  imageCard: {
    width: width - SPACING.xxxl * 2,
    height: 260,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    backgroundColor: "#fff",
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%', backgroundColor: 'transparent', },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  desc: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  footer: { padding: SPACING.xl, gap: SPACING.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gray300 },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  splashLogo: { fontSize: 40, fontWeight: '900', color: COLORS.white },
  splashTag: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.85)' },
});