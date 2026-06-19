import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';
import { ROLES } from '../../constants/config';
import { authApi } from '../../api/auth.api';
import { isValidPhone, normalizePhone } from '../../utils/validators';
import { toast } from '../../utils/toast';

const ROLE_OPTIONS = [
  { role: ROLES.JOBSEEKER, label: 'Find a Job', desc: 'I am looking for work', icon: 'briefcase-outline' },
  { role: ROLES.EMPLOYER, label: 'Hire Talent', desc: 'I want to post jobs', icon: 'business-outline' },
  { role: ROLES.DRIVER, label: 'Driver Jobs', desc: 'I drive / deliver', icon: 'car-outline' },
];

export function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(ROLES.JOBSEEKER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[COLORS.heroTop, COLORS.heroBot]} style={styles.hero}>
          <Text style={styles.logo}>Job India</Text>
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
              <RoleRow key={o.role} option={o} active={role === o.role} onPress={() => setRole(o.role)} />
            ))}
          </View>

          <Button title="Continue" onPress={onContinue} loading={loading} size="lg" style={{ marginTop: SPACING.lg }} />

          <Text style={styles.terms}>
            By continuing you agree to our Terms & Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleRow({ option, active, onPress }) {
  return (
    <View
      style={[styles.roleRow, active && { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight }]}
      onTouchEnd={onPress}
    >
      <View style={[styles.roleIcon, active && { backgroundColor: COLORS.primary }]}>
        <Ionicons name={option.icon} size={20} color={active ? COLORS.white : COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleLabel}>{option.label}</Text>
        <Text style={styles.roleDesc}>{option.desc}</Text>
      </View>
      <Ionicons
        name={active ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={active ? COLORS.primary : COLORS.gray300}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: COLORS.background },
  hero: { paddingTop: 72, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  logo: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  tag: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: FONTS.sizes.md },
  body: { padding: SPACING.xl, gap: SPACING.md },
  heading: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginBottom: SPACING.md },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  cc: { height: 52, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.surfaceAlt, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  ccText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  roleIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  roleLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  roleDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  terms: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textAlign: 'center', marginTop: SPACING.md },
});
