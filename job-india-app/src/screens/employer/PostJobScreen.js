import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Keyboard, Platform, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const EXPERIENCE_UNITS = [
  { label: 'Years', value: 'years' },
  { label: 'Months', value: 'months' },
];

const GENDER_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const QUALIFICATION_OPTIONS = [
  { label: 'Below 10th', value: 'below_10th' },
  { label: '10th Pass', value: '10th_pass' },
  { label: '12th Pass', value: '12th_pass' },
  { label: 'Diploma', value: 'diploma' },
  { label: 'ITI', value: 'iti' },
  { label: 'Graduate', value: 'graduate' },
  { label: 'Post Graduate', value: 'post_graduate' },
  { label: 'Any', value: 'any' },
];

const EDUCATION_OPTIONS = [
  { label: 'Not Required', value: 'none' },
  { label: 'High School', value: 'high_school' },
  { label: 'B.A.', value: 'ba' },
  { label: 'B.Com', value: 'bcom' },
  { label: 'B.Sc', value: 'bsc' },
  { label: 'B.Tech / B.E.', value: 'btech' },
  { label: 'BBA', value: 'bba' },
  { label: 'MBA', value: 'mba' },
  { label: 'M.A.', value: 'ma' },
  { label: 'Any', value: 'any' },
];

const LANGUAGE_OPTIONS = [
  'Hindi', 'English', 'Punjabi', 'Bengali', 'Tamil',
  'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Urdu',
];

const SKILL_OPTIONS = [
  'Driving', 'Communication', 'Customer Service', 'Computer Basics',
  'MS Office', 'Sales', 'Cooking', 'Cleaning', 'Delivery',
  'Loading/Unloading', 'Typing', 'Tally', 'Accounting', 'Teaching',
];

const LICENSE_TYPES = ['LMV', 'MCWG', 'HMV', 'Commercial'];
const VEHICLE_TYPES = ['bike', 'auto', 'car', 'van', 'truck'];

const sevenDaysFromNow = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const EMPTY_FORM = {
  title: '',
  description: '',
  employerName: '',
  companyName: '',
  companyLogo: '',
  category: '',
  subCategory: '',

  jobType: 'full_time',
  vacancies: '1',

  salary: {
    min: '',
    max: '',
    currency: 'INR',
    period: 'monthly',
    isNegotiable: false,
    isHidden: false,
  },

  location: {
    coordinates: [],
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    isRemote: false,
  },

  requirements: {
    experience: { min: '0', max: '', unit: 'years' },
    qualification: '',
    education: '',
    skills: [],      // array now — chip multi-select
    languages: [],   // array now — chip multi-select
    licenseRequired: false,
    licenseType: [],
    vehicleRequired: false,
    vehicleType: [],
    gender: 'any',
    ageMin: '',
    ageMax: '',
  },

  applicationDeadline: sevenDaysFromNow(),
  expiryDate: sevenDaysFromNow(),
  dynamicFields: {},
  status: 'draft',
  isFeatured: false,
  featuredUntil: '',
  featuredOrder: '',
  tags: '',      // comma-separated in UI, array on submit
  benefits: '',  // comma-separated in UI, array on submit
};

function getComponent(components, type) {
  const match = components?.find((c) => c.types.includes(type));
  return match?.long_name || '';
}

