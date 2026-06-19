import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';

import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { jobsApi } from '../../api/jobs.api';
import { JOB_TYPES } from '../../constants/config';
import { toast } from '../../utils/toast';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { Card, Chip, Input } from '../../components/ui';
import { Button } from '../../components/ui/Button';

export function PostJobScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', description: '', category: '', city: '', state: '',
    salaryMin: '', salaryMax: '', vacancies: '1', skills: '',
  });
  const [jobType, setJobType] = useState('full_time');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.description) return toast.error('Title and description are required');
    setSaving(true);
    try {
      await jobsApi.create({
        title: form.title,
        description: form.description,
        category: form.category || 'General',
        jobType,
        vacancies: Number(form.vacancies) || 1,
        location: { city: form.city, state: form.state },
        salary: { min: Number(form.salaryMin) || undefined, max: Number(form.salaryMax) || undefined, period: 'monthly' },
        requirements: { skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean) },
        status: 'active',
      });
      toast.success('Posted!', 'Your job is now live');
      navigation.navigate('MyJobs');
    } catch (e) {
      toast.error('Could not post', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Post a Job" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: SPACING.md }}>
          <Input label="Job Title *" placeholder="e.g. Delivery Executive" value={form.title} onChangeText={set('title')} />
          <Input label="Category" placeholder="e.g. Delivery" value={form.category} onChangeText={set('category')} />
          <Input label="Description *" placeholder="Roles, responsibilities..." value={form.description} onChangeText={set('description')} multiline style={{ minHeight: 100, textAlignVertical: 'top' }} />

          <Text style={styles.label}>Job Type</Text>
          <View style={styles.chips}>
            {JOB_TYPES.map((t) => <Chip key={t.value} label={t.label} active={jobType === t.value} onPress={() => setJobType(t.value)} />)}
          </View>

          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Input label="City" placeholder="Delhi" value={form.city} onChangeText={set('city')} containerStyle={{ flex: 1 }} />
            <Input label="State" placeholder="Delhi" value={form.state} onChangeText={set('state')} containerStyle={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Input label="Salary min ₹/mo" keyboardType="number-pad" value={form.salaryMin} onChangeText={set('salaryMin')} containerStyle={{ flex: 1 }} />
            <Input label="Salary max ₹/mo" keyboardType="number-pad" value={form.salaryMax} onChangeText={set('salaryMax')} containerStyle={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Input label="Vacancies" keyboardType="number-pad" value={form.vacancies} onChangeText={set('vacancies')} containerStyle={{ flex: 1 }} />
            <Input label="Skills (comma sep)" placeholder="driving" value={form.skills} onChangeText={set('skills')} containerStyle={{ flex: 1 }} />
          </View>
        </Card>

        <Button title="Post Job" onPress={submit} loading={saving} size="lg" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
});
