import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { employerApi } from '../../api/employer.api';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toast';
import { Loader, Screen } from '../../components/ui/Screen';
import { Badge, Card, Input } from '../../components/ui';

export function EmployerProfileScreen({ navigation }) {
  const logout = useAuthStore((s) => s.logout);
  const { data: profile, loading } = useFetch(() => employerApi.me(), []);
  const [form, setForm] = useState({ companyName: '', industry: '', website: '', description: '', gstNumber: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (profile) setForm({
      companyName: profile.companyName || '', industry: profile.industry || '',
      website: profile.website || '', description: profile.description || '', gstNumber: profile.gstNumber || '',
    });
  }, [profile]);

  const save = async () => {
    if (!form.companyName) return toast.error('Company name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      await employerApi.update(fd);
      toast.success('Saved', 'Company profile updated');
    } catch (e) {
      toast.error('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) return <Screen><Header title="Company Profile" onBack={() => navigation.goBack()} /><Loader /></Screen>;

  return (
    <Screen>
      <Header title="Company Profile" onBack={() => navigation.goBack()} right={<Badge label={profile?.verificationStatus || 'not submitted'} color={profile?.verificationStatus === 'approved' ? COLORS.success : COLORS.accent} />} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: SPACING.md }}>
          <Input label="Company Name *" value={form.companyName} onChangeText={set('companyName')} />
          <Input label="Industry" placeholder="e.g. Logistics" value={form.industry} onChangeText={set('industry')} />
          <Input label="Website" placeholder="https://" value={form.website} onChangeText={set('website')} autoCapitalize="none" />
          <Input label="GST Number" value={form.gstNumber} onChangeText={set('gstNumber')} autoCapitalize="characters" />
          <Input label="About Company" value={form.description} onChangeText={set('description')} multiline style={{ minHeight: 90, textAlignVertical: 'top' }} />
        </Card>
        <Button title="Save Profile" onPress={save} loading={saving} size="lg" />
        <Pressable style={styles.logout} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.md },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: FONTS.sizes.md },
});
