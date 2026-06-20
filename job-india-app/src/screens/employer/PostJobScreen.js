import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { adminApi } from '../../api/admin.api';
import { toast } from '../../utils/toast';
import { Screen, Loader } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { Card, Chip, Input, Select } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/AppAlert';
const GOOGLE_MAPS_API_KEY = 'AIzaSyDnyLLiPykuaRbCKZEmBPa0jzdiB61qRpc';

const JOB_TYPES = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Internship', value: 'internship' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  jobType: 'full_time',
  vacancies: '1',
  salaryMin: '',
  salaryMax: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  latitude: '',
  longitude: '',
  skills: '',
  benefits: '',
  isRemote: false,
  isFeatured: false,
};

function getComponent(components, type) {
  const match = components?.find((c) => c.types.includes(type));
  return match?.long_name || '';
}

export function PostJobScreen({ navigation, route }) {
  const id = route?.params?.id; // undefined = create mode
  const editing = !!id;

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loadingJob, setLoadingJob] = useState(editing);
  const [saving, setSaving] = useState(false);

  // ── Address autocomplete state ───────────────────────────────────
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const sessionTokenRef = useRef(null);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // simple session token so Google bills autocomplete+details as one session
  const getSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return sessionTokenRef.current;
  };

  // ── Load categories ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setCategoriesLoading(true);
      try {
        const res = await adminApi.categories();
        setCategories((res || []).map((c) => ({ label: c.name, value: c.name })));
      } catch (e) {
        toast.error('Could not load categories', e.message);
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  // ── Load job for edit mode ───────────────────────────────────────
  useEffect(() => {
    if (!editing) return;
    (async () => {
      setLoadingJob(true);
      try {
        const j = await jobsApi.get(id);
        setForm({
          title: j.title || '',
          description: j.description || '',
          category: j.category?._id || j.category || '',
          jobType: j.jobType || 'full_time',
          vacancies: String(j.vacancies || 1),
          salaryMin: j.salary?.min != null ? String(j.salary.min) : '',
          salaryMax: j.salary?.max != null ? String(j.salary.max) : '',
          address: j.location?.address || '',
          city: j.location?.city || '',
          state: j.location?.state || '',
          country: j.location?.country || 'India',
          pincode: j.location?.pincode || '',
          latitude: j.location?.coordinates?.[1] != null ? String(j.location.coordinates[1]) : '',
          longitude: j.location?.coordinates?.[0] != null ? String(j.location.coordinates[0]) : '',
          skills: (j.requirements?.skills || []).join(', '),
          benefits: (j.benefits || []).join(', '),
          isRemote: !!j.location?.isRemote,
          isFeatured: !!j.isFeatured,
        });
        setAddressQuery(j.location?.address || '');
      } catch (e) {
        toast.error('Could not load job', e.message);
      } finally {
        setLoadingJob(false);
      }
    })();
  }, [id, editing]);

  // ── Places Autocomplete (debounced REST call) ────────────────────
  const fetchSuggestions = useCallback((text) => {
    if (!text || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearchingAddress(true);
    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(text)}` +
      `&components=country:in` +
      `&sessiontoken=${getSessionToken()}` +
      `&key=${GOOGLE_MAPS_API_KEY}`;

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'OK') {
          setSuggestions(json.predictions || []);
        } else if (json.status === 'ZERO_RESULTS') {
          setSuggestions([]);
        } else {
          // REQUEST_DENIED, INVALID_REQUEST, OVER_QUERY_LIMIT etc.
          setSuggestions([]);
        }
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSearchingAddress(false));
  }, []);

  const onAddressChange = (text) => {
    setAddressQuery(text);
    set('address')(text);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 400);
  };

  const onSelectSuggestion = async (placeId, description) => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    setSuggestions([]);
    setAddressQuery(description);
    set('address')(description);

    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${placeId}` +
        `&fields=formatted_address,address_components,geometry` +
        `&sessiontoken=${getSessionToken()}` +
        `&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.status !== 'OK') {
        toast.error('Could not fetch address details');
        return;
      }

      const place = json.result;
      const components = place.address_components;
      const city =
        getComponent(components, 'locality') ||
        getComponent(components, 'administrative_area_level_2') ||
        getComponent(components, 'sublocality');
      const state = getComponent(components, 'administrative_area_level_1');
      const country = getComponent(components, 'country') || 'India';
      const pincode = getComponent(components, 'postal_code');

      setForm((f) => ({
        ...f,
        address: place.formatted_address || f.address,
        city: city || f.city,
        state: state || f.state,
        country,
        pincode: pincode || f.pincode,
        latitude: place.geometry?.location?.lat != null ? String(place.geometry.location.lat) : f.latitude,
        longitude: place.geometry?.location?.lng != null ? String(place.geometry.location.lng) : f.longitude,
      }));

      // new session after a completed selection
      sessionTokenRef.current = null;
    } catch (e) {
      toast.error('Could not fetch address details');
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
  console.log(form.category)
  const submit = async () => {
    if (!form.title.trim()) return toast.error('Job title is required');
    if (!form.description.trim()) return toast.error('Description is required');
    if (!form.category) return toast.error('Please select a category');

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        jobType: form.jobType,
        vacancies: Number(form.vacancies) || 1,
        location: {
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          pincode: form.pincode,
          isRemote: form.isRemote,
          ...(form.latitude && form.longitude
            ? { coordinates: [Number(form.longitude), Number(form.latitude)] }
            : {}),
        },
        salary: {
          min: form.salaryMin ? Number(form.salaryMin) : undefined,
          max: form.salaryMax ? Number(form.salaryMax) : undefined,
          period: 'monthly',
        },
        requirements: {
          skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        },
        benefits: form.benefits.split(',').map((s) => s.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
        status: 'paused',
      };

      if (editing) {
        await jobsApi.update(id, payload);
        toast.success('Updated', 'Job details saved');
      } else {
        await jobsApi.create(payload);
        toast.success('Posted!', 'Your job is now live');
      }
      navigation.navigate('MyJobs');
    } catch (e) {
      Alert.show({
        variant: 'danger',
        title: 'Check Job Posting have Failed',
        message: e.message,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Ok', style: 'danger', onPress: Alert.hide(),
          },
        ],
      });
      toast.error(editing ? 'Could not update' : 'Could not post', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingJob) {
    return (
      <Screen>
        <Header title={editing ? 'Edit Job' : 'Post a Job'} onBack={() => navigation.goBack()} />
        <Loader />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={editing ? 'Edit Job' : 'Post a Job'} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowSuggestions(false)}
      >

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <Input
            label="Job Title *"
            placeholder="e.g. Delivery Executive"
            value={form.title}
            onChangeText={set('title')}
          />
          <Select
            label="Category *"
            value={form.category}
            options={categories}
            onChange={set('category')}
            placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'}
            disabled={categoriesLoading}
          />
          <Select
            label="Job Type"
            value={form.jobType}
            options={JOB_TYPES}
            onChange={set('jobType')}
          />
          <Input
            label="Description *"
            placeholder="Roles, responsibilities, requirements..."
            value={form.description}
            onChangeText={set('description')}
            multiline
            style={styles.textArea}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Compensation & Openings</Text>
          <View style={styles.row}>
            <Input
              label="Salary min ₹/mo"
              placeholder="15000"
              keyboardType="number-pad"
              value={form.salaryMin}
              onChangeText={set('salaryMin')}
              containerStyle={styles.flex1}
            />
            <Input
              label="Salary max ₹/mo"
              placeholder="25000"
              keyboardType="number-pad"
              value={form.salaryMax}
              onChangeText={set('salaryMax')}
              containerStyle={styles.flex1}
            />
          </View>
          <Input
            label="Vacancies"
            placeholder="1"
            keyboardType="number-pad"
            value={form.vacancies}
            onChangeText={set('vacancies')}
          />
        </Card>

        <Card style={[styles.card, { zIndex: 20 }]}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.addressWrap}>
            <Input
              label="Address"
              placeholder="Start typing area, locality..."
              value={addressQuery}
              onChangeText={onAddressChange}
              onFocus={() => addressQuery.length >= 3 && setShowSuggestions(true)}
            />
            {searchingAddress && (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.addressSpinner} />
            )}

            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionBox}>
                {suggestions.map((s) => (
                  <Pressable
                    key={s.place_id}
                    style={styles.suggestionRow}
                    onPress={() => onSelectSuggestion(s.place_id, s.description)}
                  >
                    <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {s.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row}>
            <Input
              label="City"
              placeholder="Delhi"
              value={form.city}
              onChangeText={set('city')}
              containerStyle={styles.flex1}
            />
            <Input
              label="State"
              placeholder="Delhi"
              value={form.state}
              onChangeText={set('state')}
              containerStyle={styles.flex1}
            />
          </View>
          <View style={styles.row}>
            <Input
              label="Pincode"
              placeholder="110085"
              keyboardType="number-pad"
              value={form.pincode}
              onChangeText={set('pincode')}
              containerStyle={styles.flex1}
            />
            <Input
              label="Country"
              value={form.country}
              onChangeText={set('country')}
              containerStyle={styles.flex1}
            />
          </View>

          <Text style={styles.label}>Work Mode</Text>
          <View style={styles.chips}>
            <Chip label="On-site" active={!form.isRemote} onPress={() => set('isRemote')(false)} />
            <Chip label="Remote" active={form.isRemote} onPress={() => set('isRemote')(true)} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Info</Text>
          <Input
            label="Skills (comma separated)"
            placeholder="e.g. driving, communication"
            value={form.skills}
            onChangeText={set('skills')}
          />
          <Input
            label="Benefits (comma separated)"
            placeholder="e.g. PF, health insurance"
            value={form.benefits}
            onChangeText={set('benefits')}
          />

          <Text style={styles.label}>Listing</Text>
          <View style={styles.chips}>
            <Chip
              label="Featured listing"
              active={form.isFeatured}
              onPress={() => set('isFeatured')(!form.isFeatured)}
            />
          </View>
        </Card>

        <Button
          title={editing ? 'Save Changes' : 'Post Job'}
          onPress={submit}
          loading={saving}
          size="lg"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  card: { gap: SPACING.md },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  row: { flexDirection: 'row', gap: SPACING.md },
  flex1: { flex: 1 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },

  addressWrap: { position: 'relative', zIndex: 10 },
  addressSpinner: { position: 'absolute', right: 12, top: 38 },
  suggestionBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border || '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
    zIndex: 30,
    maxHeight: 220,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.text },
});