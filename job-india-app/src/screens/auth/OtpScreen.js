import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import { registerForPushNotifications } from '../../services/notifications';
import { toast } from '../../utils/toast';

const LEN = 6;

export function OtpScreen({ route, navigation }) {
  const { phone, role } = route.params;
  const [digits, setDigits] = useState(Array(LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const inputs = useRef([]);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onChange = (text, i) => {
    const val = text.replace(/[^\d]/g, '');
    const next = [...digits];
    if (val.length > 1) {
      // paste
      val.split('').slice(0, LEN).forEach((d, idx) => { next[idx] = d; });
      setDigits(next);
      inputs.current[Math.min(val.length, LEN - 1)]?.focus();
      return;
    }
    next[i] = val;
    setDigits(next);
    if (val && i < LEN - 1) inputs.current[i + 1]?.focus();
  };

  const onKeyPress = (e, i) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const verify = async () => {
    const otp = digits.join('');
    if (otp.length !== LEN) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const data = await authApi.verifyOtp({ phone, otp, role, purpose: 'login' });
      await setSession(data);
      registerForPushNotifications().catch(() => {}); // fire and forget
      toast.success('Welcome!', 'Logged in successfully');
      // RootNavigator switches to the role stack automatically once authenticated.
    } catch (err) {
      toast.error('Verification failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const res = await authApi.sendOtp(phone, 'login');
      if (res?.otp) toast.info('Dev OTP', res.otp);
      setSeconds(30);
      toast.success('OTP resent');
    } catch (err) {
      toast.error('Could not resend', err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Verify Number" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.heading}>Enter OTP</Text>
        <Text style={styles.sub}>Sent to {phone}</Text>

        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              style={[styles.cell, d && styles.cellFilled]}
              keyboardType="number-pad"
              maxLength={i === 0 ? LEN : 1}
              value={d}
              onChangeText={(t) => onChange(t, i)}
              onKeyPress={(e) => onKeyPress(e, i)}
              autoFocus={i === 0}
            />
          ))}
        </View>

        <Button title="Verify & Continue" onPress={verify} loading={loading} size="lg" />

        <View style={styles.resend}>
          {seconds > 0 ? (
            <Text style={styles.resendText}>Resend OTP in {seconds}s</Text>
          ) : (
            <Pressable onPress={resend}>
              <Text style={[styles.resendText, { color: COLORS.primary, fontWeight: '700' }]}>Resend OTP</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: SPACING.xl, gap: SPACING.lg },
  heading: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text, marginTop: SPACING.lg },
  sub: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: SPACING.lg },
  cell: {
    width: 48, height: 56, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, textAlign: 'center', fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text,
  },
  cellFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  resend: { alignItems: 'center', marginTop: SPACING.sm },
  resendText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
});
