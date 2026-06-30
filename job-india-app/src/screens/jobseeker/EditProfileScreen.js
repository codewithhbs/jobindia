import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch,
  Modal, TextInput, FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS, INDIA_STATES } from '../../constants/theme';
import { jobseekerApi } from '../../api/jobseeker.api';
import { adminApi } from '../../api/admin.api';
import { useFetch } from '../../hooks/useFetch';
import { toast } from '../../utils/toast';
import { Alert } from '../../components/ui/AppAlert';
import { Loader, Screen } from '../../components/ui/Screen';
import { Badge, Card, Input } from '../../components/ui';
import { EDUCATION_LEVELS, JOB_TYPES } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: '15_days', label: '15 days' },
  { value: '30_days', label: '30 days' },
  { value: '60_days', label: '60 days' },
  { value: '90_days', label: '90+ days' },
];

export default function EditProfileScreen({ route }) {
  const { redirectFrom } = route?.params || {};
  const navigation = useNavigation()
  const isFromBasicDetails = redirectFrom === 'basicDetail';
  const { data: profile, loading } = useFetch(() => jobseekerApi.me(), []);
  const { data: categories } = useFetch(() => adminApi.categories(), []);
  const logout = useAuthStore((s) => s.logout);

  const [form, setForm] = useState({
    headline: '', about: '',
    skills: [], languages: [], certifications: [], preferredLocations: [],
    expYears: '', expMonths: '',
    currentSalary: '', expMin: '', expMax: '',
    isFresher: false,
    noticePeriodDays: '', availability: 'immediate',
    preferredJobTypes: [], preferredCategories: [],
    isOpenToWork: true, willingToRelocate: false,
    linkedin: '', portfolio: '', github: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState(null);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const months = profile.totalExperienceMonths || 0;
    setForm({
      headline: profile.headline || '', about: profile.about || '',
      skills: profile.skills || [], languages: profile.languages || [],
      certifications: profile.certifications || [],
      preferredLocations: profile.preferredLocations || [],
      expYears: String(Math.floor(months / 12)) || '', expMonths: String(months % 12) || '',
      currentSalary: profile.currentSalary ? String(profile.currentSalary) : '',
      expMin: String(profile.expectedSalary?.min || ''), expMax: String(profile.expectedSalary?.max || ''),
      noticePeriodDays: String(profile.noticePeriodDays ?? ''),
      availability: profile.availability || 'immediate',
      isFresher: profile.isFresher ?? false,
      preferredJobTypes: profile.preferredJobTypes || [],
      preferredCategories: profile.preferredCategories?.map(c =>
        typeof c === 'object' ? c._id : c
      ) || [],
      isOpenToWork: profile.isOpenToWork ?? true, willingToRelocate: profile.willingToRelocate ?? false,
      linkedin: profile.links?.linkedin || '', portfolio: profile.links?.portfolio || '', github: profile.links?.github || '',
    });
    setResume(profile.resume || null);
    setEducation(profile.education || []);
    setExperience(profile.experience || []);
  }, [profile]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleInArray = (k, value) => setForm((f) => ({
    ...f,
    [k]: f[k].includes(value) ? f[k].filter((v) => v !== value) : [...f[k], value],
  }));
  console.log(form?.preferredLocations)
  const save = async () => {
    setSaving(true);
    try {
      await jobseekerApi.update({
        skills: form.skills,
        isFresher: form.isFresher,
        preferredLocations: form.preferredLocations,
        totalExperienceMonths:
          form.isFresher
            ? 0
            : (Number(form.expYears) || 0) * 12 + (Number(form.expMonths) || 0),
        currentSalary: Number(form.currentSalary) || undefined,
        expectedSalary: { min: Number(form.expMin) || undefined, max: Number(form.expMax) || undefined },
        noticePeriodDays: Number(form.noticePeriodDays) || 0,
        availability: form.availability,
        preferredJobTypes: form.preferredJobTypes,
        preferredCategories: form.preferredCategories,
      });
      toast.success('Saved', 'Profile updated');
      if (isFromBasicDetails) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Tabs',
              state: { index: 0, routes: [{ name: 'Home' }] },
            },
          ],
        });
      } else {
        navigation.goBack();
      }
    } catch (e) {
      toast.error('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const pickResume = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets[0];
      setUploading(true);
      const fd = new FormData();
      fd.append('resume', { uri: file.uri, name: file.name, type: file.mimeType || 'application/pdf' });
      const data = await jobseekerApi.uploadResume(fd);
      setResume(data);
      toast.success('Resume uploaded');
    } catch (e) {
      toast.error('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    if (isFromBasicDetails) {
      Alert.show({
        variant: 'danger',
        title: 'Go back?',
        message: 'You will be logged out and sent back to login.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'danger', onPress: () => logout() },
        ],
      });
    } else {
      navigation.goBack();
    }
  };

  if (loading && !profile) return <Screen><Header title="Edit Profile" onBack={handleBack} /><Loader /></Screen>;

  return (
    <Screen>
      <Header title="Edit Profile" onBack={handleBack} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {typeof profile?.profileCompleteness === 'number' && (
          <View style={styles.completenessCard}>
            <View style={styles.completenessTopRow}>
              <Text style={styles.completenessLabel}>Profile strength</Text>
              <Text style={styles.completenessPct}>{profile.profileCompleteness}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, profile.profileCompleteness)}%` }]} />
            </View>
          </View>
        )}

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Skills & Languages</Text>
          <TagsField label="Skills" placeholder="e.g. React" values={form.skills} onChange={set('skills')} />
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <ToggleRow
            icon="school-outline"
            title="I am a Fresher"
            subtitle="Turn this on if you don't have any work experience."
            value={form.isFresher}
            onChange={set('isFresher')}
          />
          {!form.isFresher && (
            <>
              <Text style={styles.fieldLabel}>Total Experience</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <Input placeholder="Years" keyboardType="number-pad" value={form.expYears} onChangeText={set('expYears')} containerStyle={{ flex: 1 }} />
                <Input placeholder="Months" keyboardType="number-pad" value={form.expMonths} onChangeText={set('expMonths')} containerStyle={{ flex: 1 }} />
              </View>
            </>
          )}
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Salary</Text>
          <Input label="Current salary ₹/mo" placeholder="20000" keyboardType="number-pad" value={form.currentSalary} onChangeText={set('currentSalary')} />
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Input label="Expected min ₹/mo" placeholder="25000" keyboardType="number-pad" value={form.expMin} onChangeText={set('expMin')} containerStyle={{ flex: 1 }} />
            <Input label="Expected max ₹/mo" placeholder="40000" keyboardType="number-pad" value={form.expMax} onChangeText={set('expMax')} containerStyle={{ flex: 1 }} />
          </View>
          <Text style={styles.fieldLabel}>Availability</Text>
          <View style={styles.chipsRow}>
            {AVAILABILITY_OPTIONS.map((o) => (
              <SelectChip key={o.value} label={o.label} active={form.availability === o.value} onPress={() => set('availability')(o.value)} />
            ))}
          </View>
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Job Preferences</Text>
          <Text style={styles.fieldLabel}>Preferred job types</Text>
          <View style={styles.chipsRow}>
            {JOB_TYPES.map((t) => (
              <SelectChip
                key={t.value}
                label={t.label}
                active={form.preferredJobTypes.includes(t.value)}
                onPress={() => toggleInArray('preferredJobTypes', t.value)}
              />
            ))}
          </View>
          {!!categories?.length && (
            <>
              <Text style={styles.fieldLabel}>Preferred categories</Text>
              <View style={styles.chipsRow}>
                {categories.map((c) => (
                  <SelectChip
                    key={c._id}
                    label={c.name}
                    active={form.preferredCategories.includes(c._id)}
                    onPress={() => toggleInArray('preferredCategories', c._id)}
                  />
                ))}
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>Preferred locations</Text>
          <Pressable style={styles.pickerTrigger} onPress={() => setLocationPickerOpen(true)}>
            <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.pickerTriggerText}>
              {form.preferredLocations.length
                ? `${form.preferredLocations.length} state(s) selected`
                : 'Search & select states'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
          </Pressable>
          {!!form.preferredLocations.length && (
            <View style={styles.chipsRow}>
              {form.preferredLocations.map((l) => (
                <View key={l.name} style={styles.removableTag}>
                  <Text style={styles.removableTagText}>{l.name}</Text>
                  <Pressable
                    onPress={() => set('preferredLocations')(form.preferredLocations.filter((x) => x.name !== l.name))}
                    hitSlop={6}
                  >
                    <Ionicons name="close-circle" size={15} color={COLORS.textLight} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <SearchablePicker
            visible={locationPickerOpen}
            title="Preferred locations"
            mode="multi"
            closeOnSelect
            data={INDIA_STATES}
            getKey={(s) => s.name}
            getLabel={(s) => s.name}
            selectedKeys={form.preferredLocations.map((l) => l.name)}
            onToggle={(s) => {
              const exists = form.preferredLocations.some((l) => l.name === s.name);
              set('preferredLocations')(
                exists
                  ? form.preferredLocations.filter((l) => l.name !== s.name)
                  : [...form.preferredLocations, { name: s.name, lat: s.lat, lng: s.lng }]
              );
            }}
            onClose={() => setLocationPickerOpen(false)}
          />
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Work Experience</Text>
          <ExperienceManager items={experience} onChange={setExperience} />
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Education</Text>
          <EducationManager items={education} onChange={setEducation} />
        </Card>

        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Resume / CV</Text>
          {resume?.fileUrl ? (
            <View style={styles.resumeRow}>
              <Ionicons name="document-text" size={22} color={COLORS.primary} />
              <Text style={{ flex: 1, color: COLORS.text }} numberOfLines={1}>{resume.fileName || 'Resume uploaded'}</Text>
              <Badge label="Uploaded" color={COLORS.success} />
            </View>
          ) : (
            <Text style={styles.muted}>No resume uploaded yet</Text>
          )}
          <Button title={resume ? 'Replace Resume' : 'Upload Resume'} variant="outline" icon="cloud-upload-outline" onPress={pickResume} loading={uploading} />
        </Card>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title="Save Changes" onPress={save} loading={saving} size="md" />
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// SearchablePicker: modal + search input + flatlist. single or multi select.
// ---------------------------------------------------------------------------
function SearchablePicker({
  visible, title, mode = 'single', data, getKey, getLabel,
  selectedKeys = [], selectedKey, onToggle, onSelect, onClose,
  closeOnSelect = false,
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter((item) => getLabel(item).toLowerCase().includes(q));
  }, [query, data]);

  const isSelected = (item) =>
    mode === 'multi' ? selectedKeys.includes(getKey(item)) : selectedKey === getKey(item);

  const handlePress = (item) => {
    if (mode === 'multi') {
      onToggle?.(item);
      if (closeOnSelect) {
        setQuery('');
        onClose();
      }
    } else {
      onSelect?.(item);
      setQuery('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={() => { setQuery(''); onClose(); }} hitSlop={8}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={COLORS.textLight}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {!!query && (
              <Pressable onPress={() => setQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => getKey(item)}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
            ListEmptyComponent={<Text style={styles.muted}>No results</Text>}
            renderItem={({ item }) => {
              const selected = isSelected(item);
              return (
                <Pressable style={styles.pickerRow} onPress={() => handlePress(item)}>
                  <Text style={styles.pickerRowText}>{getLabel(item)}</Text>
                  {selected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </Pressable>
              );
            }}
            style={{ flexGrow: 0, flexShrink: 1 }}
          />

          {mode === 'multi' && !closeOnSelect && (
            <Button title="Done" onPress={() => { setQuery(''); onClose(); }} style={{ marginTop: SPACING.md }} />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Reusable bits
// ---------------------------------------------------------------------------

function SelectChip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({ icon, title, subtitle, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      {!!icon && (
        <View style={styles.toggleIconWrap}>
          <Ionicons name={icon} size={18} color={COLORS.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.toggleSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.gray200, true: COLORS.primaryMid }}
        thumbColor={value ? COLORS.primary : COLORS.gray400}
      />
    </View>
  );
}

function TagsField({ label, placeholder, values, onChange }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const v = input.trim();
    if (!v || values.includes(v)) { setInput(''); return; }
    onChange([...values, v]);
    setInput('');
  };

  const removeTag = (v) => onChange(values.filter((x) => x !== v));

  return (
    <View style={{ gap: SPACING.sm }}>
      <Input
        label={label}
        placeholder={placeholder}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={addTag}
        returnKeyType="done"
      />
      {!!values.length && (
        <View style={styles.chipsRow}>
          {values.map((v) => (
            <View key={v} style={styles.removableTag}>
              <Text style={styles.removableTagText}>{v}</Text>
              <Pressable onPress={() => removeTag(v)} hitSlop={6}>
                <Ionicons name="close-circle" size={15} color={COLORS.textLight} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Work Experience
// ---------------------------------------------------------------------------
function ExperienceManager({ items, onChange }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ company: '', title: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });

  const resetDraft = () => setDraft({ company: '', title: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });

  const openAdd = () => { resetDraft(); setEditingId(null); setOpen(true); };
  const openEdit = (item) => {
    setDraft({
      company: item.company || '',
      title: item.jobTitle || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      currentlyWorking: !!item.isCurrent,
      description: item.description || '',
    });
    setEditingId(item._id);
    setOpen(true);
  };

  const submit = async () => {
    if (!draft.company || !draft.title) return toast.error('Company & title are required');
    setBusy(true);
    try {
      const updated = editingId
        ? await jobseekerApi.updateExperience(editingId, draft)
        : await jobseekerApi.addExperience(draft);
      onChange(updated);
      setOpen(false);
    } catch (e) {
      toast.error('Could not save experience', e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = (id) => {
    Alert.show({
      variant: 'danger',
      title: 'Remove this entry?',
      message: 'This work experience entry will be deleted from your profile.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'danger', onPress: async () => {
            try {
              const updated = await jobseekerApi.deleteExperience(id);
              onChange(updated);
            } catch (e) {
              toast.error('Could not remove', e.message);
            }
          },
        },
      ],
    });
  };

  return (
    <View style={{ gap: SPACING.sm }}>
      {items.map((item) => (
        <View key={item._id} style={styles.listItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.listItemTitle}>{item.title}</Text>
            <Text style={styles.listItemSubtitle}>{item.company}</Text>
            <Text style={styles.listItemMeta}>{item.startDate || '—'} – {item.currentlyWorking ? 'Present' : (item.endDate || '—')}</Text>
          </View>
          <Pressable onPress={() => openEdit(item)} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
          </Pressable>
          <Pressable onPress={() => remove(item._id)} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </Pressable>
        </View>
      ))}

      {open ? (
        <View style={styles.inlineForm}>
          <Input label="Company *" value={draft.company} onChangeText={(v) => setDraft((d) => ({ ...d, company: v }))} />
          <Input label="Job title *" value={draft.title} onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))} />
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Input label="Start (e.g. Jan 2023)" value={draft.startDate} onChangeText={(v) => setDraft((d) => ({ ...d, startDate: v }))} containerStyle={{ flex: 1 }} />
            <Input label="End" placeholder="Present" editable={!draft.currentlyWorking} value={draft.endDate} onChangeText={(v) => setDraft((d) => ({ ...d, endDate: v }))} containerStyle={{ flex: 1 }} />
          </View>
          <ToggleRow icon="time-outline" title="I currently work here" value={draft.currentlyWorking} onChange={(v) => setDraft((d) => ({ ...d, currentlyWorking: v }))} />
          <Input label="Description" multiline numberOfLines={3} style={{ minHeight: 60, textAlignVertical: 'top' }} value={draft.description} onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))} />
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Button title="Cancel" variant="outline" onPress={() => setOpen(false)} style={{ flex: 1 }} />
            <Button title={editingId ? 'Update' : 'Add'} onPress={submit} loading={busy} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <Pressable onPress={openAdd} style={styles.addRow}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.addRowText}>Add work experience</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Education — level field now uses SearchablePicker (single mode)
// ---------------------------------------------------------------------------
function EducationManager({ items, onChange }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);

  const [draft, setDraft] = useState({
    level: '', degree: '', institution: '', fieldOfStudy: '',
    startYear: '', endYear: '', grade: '', isPursuing: false,
  });

  const resetDraft = () => setDraft({
    level: '', degree: '', institution: '', fieldOfStudy: '',
    startYear: '', endYear: '', grade: '', isPursuing: false,
  });

  const openAdd = () => { resetDraft(); setEditingId(null); setOpen(true); };
  const openEdit = (item) => {
    setDraft({
      level: item.level || '',
      degree: item.degree || '',
      institution: item.institution || '',
      fieldOfStudy: item.fieldOfStudy || '',
      startYear: item.startYear?.toString() || '',
      endYear: item.endYear?.toString() || '',
      grade: item.grade || '',
      isPursuing: item.isPursuing || false,
    });
    setEditingId(item._id);
    setOpen(true);
  };

  const submit = async () => {
    if (!draft.institution || !draft.degree) return toast.error('Institution & degree are required');
    setBusy(true);
    try {
      const payload = {
        ...draft,
        startYear: draft.startYear ? Number(draft.startYear) : undefined,
        endYear: draft.isPursuing ? undefined : draft.endYear ? Number(draft.endYear) : undefined,
      };
      const updated = editingId
        ? await jobseekerApi.updateEducation(editingId, payload)
        : await jobseekerApi.addEducation(payload);
      onChange(updated);
      setOpen(false);
    } catch (e) {
      toast.error(e.message || 'Could not save education');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id) => {
    Alert.show({
      variant: 'danger',
      title: 'Remove this entry?',
      message: 'This education entry will be deleted from your profile.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'danger', onPress: async () => {
            try {
              const updated = await jobseekerApi.deleteEducation(id);
              onChange(updated);
            } catch (e) {
              toast.error(e.message || 'Could not remove');
            }
          },
        },
      ],
    });
  };

  const levelLabel = EDUCATION_LEVELS.find((l) => l.value === draft.level)?.label
    || EDUCATION_LEVELS.find((l) => l === draft.level)
    || draft.level;

  return (
    <View style={{ gap: SPACING.sm }}>
      {items.map((item) => (
        <View key={item._id} style={styles.listItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.listItemTitle}>
              {item.degree}{item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ''}
            </Text>
            <Text style={styles.listItemSubtitle}>{item.institution}</Text>
            <Text style={styles.listItemMeta}>
              {item.startYear || '—'} – {item.isPursuing ? 'Present' : item.endYear || '—'}
            </Text>
            {!!item.level && <Text style={styles.listItemMeta}>Level: {item.level}</Text>}
            {!!item.grade && <Text style={styles.listItemMeta}>Grade: {item.grade}</Text>}
          </View>
          <Pressable onPress={() => openEdit(item)} hitSlop={8}>
            <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
          </Pressable>
          <Pressable onPress={() => remove(item._id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </Pressable>
        </View>
      ))}

      {open ? (
        <View style={styles.inlineForm}>
          <Text style={styles.fieldLabel}>Education Level</Text>
          <Pressable style={styles.pickerTrigger} onPress={() => setLevelPickerOpen(true)}>
            <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.pickerTriggerText}>{levelLabel || 'Select level'}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
          </Pressable>

          <SearchablePicker
            visible={levelPickerOpen}
            title="Education Level"
            mode="single"
            data={EDUCATION_LEVELS}
            getKey={(l) => (typeof l === 'object' ? l.value : l)}
            getLabel={(l) => (typeof l === 'object' ? l.label : l)}
            selectedKey={draft.level}
            onSelect={(l) => setDraft((d) => ({ ...d, level: typeof l === 'object' ? l.value : l }))}
            onClose={() => setLevelPickerOpen(false)}
          />

          <Input label="Institution *" value={draft.institution} onChangeText={(v) => setDraft((d) => ({ ...d, institution: v }))} />
          <Input label="Degree *" placeholder="e.g. B.Tech" value={draft.degree} onChangeText={(v) => setDraft((d) => ({ ...d, degree: v }))} />
          <Input label="Field of study" value={draft.fieldOfStudy} onChangeText={(v) => setDraft((d) => ({ ...d, fieldOfStudy: v }))} />
          <Input label="Grade" placeholder="e.g. 8.5 CGPA / 78%" value={draft.grade} onChangeText={(v) => setDraft((d) => ({ ...d, grade: v }))} />

          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Input label="Start year" keyboardType="number-pad" value={draft.startYear} onChangeText={(v) => setDraft((d) => ({ ...d, startYear: v }))} containerStyle={{ flex: 1 }} />
            {!draft.isPursuing && (
              <Input label="End year" keyboardType="number-pad" value={draft.endYear} onChangeText={(v) => setDraft((d) => ({ ...d, endYear: v }))} containerStyle={{ flex: 1 }} />
            )}
          </View>

          <ToggleRow
            title="Currently pursuing"
            value={draft.isPursuing}
            onChange={(v) => setDraft((d) => ({ ...d, isPursuing: v, endYear: v ? '' : d.endYear }))}
          />

          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Button title="Cancel" variant="outline" onPress={() => setOpen(false)} style={{ flex: 1 }} />
            <Button title={editingId ? 'Update' : 'Add'} onPress={submit} loading={busy} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <Pressable onPress={openAdd} style={styles.addRow}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.addRowText}>Add education</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  fieldLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: -SPACING.xs },

  completenessCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border, padding: SPACING.lg, gap: SPACING.sm,
  },
  completenessTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completenessLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  completenessPct: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.primary },
  progressTrack: { height: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.gray200, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full, backgroundColor: COLORS.primary },

  resumeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg },
  muted: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, padding: SPACING.sm },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary },

  removableTag: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  removableTagText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.text },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  toggleIconWrap: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  toggleTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
  toggleSubtitle: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 1 },

  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  listItemTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
  listItemSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 1 },
  listItemMeta: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },

  inlineForm: {
    gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.primaryMid, backgroundColor: COLORS.primaryLight,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.lg + 30,
    backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm },
  addRowText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },

  // picker trigger
  pickerTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.surface,
  },
  pickerTriggerText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.text },

  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '70%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, marginBottom: SPACING.sm, backgroundColor: COLORS.surface,
  },
  searchInput: { flex: 1, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.sm, color: COLORS.text },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md },
  pickerSeparator: { height: 1, backgroundColor: COLORS.border },
  pickerRowText: { fontSize: FONTS.sizes.sm, color: COLORS.text },
});