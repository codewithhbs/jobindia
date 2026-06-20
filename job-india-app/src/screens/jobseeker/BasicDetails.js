import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../api/user.api';
import { useFetch } from '../../hooks/useFetch';

const BASE_SERVER = 'http://192.168.1.18:4000';

const FIELDS = [
  { key: 'name', label: 'Full Name', icon: 'person-outline', placeholder: 'Enter your name', keyboard: 'default', caps: 'words' },
  { key: 'email', label: 'Email', icon: 'mail-outline', placeholder: 'Enter your email', keyboard: 'email-address', caps: 'none' },
  { key: 'city', label: 'City', icon: 'location-outline', placeholder: 'Enter city', keyboard: 'default', caps: 'words' },
  { key: 'state', label: 'State', icon: 'map-outline', placeholder: 'Enter state', keyboard: 'default', caps: 'words' },
  { key: 'pincode', label: 'Pincode', icon: 'barcode-outline', placeholder: 'Enter pincode', keyboard: 'numeric', caps: 'none' },
];

export default function BasicDetails({ navigation }) {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const { data: profile, refetch } = useFetch(() => userApi.getProfile(), []);
  const user = profile?.user || {};

  const [saving, setSaving] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [coords, setCoords] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', city: '', state: '', pincode: '' });

  const isFocused = useRef(false);

  useFocusEffect(useCallback(() => {
    isFocused.current = true;
    refetch();
    return () => { isFocused.current = false; };
  }, []));

  useEffect(() => {
    if (!user?._id) return;
    setForm({
      name: user.name || '',
      email: user.email || '',
      city: user.location?.city || '',
      state: user.location?.state || '',
      pincode: user.location?.pincode || '',
    });
    if (user.avatar) {
      setAvatar({ uri: `${BASE_SERVER}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}` });
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      const info = {
        brand: Device.brand,
        model: Device.modelName,
        os: Device.osName,
        osVer: Device.osVersion,
        type: Device.deviceType === Device.DeviceType.PHONE ? 'phone'
          : Device.deviceType === Device.DeviceType.TABLET ? 'tablet'
            : Device.deviceType === Device.DeviceType.DESKTOP ? 'desktop'
              : 'unknown',
        platform: Platform.OS,
        isDevice: Device.isDevice,
      };
      setDeviceInfo(info);

      if (!Device.isDevice) return;

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
      if (projectId) await Notifications.getExpoPushTokenAsync({ projectId });

      const nativeToken = await Notifications.getDevicePushTokenAsync();
      setPushToken(nativeToken?.data || null);
    })();
  }, []);

  const fetchLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Location permission denied' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });

      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        setForm((p) => ({
          ...p,
          city: geo.city || geo.district || p.city,
          state: geo.region || p.state,
          pincode: geo.postalCode || p.pincode,
        }));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Location fetched' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not fetch location' });
    } finally {
      setLocLoading(false);
    }
  };

  const pickImage = useCallback(() => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        if (!isFocused.current) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ type: 'error', text1: 'Gallery permission denied' });
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          aspect: [1, 1],
        });
        if (!result.canceled) {
          setAvatar(result.assets[0]);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {
        Toast.show({ type: 'error', text1: 'Could not open gallery' });
      }
    });
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Toast.show({ type: 'error', text1: 'Name is required' });
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      if (pushToken) formData.append('fcmToken', pushToken);

      formData.append('location', JSON.stringify({
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      }));
      if (deviceInfo) formData.append('deviceInfo', JSON.stringify(deviceInfo));
      if (avatar?.uri && !avatar.uri.startsWith('http')) {
        formData.append('avtar', {
          uri: avatar.uri,
          name: avatar.fileName || 'avatar.jpg',
          type: avatar.mimeType || 'image/jpeg',
        });
      }

      const res = await userApi.updateProfile(formData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: res?.data?.message || 'Profile updated' });

      await refetch();
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const avatarUri = avatar?.uri || null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F4F6FF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : logout())}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#1A1D2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={44} color="#A0AACC" />
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <View style={styles.card}>
          {FIELDS.map((f, i) => (
            <View key={f.key} style={[styles.fieldWrap, i !== 0 && { marginTop: 16 }]}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name={f.icon} size={18} color="#9DA3C0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#C0C4D8"
                  keyboardType={f.keyboard}
                  autoCapitalize={f.caps}
                  value={form[f.key]}
                  onChangeText={(t) => setForm((p) => ({ ...p, [f.key]: t }))}
                  returnKeyType={i === FIELDS.length - 1 ? 'done' : 'next'}
                />
              </View>
            </View>
          ))}

          <View style={styles.locRow}>
            <TouchableOpacity
              style={[styles.locBtn, locLoading && { opacity: 0.6 }]}
              onPress={fetchLocation}
              disabled={locLoading}
              activeOpacity={0.8}
            >
              {locLoading ? (
                <ActivityIndicator size="small" color="#6B7FFF" />
              ) : (
                <Ionicons name="locate" size={16} color="#6B7FFF" />
              )}
              <Text style={styles.locBtnText}>
                {locLoading ? 'Fetching...' : coords ? 'Location fetched ✓' : 'Use my location'}
              </Text>
            </TouchableOpacity>

            {coords && (
              <Text style={styles.coordsText}>
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F4F6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E5F0',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1D2E' },

  scroll: { paddingHorizontal: 16 },

  avatarSection: { alignItems: 'center', marginTop: 16, marginBottom: 20 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E8EBFF', borderWidth: 3, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#6B7FFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarHint: { fontSize: 12, color: '#9DA3C0', fontWeight: '500' },

  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 20, marginBottom: 16,
    shadowColor: '#5B6FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  fieldWrap: {},
  fieldLabel: {
    fontSize: 12, fontWeight: '600', color: '#9DA3C0',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E5F0',
    borderRadius: 12, backgroundColor: '#F8F9FF', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#1A1D2E' },

  locRow: {
    marginTop: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
  },
  locBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EEF0FF', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#C8CFFF',
  },
  locBtnText: { fontSize: 13, color: '#6B7FFF', fontWeight: '600' },
  coordsText: { fontSize: 11, color: '#9DA3C0', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  saveBtn: {
    flexDirection: 'row', backgroundColor: '#5B6FFF',
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5B6FFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.5, elevation: 0, shadowOpacity: 0 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});