function formatDate(d) {
  if (!d) return 'Select date';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PostJobScreen({ navigation, route }) {
  const id = route?.params?.id;
  const editing = !!id;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loadingJob, setLoadingJob] = useState(editing);
  const [saving, setSaving] = useState(false);

  // address autocomplete
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const sessionTokenRef = useRef(null);

  // scroll control — fixes "step 2 opens scrolled down" bug
  const scrollRef = useRef(null);

  // date pickers visibility
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  // top-level field setter
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // nested setter: setNested('salary', 'min')(value)
  const setNested = (group, key) => (v) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: v } }));

  // doubly-nested setter for requirements.experience.x
  const setExperience = (key) => (v) =>
    setForm((f) => ({
      ...f,
      requirements: {
        ...f.requirements,
        experience: { ...f.requirements.experience, [key]: v },
      },
    }));

  const toggleMultiSelect = (group, key, item) =>
    setForm((f) => {
      const arr = f[group][key] || [];
      const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
      return { ...f, [group]: { ...f[group], [key]: next } };
    });

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
        const res = await adminApi.categories('all');
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
          employerName: j.employerName || '',
          companyName: j.companyName || '',
          companyLogo: j.companyLogo || '',
          category: j.category?._id || j.category || '',
          subCategory: j.subCategory || '',

          jobType: j.jobType || 'full_time',
          vacancies: String(j.vacancies || 1),

          salary: {
            min: j.salary?.min != null ? String(j.salary.min) : '',
            max: j.salary?.max != null ? String(j.salary.max) : '',
            currency: j.salary?.currency || 'INR',
            period: j.salary?.period || 'monthly',
            isNegotiable: !!j.salary?.isNegotiable,
            isHidden: !!j.salary?.isHidden,
          },

          location: {
            coordinates: j.location?.coordinates || [],
            address: j.location?.address || '',
            city: j.location?.city || '',
            state: j.location?.state || '',
            country: j.location?.country || 'India',
            pincode: j.location?.pincode || '',
            isRemote: !!j.location?.isRemote,
          },

          requirements: {
            experience: {
              min: j.requirements?.experience?.min != null ? String(j.requirements.experience.min) : '0',
              max: j.requirements?.experience?.max != null ? String(j.requirements.experience.max) : '',
              unit: j.requirements?.experience?.unit || 'years',
            },
            qualification: j.requirements?.qualification || '',
            education: j.requirements?.education || '',
            skills: j.requirements?.skills || [],
            languages: j.requirements?.languages || [],
            licenseRequired: !!j.requirements?.licenseRequired,
            licenseType: j.requirements?.licenseType || [],
            vehicleRequired: !!j.requirements?.vehicleRequired,
            vehicleType: j.requirements?.vehicleType || [],
            gender: j.requirements?.gender || 'any',
            ageMin: j.requirements?.ageMin != null ? String(j.requirements.ageMin) : '',
            ageMax: j.requirements?.ageMax != null ? String(j.requirements.ageMax) : '',
          },

          applicationDeadline: j.applicationDeadline ? new Date(j.applicationDeadline) : sevenDaysFromNow(),
          expiryDate: j.expiryDate ? new Date(j.expiryDate) : sevenDaysFromNow(),
          dynamicFields: j.dynamicFields || {},
          status: j.status || 'draft',
          isFeatured: !!j.isFeatured,
          featuredUntil: j.featuredUntil || '',
          featuredOrder: j.featuredOrder != null ? String(j.featuredOrder) : '',
          tags: (j.tags || []).join(', '),
          benefits: (j.benefits || []).join(', '),
        });
        setAddressQuery(j.location?.address || '');
      } catch (e) {
        toast.error('Could not load job', e.message);
      } finally {
        setLoadingJob(false);
      }
    })();
  }, [id, editing]);

  // ── Places Autocomplete ────────────────────
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
        if (json.status === 'OK') setSuggestions(json.predictions || []);
        else setSuggestions([]);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSearchingAddress(false));
  }, []);

  const onAddressChange = (text) => {
    setAddressQuery(text);
    setNested('location', 'address')(text);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 400);
  };

  const onSelectSuggestion = async (placeId, description) => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    setSuggestions([]);
    setAddressQuery(description);
    setNested('location', 'address')(description);

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
        location: {
          ...f.location,
          address: place.formatted_address || f.location.address,
          city: city || f.location.city,
          state: state || f.location.state,
          country,
          pincode: pincode || f.location.pincode,
          coordinates:
            place.geometry?.location?.lat != null && place.geometry?.location?.lng != null
              ? [place.geometry.location.lng, place.geometry.location.lat]
              : f.location.coordinates,
        },
      }));

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

  // ── Step validation ──────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.title.trim()) return toast.error('Job title is required'), false;
    if (!form.description.trim()) return toast.error('Description is required'), false;
    if (!form.category) return toast.error('Please select a category'), false;
    if (!form.location.isRemote && (!form.location.coordinates || form.location.coordinates.length < 2)) {
      return toast.error('Please select a valid address from suggestions'), false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.expiryDate) return toast.error('Expiry date is required'), false;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (new Date(form.expiryDate) < todayStart) return toast.error('Expiry date cannot be in the past'), false;
    return true;
  };

  // scroll top helper — fix: step switch pe purana scroll offset reh jata tha
  const scrollToTop = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  };

  const goNext = () => {
    if (!validateStep1()) return;
    setStep(2);
    scrollToTop();
  };

  const goBackStep = () => {
    setStep(1);
    scrollToTop();
  };

  // ── Submit ──────────────────────────────────────────────
  const submit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        employerName: form.employerName,
        companyName: form.companyName,
        companyLogo: form.companyLogo,
        category: form.category,
        subCategory: form.subCategory,
        jobType: form.jobType,
        vacancies: Number(form.vacancies) || 1,

        location: {
          address: form.location.address,
          city: form.location.city,
          state: form.location.state,
          country: form.location.country,
          pincode: form.location.pincode,
          isRemote: form.location.isRemote,
          ...(form.location.coordinates?.length === 2
            ? { coordinates: form.location.coordinates }
            : {}),
        },

        salary: {
          min: form.salary.min ? Number(form.salary.min) : undefined,
          max: form.salary.max ? Number(form.salary.max) : undefined,
          currency: form.salary.currency,
          period: form.salary.period,
          isNegotiable: form.salary.isNegotiable,
          isHidden: form.salary.isHidden,
        },

        requirements: {
          experience: {
            min: Number(form.requirements.experience.min) || 0,
            max: form.requirements.experience.max ? Number(form.requirements.experience.max) : undefined,
            unit: form.requirements.experience.unit,
          },
          qualification: form.requirements.qualification,
          education: form.requirements.education,
          skills: form.requirements.skills,       // already array
          languages: form.requirements.languages, // already array
          licenseRequired: form.requirements.licenseRequired,
          licenseType: form.requirements.licenseType,
          vehicleRequired: form.requirements.vehicleRequired,
          vehicleType: form.requirements.vehicleType,
          gender: form.requirements.gender,
          ageMin: form.requirements.ageMin ? Number(form.requirements.ageMin) : undefined,
          ageMax: form.requirements.ageMax ? Number(form.requirements.ageMax) : undefined,
        },

        applicationDeadline: form.applicationDeadline,
        expiryDate: form.expiryDate,
        dynamicFields: form.dynamicFields,
        benefits: form.benefits.split(',').map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
        featuredUntil: form.featuredUntil || undefined,
        featuredOrder: form.featuredOrder ? Number(form.featuredOrder) : undefined,
        status: form.status || 'paused',
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
        title: 'Job Posting Failed',
        message: e.message,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Ok', style: 'danger', onPress: () => Alert.hide() },
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
      <Header
        title={editing ? 'Edit Job' : 'Post a Job'}
        onBack={() => (step === 2 ? goBackStep() : navigation.goBack())}
      />

      {/* ── Step indicator ── */}
      <View style={styles.stepper}>
        <View style={styles.stepperTrack} />
        <View style={[styles.stepperTrackFill, step >= 2 && styles.stepperTrackFillFull]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
          </View>
          <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Job & Location</Text>
        </View>
        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
          </View>
          <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Requirements & Schedule</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowSuggestions(false)}
      >
        {step === 1 ? (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Job Details</Text>
              <Input label="Job Title *" placeholder="e.g. Delivery Executive" value={form.title} onChangeText={set('title')} />
             
              <Select
                label="Category *"
                value={form.category}
                options={categories}
                onChange={set('category')}
                placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'}
                disabled={categoriesLoading}
              />
              <Input label="Sub Category" placeholder="e.g. Two-wheeler delivery" value={form.subCategory} onChangeText={set('subCategory')} />
              <Select label="Job Type" value={form.jobType} options={JOB_TYPES} onChange={set('jobType')} />
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
                <Input label="Salary min ₹/mo" placeholder="15000" keyboardType="number-pad" value={form.salary.min} onChangeText={setNested('salary', 'min')} containerStyle={styles.flex1} />
                <Input label="Salary max ₹/mo" placeholder="25000" keyboardType="number-pad" value={form.salary.max} onChangeText={setNested('salary', 'max')} containerStyle={styles.flex1} />
              </View>
              <Input label="Vacancies" placeholder="1" keyboardType="number-pad" value={form.vacancies} onChangeText={set('vacancies')} />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Salary negotiable</Text>
                <Switch value={form.salary.isNegotiable} onValueChange={setNested('salary', 'isNegotiable')} trackColor={{ true: COLORS.primary }} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Hide salary from listing</Text>
                <Switch value={form.salary.isHidden} onValueChange={setNested('salary', 'isHidden')} trackColor={{ true: COLORS.primary }} />
              </View>
            </Card>

            <Card style={[styles.card, { zIndex: 20 }]}>
              <Text style={styles.sectionTitle}>Location</Text>

              <Text style={styles.label}>Work Mode</Text>
              <View style={styles.chips}>
                <Chip label="On-site" active={!form.location.isRemote} onPress={() => setNested('location', 'isRemote')(false)} />
                <Chip label="Remote" active={form.location.isRemote} onPress={() => setNested('location', 'isRemote')(true)} />
              </View>

              {!form.location.isRemote && (
                <>
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
                          <Pressable key={s.place_id} style={styles.suggestionRow} onPress={() => onSelectSuggestion(s.place_id, s.description)}>
                            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                            <Text style={styles.suggestionText} numberOfLines={2}>{s.description}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.row}>
                    <Input label="City" placeholder="Delhi" value={form.location.city} onChangeText={setNested('location', 'city')} containerStyle={styles.flex1} />
                    <Input label="State" placeholder="Delhi" value={form.location.state} onChangeText={setNested('location', 'state')} containerStyle={styles.flex1} />
                  </View>
                  <View style={styles.row}>
                    <Input label="Pincode" placeholder="110085" keyboardType="number-pad" value={form.location.pincode} onChangeText={setNested('location', 'pincode')} containerStyle={styles.flex1} />
                    <Input label="Country" value={form.location.country} onChangeText={setNested('location', 'country')} containerStyle={styles.flex1} />
                  </View>
                </>
              )}
            </Card>

            <Button title="Next: Requirements" onPress={goNext} size="lg" />
          </>
        ) : (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Experience & Qualification</Text>
              <View style={styles.row}>
                <Input label="Min experience" keyboardType="number-pad" value={form.requirements.experience.min} onChangeText={setExperience('min')} containerStyle={styles.flex1} />
                <Input label="Max experience" keyboardType="number-pad" value={form.requirements.experience.max} onChangeText={setExperience('max')} containerStyle={styles.flex1} />
              </View>
              <Select label="Experience unit" value={form.requirements.experience.unit} options={EXPERIENCE_UNITS} onChange={setExperience('unit')} />

              <Select
                label="Qualification"
                placeholder="Select qualification"
                value={form.requirements.qualification}
                options={QUALIFICATION_OPTIONS}
                onChange={setNested('requirements', 'qualification')}
              />
              <Select
                label="Education"
                placeholder="Select education"
                value={form.requirements.education}
                options={EDUCATION_OPTIONS}
                onChange={setNested('requirements', 'education')}
              />

              <Text style={styles.label}>Skills</Text>
              <View style={styles.chips}>
                {SKILL_OPTIONS.map((sk) => (
                  <Chip
                    key={sk}
                    label={sk}
                    active={form.requirements.skills.includes(sk)}
                    onPress={() => toggleMultiSelect('requirements', 'skills', sk)}
                  />
                ))}
              </View>

              <Text style={styles.label}>Languages</Text>
              <View style={styles.chips}>
                {LANGUAGE_OPTIONS.map((lng) => (
                  <Chip
                    key={lng}
                    label={lng}
                    active={form.requirements.languages.includes(lng)}
                    onPress={() => toggleMultiSelect('requirements', 'languages', lng)}
                  />
                ))}
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>License & Vehicle</Text>

              <View style={styles.switchRow}>
                <Text style={styles.label}>License required</Text>
                <Switch value={form.requirements.licenseRequired} onValueChange={setNested('requirements', 'licenseRequired')} trackColor={{ true: COLORS.primary }} />
              </View>
              {form.requirements.licenseRequired && (
                <View style={styles.chips}>
                  {LICENSE_TYPES.map((l) => (
                    <Chip key={l} label={l} active={form.requirements.licenseType.includes(l)} onPress={() => toggleMultiSelect('requirements', 'licenseType', l)} />
                  ))}
                </View>
              )}

              <View style={styles.switchRow}>
                <Text style={styles.label}>Vehicle required</Text>
                <Switch value={form.requirements.vehicleRequired} onValueChange={setNested('requirements', 'vehicleRequired')} trackColor={{ true: COLORS.primary }} />
              </View>
              {form.requirements.vehicleRequired && (
                <View style={styles.chips}>
                  {VEHICLE_TYPES.map((v) => (
                    <Chip key={v} label={v} active={form.requirements.vehicleType.includes(v)} onPress={() => toggleMultiSelect('requirements', 'vehicleType', v)} />
                  ))}
                </View>
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Candidate Criteria</Text>
              <Select label="Gender" value={form.requirements.gender} options={GENDER_OPTIONS} onChange={setNested('requirements', 'gender')} />
              <View style={styles.row}>
                <Input label="Min age" keyboardType="number-pad" value={form.requirements.ageMin} onChangeText={setNested('requirements', 'ageMin')} containerStyle={styles.flex1} />
                <Input label="Max age" keyboardType="number-pad" value={form.requirements.ageMax} onChangeText={setNested('requirements', 'ageMax')} containerStyle={styles.flex1} />
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Scheduling</Text>

              <Text style={styles.label}>Application Deadline</Text>
              <Pressable style={styles.dateBox} onPress={() => setShowDeadlinePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.dateText}>{formatDate(form.applicationDeadline)}</Text>
              </Pressable>
              {showDeadlinePicker && (
                <DateTimePicker
                  value={form.applicationDeadline ? new Date(form.applicationDeadline) : new Date()}
                  mode="date"
                  minimumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDeadlinePicker(Platform.OS === 'ios');
                    if (date) set('applicationDeadline')(date);
                  }}
                />
              )}

              <Text style={styles.label}>Job Expiry Date *</Text>
              <Pressable style={styles.dateBox} onPress={() => setShowExpiryPicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.dateText}>{formatDate(form.expiryDate)}</Text>
              </Pressable>
              {showExpiryPicker && (
                <DateTimePicker
                  value={form.expiryDate ? new Date(form.expiryDate) : new Date()}
                  mode="date"
                  minimumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowExpiryPicker(Platform.OS === 'ios');
                    if (date) set('expiryDate')(date);
                  }}
                />
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Additional Info</Text>
              <Input label="Tags (comma separated)" placeholder="e.g. urgent, weekend-off" value={form.tags} onChangeText={set('tags')} />
              <Input label="Benefits (comma separated)" placeholder="e.g. PF, health insurance" value={form.benefits} onChangeText={set('benefits')} />

              <Text style={styles.label}>Listing</Text>
              <View style={styles.chips}>
                <Chip label="Featured listing" active={form.isFeatured} onPress={() => set('isFeatured')(!form.isFeatured)} />
              </View>
            </Card>

            <View style={styles.row}>
              <Button title="Back" onPress={goBackStep} size="lg" variant="outline" style={styles.flex1} />
              <Button title={editing ? 'Save Changes' : 'Post Job'} onPress={submit} loading={saving} size="lg" style={styles.flex1} />
            </View>
          </>
        )}
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
    backgroundColor: COLORS.surface || '#fff',
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
    borderBottomColor: COLORS.borderLight || '#F1F5F9',
  },
  suggestionText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.text, lineHeight: 18 },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },

  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border || '#E2E8F0',
    backgroundColor: COLORS.surface || '#fff',
  },
  dateText: { fontSize: FONTS.sizes.md, color: COLORS.text, fontWeight: '600' },

  stepper: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    position: 'relative',
  },
  stepperTrack: {
    position: 'absolute',
    top: SPACING.md + 13,
    left: SPACING.xl + 14,
    right: SPACING.xl + 14,
    height: 2,
    backgroundColor: COLORS.border || '#E2E8F0',
  },
  stepperTrackFill: {
    position: 'absolute',
    top: SPACING.md + 13,
    left: SPACING.xl + 14,
    right: SPACING.xl + 14,
    height: 2,
    width: 0,
    backgroundColor: COLORS.primary,
  },
  stepperTrackFillFull: { width: '100%' },
  stepItem: { flex: 1, alignItems: 'center', gap: SPACING.xs },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface || '#fff',
    borderWidth: 2,
    borderColor: COLORS.border || '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary },
  stepDotTextActive: { color: '#fff' },
  stepLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLabelActive: { color: COLORS.text, fontWeight: '700' },
});