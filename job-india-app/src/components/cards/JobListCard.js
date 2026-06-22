import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { formatSalary, jobLocation, timeAgo } from '../../utils/format';
import { BASE_API_URL, JOB_TYPES } from '../../constants/config';
import { API_BASE_URL } from '../../constants/config';

const typeLabel = (v) => JOB_TYPES.find((t) => t.value === v)?.label || v;

function resolveCompany(job) {
  const ep = job.employerProfile || {};
  const companyName = ep.companyName || job.companyName;
  const rawLogo = ep.companyLogo || job.companyLogo;
  const companyLogo = rawLogo
    ? (rawLogo.startsWith('http') ? rawLogo : `${BASE_API_URL}${rawLogo}`)
    : null;
  const isVerified = ep.verificationStatus === 'approved';
  return { companyName, companyLogo, isVerified };
}

// Distinct from the generic JobCard — left accent strip, inline quick-apply,
// salary as the visual anchor instead of a footer tag. Built for list/feed screens.
export function JobListCard({ job, onPress, onSave, onApply, saved, applied, applying }) {
  const { companyName, companyLogo, isVerified } = resolveCompany(job);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.accent} />

      <View style={styles.body}>
        <View style={styles.row}>
          <Avatar uri={companyLogo} name={companyName || job.title} size={42} />

          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <View style={styles.companyRow}>
              <Text style={styles.company} numberOfLines={1}>{companyName || 'Company'}</Text>
              {isVerified && <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />}
            </View>
          </View>

          <Pressable onPress={onSave} hitSlop={10} style={styles.saveBtn}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? COLORS.primary : COLORS.textLight} />
          </Pressable>
        </View>

        <View style={styles.chipsRow}>
          <View style={styles.salaryChip}>
            <Ionicons name="cash-outline" size={12} color={COLORS.primary} />
            <Text style={styles.salaryChipText}>{formatSalary(job.salary)}</Text>
          </View>
          <Chip icon="location-outline" text={jobLocation(job.location) || '—'} />
          <Chip icon="briefcase-outline" text={typeLabel(job.jobType)} />
        </View>

        <View style={styles.footer}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textLight} />
            <Text style={styles.time}>{timeAgo(job.publishedAt || job.createdAt)}</Text>
          </View>

          <Pressable
            onPress={onApply}
            disabled={applied || applying}
            style={[styles.applyBtn, applied && styles.applyBtnDone]}
          >
            {applying ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name={applied ? 'checkmark-circle' : 'paper-plane-outline'}
                  size={13}
                  color={applied ? COLORS.success : COLORS.white}
                />
                <Text style={[styles.applyBtnText, applied && styles.applyBtnTextDone]}>
                  {applied ? 'Applied' : 'Quick apply'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function Chip({ icon, text }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={12} color={COLORS.textSecondary} />
      <Text style={styles.chipText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardPressed: { backgroundColor: COLORS.surfaceAlt },

  accent: { width: 4, backgroundColor: COLORS.primary },

  body: { flex: 1, padding: SPACING.lg, gap: SPACING.md },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  titleBlock: { flex: 1 },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  company: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, flexShrink: 1 },
  saveBtn: { padding: 2 },

  chipsRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },

  salaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  salaryChipText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.primary },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    maxWidth: 120,
  },
  chipText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  time: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },

  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    minWidth: 96,
    justifyContent: 'center',
  },
  applyBtnDone: { backgroundColor: COLORS.successLight },
  applyBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.white },
  applyBtnTextDone: { color: COLORS.success },
});