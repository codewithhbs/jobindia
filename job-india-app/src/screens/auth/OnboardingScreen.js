import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  { key: '1', title: 'Find Jobs Near You', desc: 'Discover thousands of verified jobs in your city and nearby areas.', icon: '📍' },
  { key: '2', title: 'Apply in One Tap', desc: 'Upload your CV once and apply to jobs instantly. No long forms.', icon: '⚡' },
  { key: '3', title: 'Grow Your Career', desc: 'Track applications, get interview updates, and land your dream job.', icon: '🚀' },
];

export function OnboardingScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  const next = () => {
    if (index < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: index + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.skip} onPress={() => navigation.replace('Login')}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(i) => i.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <LinearGradient colors={[COLORS.heroTop, COLORS.heroBot]} style={styles.iconCircle}>
              <Text style={{ fontSize: 56 }}>{item.icon}</Text>
            </LinearGradient>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button title={index === SLIDES.length - 1 ? 'Get Started' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

export function SplashScreen() {
  return (
    <LinearGradient colors={[COLORS.heroTop, COLORS.heroBot]} style={styles.splash}>
      <Text style={styles.splashLogo}>Job India</Text>
      <Text style={styles.splashTag}>Naukri ab aasaan</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  skip: { position: 'absolute', top: 56, right: SPACING.xl, zIndex: 10 },
  skipText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxxl, gap: SPACING.lg },
  iconCircle: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
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
