import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth.api';
import { toast } from '../../utils/toast';

export default function SettingsScreen({ navigation }) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const logoutAll = async () => {
    try { await authApi.logoutAll(); toast.success('Signed out everywhere'); logout(); }
    catch (e) { toast.error('Error', e.message); }
  };

  const confirmLogout = () =>
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);

  return (
    <Screen>
      <Header title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.group}>
          <Row icon="person-outline" label="Account" value={user?.phone} />
          <Row icon="shield-checkmark-outline" label="KYC Status" value={user?.kycStatus || 'not submitted'} />
        </View>
        <View style={styles.group}>
          <Row icon="help-buoy-outline" label="Help & Support" onPress={() => navigation.navigate('Support')} chevron />
          <Row icon="document-text-outline" label="Privacy Policy" onPress={() => navigation.navigate('Cms', { slug: 'privacy-policy', title: 'Privacy Policy' })} chevron />
          <Row icon="reader-outline" label="Terms & Conditions" onPress={() => navigation.navigate('Cms', { slug: 'terms-conditions', title: 'Terms' })} chevron />
        </View>
        <View style={styles.group}>
          <Row icon="phone-portrait-outline" label="Logout this device" danger onPress={confirmLogout} />
          <Row icon="log-out-outline" label="Logout all devices" danger onPress={logoutAll} />
        </View>
      </ScrollView>
    </Screen>
  );
}
function Row({ icon, label, value, onPress, chevron, danger }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.row}>
      <View style={[styles.icon, danger && { backgroundColor: COLORS.dangerLight }]}><Ionicons name={icon} size={18} color={danger ? COLORS.danger : COLORS.primary} /></View>
      <Text style={[styles.label, danger && { color: COLORS.danger }]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={COLORS.gray300} /> : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.lg },
  group: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  value: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
});
