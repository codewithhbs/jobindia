import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable, BackHandler, Alert, Modal, FlatList, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';
import { driverApi } from '../../api/driver.api';
import { adminApi } from '../../api/admin.api';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toast';
import { Loader, Screen } from '../../components/ui/Screen';
import { Badge, Card, Chip, Input } from '../../components/ui';

const VEHICLES = ['bike', 'auto', 'car', 'bus'];
const VEHICLE_CATEGORIES = [
  { value: 'manual', label: 'Manual' },
  { value: 'auto', label: 'Auto' },
  { value: 'luxury', label: 'Luxury' },
];
const DUTY_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'local_outstation', label: 'Local / Outstation' },
  { value: 'both', label: 'Both' },
];
const DOCS = [
  { id: 'aadhar_front', label: 'Aadhaar Front' },
  { id: 'aadhar_back', label: 'Aadhaar Back' },
  { id: 'drivingLicense_front', label: 'Licence Front' },
  { id: 'drivingLicense_back', label: 'Licence Back' },
  { id: 'pan_card', label: 'Pan card' },

];

// ---- Multi-select modal: same modal sheet pattern, but checkboxes + Done button instead of close-on-tap ----
function MultiSelectField({ label, value = [], options, onChange, placeholder = 'Select' }) {
  const [visible, setVisible] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [search, setSearch] = useState('');

  const openSheet = () => {
    setTempValue(value);
    setSearch('');
    setVisible(true);
  };

  const toggle = (val) => {
    setTempValue((arr) => (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]));
  };

  const confirm = () => {
    onChange(tempValue);
    setVisible(false);
  };

  const filteredOptions = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = value.length
    ? options.filter((o) => value.includes(o.value)).map((o) => o.label).join(', ')
    : '';

  return (
    <View style={{ gap: SPACING.xs }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}

      <Pressable onPress={openSheet} style={styles.pickerBox}>
        <Text numberOfLines={1} style={[styles.pickerBoxText, !selectedLabel && { color: COLORS.textLight }]}>
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.textLight} />
      </Pressable>

      <Modal visible={visible} transparent animationType="none" onRequestClose={() => setVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={styles.sheetCancel}>Cancel</Text>
              </Pressable>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{placeholder}</Text>
              <Pressable onPress={confirm}>
                <Text style={styles.sheetDone}>Done</Text>
              </Pressable>
            </View>

            <View style={styles.sheetSearchWrap}>
              <Ionicons name="search" size={16} color={COLORS.textLight} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search..."
                placeholderTextColor={COLORS.textLight}
                style={styles.sheetSearchInput}
                autoFocus
              />
              {search ? (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(opt) => String(opt.value)}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 320 }}
              ListEmptyComponent={<Text style={styles.sheetEmpty}>No results</Text>}
              renderItem={({ item: opt }) => {
                const checked = tempValue.includes(opt.value);
                return (
                  <Pressable
                    onPress={() => toggle(opt.value)}
                    style={[styles.sheetItem, checked && { backgroundColor: COLORS.primaryLight }]}
                  >
                    <Text style={{ color: checked ? COLORS.primary : COLORS.text, fontWeight: '600' }}>
                      {opt.label}
                    </Text>
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={checked ? COLORS.primary : COLORS.textLight}
                    />
                  </Pressable>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default function DriverProfileScreen({ navigation, route }) {
  const logout = useAuthStore((s) => s.logout);
  const nav = useNavigation();
  const forced = route?.params?.forced;
  const { data: profile, loading } = useFetch(() => driverApi.me(), []);
  const { data: categories } = useFetch(() => adminApi.categories(true), []);
  const [form, setForm] = useState({
    aadharNumber: '', panNumber: '', licenseNrumber: '',
    currentSalary: '', expectedSalary: '', experience: '',
  });
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [available, setAvailable] = useState(true);
  const [bikeAvailable, setBikeAvailable] = useState(false);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [dutyType, setDutyType] = useState('');
  const [preferredCategories, setPreferredCategories] = useState([]);
  const [docs, setDocs] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const categoryOptions = (categories || []).map((c) => ({ value: c.name, label: c.name }));

  useEffect(() => {
    if (profile) {
      setForm({
        aadharNumber: profile.aadharNumber || '', panNumber: profile.panNumber || '',
        licenseNumber: profile.licenseNumber || '',
        currentSalary: String(profile.currentSalary || ''),
        expectedSalary: String(profile.expectedSalary || ''),
        experience: String(profile.yearsOfExperience || ''),
      });
      setVehicleTypes(profile.vehicleTypes || []);
      setAvailable(profile.isAvailable ?? true);
      setBikeAvailable(profile.isBikeAvailable ?? false);
      setVehicleCategories(profile.vehicleCategories || []);
      setDutyType(profile.dutyType || '');
      setPreferredCategories(profile.preferredCategories || []);
    }
  }, [profile]);

  // forced screen pe back disable + gesture off
  useEffect(() => {
    if (forced) {
      nav.setOptions({ gestureEnabled: false });
    }
  }, [forced, nav]);

  const showForcedBackAlert = () => {
    Alert.alert(
      'KYC incomplete',
      'Aapne KYC submit nahi kiya hai. Wapas jaane ke liye logout karna hoga.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
    return true; // consume back event, default back kabhi nahi hone dena
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!forced) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', showForcedBackAlert);
      return () => sub.remove();
    }, [forced])
  );

  const toggleVehicle = (v) => setVehicleTypes((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));

  const toggleVehicleCategory = (v) =>
    setVehicleCategories((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));

  const pickDoc = async (docId) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (res.canceled) return;
    setDocs((d) => ({ ...d, [docId]: res.assets[0] }));
  };

  const toggleAvailability = async (val) => {
    setAvailable(val);
    try { await driverApi.setAvailability(val); } catch (e) { setAvailable(!val); toast.error('Error', e.message); }
  };

  const missingDocs = DOCS.filter((d) => {
    const existing = profile?.documents?.find((x) => x.fieldId === d.id);
    return !docs[d.id] && !existing;
  });
  const save = async () => {
    if (!form.aadharNumber.trim()) {
      toast.error('Aadhar Number required', 'Please enter your Aadhar number');
      return;
    }
    if (!form.panNumber.trim()) {
      toast.error('Pan Number required', 'Please enter your Pan number');
      return;
    }
    if (!form.licenseNumber.trim()) {
      toast.error('Licence Number required', 'Please enter your Licence number');
      return;
    }
    if (!form.currentSalary.trim()) {
      toast.error('Current Salary required', 'Please enter your current salary');
      return;
    }
    if (!form.expectedSalary.trim()) {
      toast.error('Expected Salary required', 'Please enter your expected salary');
      return;
    }
    if (!form.experience.trim()) {
      toast.error('Experience required', 'Please enter your years of experience');
      return;
    }
    if (missingDocs.length) {
      toast.error('Documents required', `Please upload: ${missingDocs.map((d) => d.label).join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('aadharNumber', form.aadharNumber);
      fd.append('panNumber', form.panNumber);
      fd.append('licenseNumber', form.licenseNumber);
      fd.append('yearsOfExperience', form.experience || '0');
      fd.append('currentSalary', form.currentSalary || '0');
      fd.append('expectedSalary', form.expectedSalary || '0');
      fd.append('vehicleTypes', JSON.stringify(vehicleTypes));
      fd.append('isBikeAvailable', String(bikeAvailable));
      fd.append('vehicleCategories', JSON.stringify(vehicleCategories));
      fd.append('dutyType', dutyType);
      fd.append('preferredCategories', JSON.stringify(preferredCategories));
      Object.entries(docs).forEach(([id, file]) => {
        fd.append(id, { uri: file.uri, name: `${id}.jpg`, type: 'image/jpeg' });
      });
      await driverApi.update(fd);
      toast.success('Saved', 'Profile submitted for verification');
      // forced unlock: parent ka kycStatus refetch trigger karo agar context/event se available ho

      if (forced) {
        nav.setOptions({ gestureEnabled: true });
        nav.setParams({ forced: false });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Tabs', state: { index: 0, routes: [{ name: 'Home' }] } }],
        });
      } else {
        nav.setOptions({ gestureEnabled: true });
        nav.setParams({ forced: false });
        navigation.goBack();
      }
    } catch (e) {
      toast.error('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) return <Screen><Header title="Driver Profile" /><Loader /></Screen>;

  return (
    <Screen>
      <Header
        title="Driver Profile"
        onBack={forced ? showForcedBackAlert : undefined}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={styles.switchRow}>
            <View><Text style={styles.switchTitle}>Available for work</Text><Text style={styles.switchSub}>Toggle off when busy</Text></View>
            <Switch value={available} onValueChange={toggleAvailability} trackColor={{ true: COLORS.primary }} />
          </View>
        </Card>

        <Card>
          <View style={styles.switchRow}>
            <View><Text style={styles.switchTitle}>Bike Available</Text><Text style={styles.switchSub}>Do you have your own bike?</Text></View>
            <Switch value={bikeAvailable} onValueChange={setBikeAvailable} trackColor={{ true: COLORS.primary }} />
          </View>
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Vehicle Types</Text>
          {/* <View style={styles.chips}>
            {VEHICLES.map((v) => <Chip key={v} label={v} active={vehicleTypes.includes(v)} onPress={() => toggleVehicle(v)} />)}
          </View> */}
          <Input label="Aadhar Number" placeholder="1234 456789 1234" value={form.aadharNumber} onChangeText={set('aadharNumber')} autoCapitalize="characters" />
          <Input label="Pan Number" placeholder="AWERT1365E" value={form.panNumber} onChangeText={set('panNumber')} />
          <Input label="Licence Number" value={form.licenseNumber} onChangeText={set('licenseNumber')} autoCapitalize="characters" />
          <Input label="Current Salery" keyboardType="number-pad" value={form.currentSalary} onChangeText={set('currentSalary')} />
          <Input label="Expected Salary" keyboardType="number-pad" value={form.expectedSalary} onChangeText={set('expectedSalary')} />

          <Input label="Experience (years)" keyboardType="number-pad" value={form.experience} onChangeText={set('experience')} />
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Vehicle Category</Text>
          <View style={styles.chips}>
            {VEHICLE_CATEGORIES.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                active={vehicleCategories.includes(c.value)}
                onPress={() => toggleVehicleCategory(c.value)}
              />
            ))}
          </View>
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Duty Type</Text>
          <View style={styles.chips}>
            {DUTY_TYPES.map((d) => (
              <Chip
                key={d.value}
                label={d.label}
                active={dutyType === d.value}
                onPress={() => setDutyType(d.value)}
              />
            ))}
          </View>
        </Card>

        {categoryOptions.length ? (
          <Card style={{ gap: SPACING.md }}>
            <Text style={styles.sectionTitle}>Preferred Job Categories</Text>
            <MultiSelectField
              value={preferredCategories}
              options={categoryOptions}
              onChange={setPreferredCategories}
              placeholder="Select categories"
            />
          </Card>
        ) : null}

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Documents (KYC) <Text style={styles.required}>*Required</Text></Text>
          {DOCS.map((d) => {
            const existing = profile?.documents?.find((x) => x.fieldId === d.id);
            const picked = docs[d.id];
            return (
              <Pressable key={d.id} style={styles.docRow} onPress={() => pickDoc(d.id)}>
                <Ionicons name={picked || existing ? 'checkmark-circle' : 'cloud-upload-outline'} size={20} color={picked || existing ? COLORS.success : COLORS.primary} />
                <Text style={styles.docLabel}>{d.label}</Text>
                {existing && !picked ? <Badge label={existing.verificationStatus} color={COLORS.accent} /> : picked ? <Badge label="Selected" color={COLORS.success} /> : <Text style={styles.upload}>Upload</Text>}
              </Pressable>
            );
          })}
        </Card>

        <Button title="Save & Submit" onPress={save} loading={saving} size="lg" />
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  switchSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  required: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg },
  docLabel: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text, fontWeight: '600' },
  upload: { color: COLORS.primary, fontWeight: '700' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.md },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: FONTS.sizes.md },

  fieldLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  pickerBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pickerBoxText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: '600' },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: SPACING.lg + 31,
    ...SHADOWS.md,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sheetCancel: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  sheetDone: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
  sheetSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sheetSearchInput: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.text, paddingVertical: 4 },
  sheetEmpty: { padding: 16, fontSize: 14, color: COLORS.textLight, textAlign: 'center' },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
});