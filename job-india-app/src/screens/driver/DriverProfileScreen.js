import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Input, Card, Loader, Chip, Badge } from '../../components/ui';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { driverApi } from '../../api/driver.api';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toast';

const VEHICLES = ['bike', 'auto', 'car', 'van', 'truck'];
const DOCS = [
  { id: 'aadhar_front', label: 'Aadhaar Front' },
  { id: 'aadhar_back', label: 'Aadhaar Back' },
  { id: 'drivingLicense_front', label: 'Licence Front' },
  { id: 'drivingLicense_back', label: 'Licence Back' },
];

export function DriverProfileScreen({ navigation }) {
  const logout = useAuthStore((s) => s.logout);
  const { data: profile, loading } = useFetch(() => driverApi.me(), []);
  const [form, setForm] = useState({ vehicleNumber: '', vehicleModel: '', licenseNumber: '', yearsOfExperience: '' });
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [available, setAvailable] = useState(true);
  const [docs, setDocs] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (profile) {
      setForm({
        vehicleNumber: profile.vehicleNumber || '', vehicleModel: profile.vehicleModel || '',
        licenseNumber: profile.licenseNumber || '', yearsOfExperience: String(profile.yearsOfExperience || ''),
      });
      setVehicleTypes(profile.vehicleTypes || []);
      setAvailable(profile.isAvailable ?? true);
    }
  }, [profile]);

  const toggleVehicle = (v) => setVehicleTypes((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));

  const pickDoc = async (docId) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (res.canceled) return;
    setDocs((d) => ({ ...d, [docId]: res.assets[0] }));
  };

  const toggleAvailability = async (val) => {
    setAvailable(val);
    try { await driverApi.setAvailability(val); } catch (e) { setAvailable(!val); toast.error('Error', e.message); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('vehicleNumber', form.vehicleNumber);
      fd.append('vehicleModel', form.vehicleModel);
      fd.append('licenseNumber', form.licenseNumber);
      fd.append('yearsOfExperience', form.yearsOfExperience || '0');
      fd.append('vehicleTypes', JSON.stringify(vehicleTypes));
      Object.entries(docs).forEach(([id, file]) => {
        fd.append(id, { uri: file.uri, name: `${id}.jpg`, type: 'image/jpeg' });
      });
      await driverApi.update(fd);
      toast.success('Saved', 'Profile submitted for verification');
    } catch (e) {
      toast.error('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) return <Screen><Header title="Driver Profile" /><Loader /></Screen>;

  return (
    <Screen>
      <Header title="Driver Profile" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={styles.switchRow}>
            <View><Text style={styles.switchTitle}>Available for work</Text><Text style={styles.switchSub}>Toggle off when busy</Text></View>
            <Switch value={available} onValueChange={toggleAvailability} trackColor={{ true: COLORS.primary }} />
          </View>
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Vehicle Types</Text>
          <View style={styles.chips}>
            {VEHICLES.map((v) => <Chip key={v} label={v} active={vehicleTypes.includes(v)} onPress={() => toggleVehicle(v)} />)}
          </View>
          <Input label="Vehicle Number" placeholder="DL01AB1234" value={form.vehicleNumber} onChangeText={set('vehicleNumber')} autoCapitalize="characters" />
          <Input label="Vehicle Model" placeholder="Honda Activa" value={form.vehicleModel} onChangeText={set('vehicleModel')} />
          <Input label="Licence Number" value={form.licenseNumber} onChangeText={set('licenseNumber')} autoCapitalize="characters" />
          <Input label="Experience (years)" keyboardType="number-pad" value={form.yearsOfExperience} onChangeText={set('yearsOfExperience')} />
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Documents (KYC)</Text>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg },
  docLabel: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text, fontWeight: '600' },
  upload: { color: COLORS.primary, fontWeight: '700' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.md },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: FONTS.sizes.md },
});
