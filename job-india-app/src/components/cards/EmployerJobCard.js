// components/cards/EmployerJobCard.js
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { Alert } from '../ui/AppAlert';

const STATUS_META = {
  active: { label: 'Active', color: '#22C55E' },
  closed: { label: 'Closed', color: '#94A3B8' },
  draft: { label: 'Draft', color: '#F59E0B' },
  expired: { label: 'Expired', color: '#EF4444' },
  paused: { label: 'Paused', color: '#F59E0B' },
};

const JOB_TYPE_LABELS = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  freelance: 'Freelance',
  internship: 'Internship',
};

function formatSalary(salary) {
  if (!salary) return 'Not disclosed';
  const { min, max, period } = salary;
  const suffix = period === 'monthly' ? '/mo' : period === 'yearly' ? '/yr' : '';
  if (min && max) return `₹${formatNum(min)} - ₹${formatNum(max)}${suffix}`;
  if (min) return `₹${formatNum(min)}+${suffix}`;
  if (max) return `Up to ₹${formatNum(max)}${suffix}`;
  return 'Not disclosed';
}

function formatNum(n) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function jobLocation(location) {
  if (!location) return '';
  if (location.isRemote) return 'Remote';
  return [location.city, location.state].filter(Boolean).join(', ');
}

function typeLabel(jobType) {
  return JOB_TYPE_LABELS[jobType] || jobType || '';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function EmployerJobCard({ job, onPress, onViewApplicants, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = STATUS_META[job.status] || STATUS_META.active;
  const applicantCount = job.applications ?? job.applicantsCount ?? 0;

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const handleEdit = () => {
    closeMenu();
    onEdit?.();
  };

  const handleDelete = () => {
    closeMenu();
    Alert.show({
      variant: 'danger',
      icon: 'trash-outline',
      title: 'Delete job posting',
      message: `Are you sure you want to delete "${job.title}"? This action cannot be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete?.() },
      ],
    });
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="cash-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>{formatSalary(job.salary)}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${status.color}14` }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>

          <Pressable onPress={openMenu} hitSlop={10} style={styles.menuBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>{jobLocation(job.location) || '—'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="briefcase-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>{typeLabel(job.jobType)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{applicantCount}</Text>
            <Text style={styles.statLabel}>Applicants</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{job.vacancies ?? 1}</Text>
            <Text style={styles.statLabel}>Openings</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{job.views ?? 0}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statBlock}>
            <Text style={styles.statValueSmall}>{timeAgo(job.publishedAt || job.createdAt)}</Text>
            <Text style={styles.statLabel}>Posted</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btnOutline, pressed && styles.btnOutlinePressed]}
          onPress={onPress}
        >
          <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
          <Text style={styles.btnOutlineText}>View Job</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnFilled, pressed && styles.btnFilledPressed]}
          onPress={onViewApplicants}
        >
          <Ionicons name="people-outline" size={16} color="#fff" />
          <Text style={styles.btnFilledText}>Applications</Text>
          {applicantCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{applicantCount > 99 ? '99+' : applicantCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* 3-dot dropdown menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <View style={styles.menuBox}>
            <Pressable style={styles.menuItem} onPress={handleEdit}>
              <Ionicons name="create-outline" size={18} color={COLORS.text} />
              <Text style={styles.menuItemText}>Edit Job</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete Job</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface || '#fff',
    borderRadius: RADIUS.xl || 18,
    padding: SPACING.md,
    gap: SPACING.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pressed: { opacity: 0.96 },

  top: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  title: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  menuBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -2,
  },

  infoRow: { flexDirection: 'row', gap: SPACING.md, marginTop: 2 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  infoText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '500' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginTop: SPACING.xs },

  statsRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
  statBlock: { flex: 1, alignItems: 'center', gap: 2 },
  statSep: { width: 1, height: 26, backgroundColor: '#F1F5F9' },
  statValue: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.text },
  statValueSmall: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  btnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: RADIUS.md || 12,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  btnOutlinePressed: { backgroundColor: `${COLORS.primary}0D` },
  btnOutlineText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },

  btnFilled: {
    flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: RADIUS.md || 12,
    backgroundColor: COLORS.primary,
  },
  btnFilledPressed: { opacity: 0.9 },
  btnFilledText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: '#fff' },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6, paddingVertical: 1.5,
    borderRadius: 10, minWidth: 20, alignItems: 'center',
  },
  countBadgeText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },

  // Menu modal
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBox: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg || 14,
    paddingVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 16,
  },
  menuItemText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 8 },
});