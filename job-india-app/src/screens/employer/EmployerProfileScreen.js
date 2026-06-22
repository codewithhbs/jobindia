import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from '../../components/ui/AppAlert';

import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { employerApi } from '../../api/employer.api';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toast';
import { Loader, Screen } from '../../components/ui/Screen';
import { Badge, Card, Input, Select } from '../../components/ui';

const COMPANY_SIZE_OPTIONS = [
  { label: '1-10 employees', value: '1-10' },
  { label: '11-50 employees', value: '11-50' },
  { label: '51-200 employees', value: '51-200' },
  { label: '201-500 employees', value: '201-500' },
  { label: '500+ employees', value: '500+' },
];

const EMPTY_FORM = {
  companyName: '',
  industry: '',
  companySize: '',
  website: '',
  description: '',
  foundedYear: '',
  gstNumber: '',
  panNumber: '',
  contactPerson: { name: '', designation: '', email: '', phone: '' },
  address: { street: '', city: '', state: '', country: 'India', pincode: '' },
};
const BASE_SERVER = 'https://jobapi.adsdigitalmedia.com';

export function EmployerProfileScreen({ navigation }) {
  const logout = useAuthStore((s) => s.logout);
  const { data: profile, loading, refetch } = useFetch(() => employerApi.me(), []);

  const [form, setForm] = useState(EMPTY_FORM);
  const [logo, setLogo] = useState(null); // { uri, name, type } when freshly picked
  const [saving, setSaving] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (group, k) => (v) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [k]: v } }));

  useEffect(() => {
    if (!profile) return;
    setForm({
      companyName: profile.companyName || '',
      industry: profile.industry || '',
      companySize: profile.companySize || '',
      website: profile.website || '',
      description: profile.description || '',
      foundedYear: profile.foundedYear ? String(profile.foundedYear) : '',
      gstNumber: profile.gstNumber || '',
      panNumber: profile.panNumber || '',
      contactPerson: {
        name: profile.contactPerson?.name || '',
        designation: profile.contactPerson?.designation || '',
        email: profile.contactPerson?.email || '',
        phone: profile.contactPerson?.phone || '',
      },
      address: {
        street: profile.address?.street || '',
        city: profile.address?.city || '',
        state: profile.address?.state || '',
        country: profile.address?.country || 'India',
        pincode: profile.address?.pincode || '',
      },
    });
  }, [profile]);

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Permission needed', 'Allow gallery access to upload a logo');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    const ext = asset.uri.split('.').pop() || 'jpg';
    setLogo({
      uri: asset.uri,
      name: `company-logo.${ext}`,
      type: asset.mimeType || `image/${ext}`,
    });
  };

  const removeLogo = () => {
    Alert.show({
      variant: 'danger',
      icon: 'trash-outline',
      title: 'Remove logo',
      message: 'This will remove your company logo selection before saving.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setLogo(null) },
      ],
    });
  };

  const save = async () => {
    if (!form.companyName.trim()) return toast.error('Company name is required');
    setSaving(true);
    try {
      const fd = new FormData();

      const flatFields = [
        'companyName', 'industry', 'companySize', 'website',
        'description', 'gstNumber', 'panNumber',
      ];
      flatFields.forEach((k) => {
        if (form[k]) fd.append(k, form[k]);
      });

      if (form.foundedYear) fd.append('foundedYear', String(parseInt(form.foundedYear, 10) || ''));

      fd.append('contactPerson', JSON.stringify(form.contactPerson));
      fd.append('address', JSON.stringify(form.address));

      if (logo) {
        fd.append('companyLogo', { uri: logo.uri, name: logo.name, type: logo.type });
      }

      await employerApi.update(fd);
      toast.success('Saved', 'Company profile updated');
      setLogo(null);
      refetch()
      navigation.replace('EmployerProfile');
    } catch (e) {
      toast.error('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.show({
      variant: 'danger',
      icon: 'log-out-outline',
      title: 'Logout',
      message: 'Are you sure you want to logout of your employer account?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ],
    });
  };

  if (loading && !profile) {
    return (
      <Screen>
        <Header title="Company Profile" onBack={() => navigation.goBack()} />
        <Loader />
      </Screen>
    );
  }

  const logoUri = logo?.uri || `${BASE_SERVER}${profile?.companyLogo}` || null;

  return (
    <Screen>
      <Header
        title="Company Profile"
        onBack={() => navigation.goBack()}
        right={
          <Badge
            label={profile?.verificationStatus || 'not submitted'}
            color={profile?.verificationStatus === 'approved' ? COLORS.success : COLORS.accent}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo upload */}
        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Company Logo</Text>
          <View style={styles.logoRow}>
            <Pressable style={styles.logoPreview} onPress={pickLogo}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <Ionicons name="business-outline" size={28} color={COLORS.textMuted} />
              )}
            </Pressable>
            <View style={{ flex: 1, gap: SPACING.sm }}>
              <Button title={logoUri ? 'Change Logo' : 'Upload Logo'} onPress={pickLogo} size="sm" variant="outline" />
              {logoUri && (
                <Pressable onPress={removeLogo} style={styles.removeLogoBtn}>
                  <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                  <Text style={styles.removeLogoText}>Remove</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Card>

        {/* Basic details */}
        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Company Details</Text>
          <Input label="Company Name *" value={form.companyName} onChangeText={set('companyName')} />
          <Input label="Industry" placeholder="e.g. Logistics" value={form.industry} onChangeText={set('industry')} />
          <Select
            label="Company Size"
            value={form.companySize}
            options={COMPANY_SIZE_OPTIONS}
            onChange={set('companySize')}
            placeholder="Select company size"
          />
          <Input label="Founded Year" placeholder="e.g. 2015" value={form.foundedYear} onChangeText={set('foundedYear')} keyboardType="number-pad" />
          <Input label="Website" placeholder="https://" value={form.website} onChangeText={set('website')} autoCapitalize="none" />
          <Input
            label="About Company"
            value={form.description}
            onChangeText={set('description')}
            multiline
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />
        </Card>

        {/* Legal / compliance */}
        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Legal Information</Text>
          <Input label="GST Number" value={form.gstNumber} onChangeText={set('gstNumber')} autoCapitalize="characters" />
          <Input label="PAN Number" value={form.panNumber} onChangeText={set('panNumber')} autoCapitalize="characters" />
        </Card>

        {/* Contact person */}
        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Contact Person</Text>
          <Input label="Name" value={form.contactPerson.name} onChangeText={setNested('contactPerson', 'name')} />
          <Input label="Designation" placeholder="e.g. HR Manager" value={form.contactPerson.designation} onChangeText={setNested('contactPerson', 'designation')} />
          <Input label="Email" value={form.contactPerson.email} onChangeText={setNested('contactPerson', 'email')} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Phone" value={form.contactPerson.phone} onChangeText={setNested('contactPerson', 'phone')} keyboardType="phone-pad" />
        </Card>

        {/* Address */}
        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Company Address</Text>
          <Input label="Street" value={form.address.street} onChangeText={setNested('address', 'street')} />
          <Input label="City" value={form.address.city} onChangeText={setNested('address', 'city')} />
          <Input label="State" value={form.address.state} onChangeText={setNested('address', 'state')} />
          <Input label="Country" value={form.address.country} onChangeText={setNested('address', 'country')} />
          <Input label="Pincode" value={form.address.pincode} onChangeText={setNested('address', 'pincode')} keyboardType="number-pad" />
        </Card>

        <Button title="Save Profile" onPress={save} loading={saving} size="lg" />

        <Pressable style={styles.logout} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  logoPreview: {
    width: 72, height: 72, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  logoImage: { width: '100%', height: '100%' },
  removeLogoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removeLogoText: { color: COLORS.danger, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.md },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: FONTS.sizes.md },
});