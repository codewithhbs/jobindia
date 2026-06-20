import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import { registerForPushNotifications } from '../../services/notifications';
import { toast } from '../../utils/toast';

const LEN = 6;
const RESEND_SECONDS = 30;

export function OtpScreen({ route, navigation }) {
  const { phone, role } = route.params;
  const [digits, setDigits] = useState(Array(LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef([]);
  const verifiedRef = useRef(false);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = useCallback(async (otpValue) => {
    const otp = otpValue ?? digits.join('');
    if (otp.length !== LEN) return toast.error('Enter the 6-digit OTP');
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    setLoading(true);
    try {
      const data = await authApi.verifyOtp({ phone, otp, role, purpose: 'login' });
      await setSession(data);
      registerForPushNotifications().catch(() => {});
      toast.success('Welcome!', 'Logged in successfully');
      // RootNavigator switches to the role stack automatically once authenticated.
    } catch (err) {
      verifiedRef.current = false;
      toast.error('Verification failed', err.message);
    } finally {
      setLoading(false);
    }
  }, [digits, phone, role, setSession]);

  const onChange = (text, i) => {
    const val = text.replace(/[^\d]/g, '');

    if (val.length > 1) {
      // paste / autofill
      const next = [...digits];
      val.split('').slice(0, LEN).forEach((d, idx) => { next[idx] = d; });
      setDigits(next);
      const lastIndex = Math.min(val.length, LEN) - 1;
      inputs.current[Math.min(lastIndex + 1, LEN - 1)]?.focus();
      if (next.join('').length === LEN) verify(next.join(''));
      return;
    }

    const next = [...digits];
    next[i] = val;
    setDigits(next);

    if (val && i < LEN - 1) {
      inputs.current[i + 1]?.focus();
    }

    const joined = next.join('');
    if (joined.length === LEN && !joined.includes('')) {
      verify(joined);
    }
  };

  const onKeyPress = (e, i) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const resend = async () => {
    try {
      const res = await authApi.sendOtp(phone, 'login');
      if (res?.otp) toast.info('Dev OTP', res.otp);
      setDigits(Array(LEN).fill(''));
      verifiedRef.current = false;
      setSeconds(RESEND_SECONDS);
      inputs.current[0]?.focus();
      toast.success('OTP resent');
    } catch (err) {
      toast.error('Could not resend', err.message);
    }
  };

  const filledCount = digits.filter(Boolean).length;

  return (
    <Screen edges={['top']} noPadding>
      <Header title="Verify Number" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Icon + heading */}
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} />
        </View>
        <Text style={styles.heading}>Verify your number</Text>
        <Text style={styles.sub}>Enter the 6-digit code sent to</Text>

        <View style={styles.phoneChip}>
          <Ionicons name="call-outline" size={14} color={COLORS.primary} />
          <Text style={styles.phoneChipText}>{phone}</Text>
        </View>

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              style={[
                styles.cell,
                d && styles.cellFilled,
                focusedIndex === i && styles.cellFocused,
              ]}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
              maxLength={i === 0 ? LEN : 1}
              value={d}
              onChangeText={(t) => onChange(t, i)}
              onKeyPress={(e) => onKeyPress(e, i)}
              onFocus={() => setFocusedIndex(i)}
              autoFocus={i === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {Array.from({ length: LEN }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i < filledCount && styles.progressDotFilled]}
            />
          ))}
        </View>

        <Button
          title="Verify & Continue"
          onPress={() => verify()}
          loading={loading}
          size="lg"
          style={{ marginTop: SPACING.lg }}
        />

        <View style={styles.resend}>
          {seconds > 0 ? (
            <Text style={styles.resendText}>
              Resend OTP in <Text style={styles.resendTime}>{seconds}s</Text>
            </Text>
          ) : (
            <Pressable onPress={resend} hitSlop={8}>
              <Text style={styles.resendActive}>Resend OTP</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: SPACING.xl, alignItems: 'center' },

  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: `${COLORS.primary}14`,
    alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.xl,
  },

  heading: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  sub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  phoneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    marginTop: SPACING.sm,
  },
  phoneChipText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SPACING.xxl,
  },
  cell: {
    width: 46, height: 56, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
    fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text,
  },
  cellFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  cellFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.lg,
  },
  progressDot: {
    width: 18, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  progressDotFilled: { backgroundColor: COLORS.primary },

  resend: { alignItems: 'center', marginTop: SPACING.lg },
  resendText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  resendTime: { fontWeight: '700', color: COLORS.text },
  resendActive: { fontSize: FONTS.sizes.sm, fontWeight: '800', color: COLORS.primary },
});