import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';
import { ROLES } from '../../constants/config';
import { authApi } from '../../api/auth.api';
import { adminApi } from '../../api/admin.api';
import { useFetch } from '../../hooks/useFetch';
import { isValidPhone, normalizePhone } from '../../utils/validators';
import { toast } from '../../utils/toast';

const ROLE_OPTIONS = [
  {
    role: ROLES.JOBSEEKER,
    label: 'Find a Job',
    desc: 'Browse & apply to lakhs of openings',
    icon: 'briefcase-outline',
  },
  {
    role: ROLES.EMPLOYER,
    label: 'Hire Talent',
    desc: 'Post jobs & find candidates fast',
    icon: 'business-outline',
  },
  {
    role: ROLES.DRIVER,
    label: 'Driver Jobs',
    desc: 'Driving & delivery gigs near you',
    icon: 'car-outline',
  },
];

export function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(ROLES.JOBSEEKER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: setting } = useFetch(() => adminApi.publicSettings(), []);
  const appName = setting?.app_name || 'Job India';
  const brandColor = setting?.primary_color || COLORS.primary;

  const onContinue = async () => {
    const e164 = normalizePhone(phone);
    if (!isValidPhone(e164)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.sendOtp(e164, 'login');
      if (res?.otp) toast.info('Dev OTP', res.otp); // dev convenience
      navigation.navigate('Otp', { phone: e164, role });
    } catch (err) {
      toast.error('Could not send OTP', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openLegal = (slug, title) => {
    navigation.navigate('Cms', { slug, title });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[COLORS.heroTop, COLORS.heroBot]} style={styles.hero}>
          <View style={styles.logoBadge}>
            <Ionicons name="briefcase" size={26} color={COLORS.white} />
          </View>
          <Text style={styles.logo}>{appName}</Text>
          <Text style={styles.tag}>Lakhs of jobs. One app.</Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.heading}>Login or Sign up</Text>
          <Text style={styles.sub}>We'll send an OTP to verify your number</Text>

          <View style={styles.phoneRow}>
            <View style={styles.cc}>
              <Text style={styles.ccText}>🇮🇳 +91</Text>
            </View>
            <Input
              placeholder="Mobile number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
              icon="call-outline"
              error={error}
              containerStyle={{ flex: 1 }}
            />
          </View>

          <Text style={styles.label}>I want to</Text>
          <View style={{ gap: SPACING.md }}>
            {ROLE_OPTIONS.map((o) => (
              <RoleCard
                key={o.role}
                option={o}
                active={role === o.role}
                brandColor={brandColor}
                onPress={() => setRole(o.role)}
              />
            ))}
          </View>

          <Button
            title="Continue"
            onPress={onContinue}
            loading={loading}
            size="lg"
            style={{ marginTop: SPACING.lg }}
          />

          <Text style={styles.terms}>
            By continuing you agree to our{' '}
            <Text style={styles.termsLink} onPress={() => openLegal('terms-conditions', 'Terms of Service')}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.termsLink} onPress={() => openLegal('privacy-policy', 'Privacy Policy')}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleCard({ option, active, brandColor, onPress }) {
  return (
    <View
      style={[
        styles.roleCard,
        active && {
          borderColor: brandColor,
          backgroundColor: COLORS.primaryLight,
          ...SHADOWS.sm,
        },
      ]}
      onTouchEnd={onPress}
    >
      <View style={[styles.roleIconWrap, active && { backgroundColor: brandColor }]}>
        <Ionicons name={option.icon} size={22} color={active ? COLORS.white : brandColor} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.roleLabel, active && { color: brandColor }]}>{option.label}</Text>
        <Text style={styles.roleDesc}>{option.desc}</Text>
      </View>

      <View style={[styles.radioOuter, active && { borderColor: brandColor }]}>
        {active && <View style={[styles.radioInner, { backgroundColor: brandColor }]} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: COLORS.background ,paddingBottom:50},

  hero: {
    paddingTop: 64,
    paddingBottom: 44,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  logo: { fontSize: 28, fontWeight: '900', color: COLORS.white },
  tag: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: FONTS.sizes.md },

  body: { padding: SPACING.xl, gap: SPACING.md },
  heading: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginBottom: SPACING.md },

  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  cc: {
    height: 52,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ccText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },

  label: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  roleIconWrap: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  roleDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 1 },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 11, height: 11, borderRadius: 6 },

  terms: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
  },
  termsLink: { color: COLORS.primary, fontWeight: '700' },
});