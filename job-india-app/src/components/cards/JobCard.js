import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Avatar } from '../ui';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';
import { formatSalary, jobLocation, timeAgo } from '../../utils/format';
import { JOB_TYPES, APPLICATION_STATUS } from '../../constants/config';

const typeLabel = (v) => JOB_TYPES.find((t) => t.value === v)?.label || v;
const APP_STAGE_ORDER = ['applied', 'reviewing', 'shortlisted', 'interview', 'selected'];
const APP_REJECTED = ['rejected', 'withdrawn'];
 
function appStageIndex(status) {
  const i = APP_STAGE_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}


export function JobCard({ job, onPress, onSave, saved }) {
  const ep = job.employerProfile || {};
  console.log(job)
  const companyName = ep.companyName || job.companyName;
  const companyLogo = ep.companyLogo
    ? (ep.companyLogo.startsWith('http') ? ep.companyLogo : `${API_BASE_URL}${ep.companyLogo}`)
    : job.companyLogo;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>

      <View style={styles.top}>
        <Avatar uri={companyLogo} name={companyName || job.title} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
          <View style={styles.companyRow}>
            <Text style={styles.company} numberOfLines={1}>{companyName || 'Company'}</Text>
            {ep.verificationStatus === 'approved' && (
              <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
            )}
          </View>
          {(ep.industry || ep.companySize) ? (
            <Text style={styles.companyMeta} numberOfLines={1}>
              {[ep.industry, ep.companySize && `${ep.companySize} employees`].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
        {onSave && (
          <Pressable onPress={onSave} hitSlop={10} style={styles.saveBtn}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color={saved ? COLORS.primary : COLORS.textLight} />
          </Pressable>
        )}
      </View>

      <View style={styles.meta}>
        <Meta icon="cash-outline" text={formatSalary(job.salary)} />
        <Meta icon="location-outline" text={jobLocation(job.location) || '—'} />
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.tags}>
          <Tag label={typeLabel(job.jobType)} />
          {job.category ? <Tag label={job.category} muted /> : null}
        </View>
        <Text style={styles.time}>{timeAgo(job.publishedAt || job.createdAt)}</Text>
      </View>
    </Pressable>
  );
}


export function ApplicationCard({ application, onPress }) {
  const job = application.jobId || {};
  const status = APPLICATION_STATUS[application.status] || { label: application.status, color: COLORS.gray500 };
  const isRejected = APP_REJECTED.includes(application.status);
  const stageIdx = appStageIndex(application.status);
 
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.appCard, pressed && styles.cardPressed]}>
      <View style={styles.appTop}>
        <Avatar uri={job.companyLogo} name={job.companyName || application.jobTitle} size={46} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{job.title || application.jobTitle}</Text>
          <Text style={styles.company} numberOfLines={1}>{job.companyName || 'Company'}</Text>
          <View style={styles.appMetaRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textLight} />
            <Text style={styles.appliedText}>Applied {timeAgo(application.appliedAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: isRejected ? COLORS.dangerLight : status.color ? `${status.color}1A` : COLORS.primaryLight }]}>
          <View style={[styles.statusDot, { backgroundColor: isRejected ? COLORS.danger : status.color || COLORS.primary }]} />
          <Text style={[styles.statusPillText, { color: isRejected ? COLORS.danger : status.color || COLORS.primary }]} numberOfLines={1}>
            {status.label}
          </Text>
        </View>
      </View>
 
      {!isRejected && (
        <View style={styles.timeline}>
          {APP_STAGE_ORDER.map((stage, idx) => {
            const filled = idx <= stageIdx;
            const isLast = idx === APP_STAGE_ORDER.length - 1;
            return (
              <React.Fragment key={stage}>
                <View style={[styles.timelineDot, filled && styles.timelineDotFilled]} />
                {!isLast && <View style={[styles.timelineBar, idx < stageIdx && styles.timelineBarFilled]} />}
              </React.Fragment>
            );
          })}
        </View>
      )}
 
      {isRejected && (
        <View style={styles.rejectedNote}>
          <Ionicons name="information-circle-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.rejectedNoteText}>
            {application.status === 'withdrawn' ? 'You withdrew this application' : 'Not selected this time — keep applying!'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
 
function Meta({ icon, text }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={COLORS.textSecondary} />
      <Text style={styles.metaText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

// Lightweight, flat tag — used instead of the heavier Badge for job-card footer chips.
function Tag({ label, muted }) {
  return (
    <View style={[styles.tag, muted && styles.tagMuted]}>
      <Text style={[styles.tagText, muted && styles.tagTextMuted]}>{label}</Text>
    </View>
  );
}

const applicationCardStyles = {
  appCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  appTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  appMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  appliedText: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
 
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    maxWidth: 110,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
 
  timeline: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  timelineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.gray200,
    borderWidth: 2, borderColor: COLORS.surface,
  },
  timelineDotFilled: { backgroundColor: COLORS.primary },
  timelineBar: { flex: 1, height: 2, backgroundColor: COLORS.gray200 },
  timelineBarFilled: { backgroundColor: COLORS.primary },
 
  rejectedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  rejectedNoteText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, flex: 1 },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.none,
  },
  cardPressed: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.primaryMid,
  },

  featuredRibbon: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  featuredRibbonText: { fontSize: 10, fontWeight: '700', color: COLORS.white },

  top: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  company: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 1 },
  saveBtn: { padding: 2 },

  meta: { flexDirection: 'row', gap: SPACING.lg, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },

  divider: { height: 1, backgroundColor: COLORS.border },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tags: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', flex: 1 },

  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
  },
  tagText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.primary },
  tagMuted: { backgroundColor: COLORS.surfaceAlt },
  tagTextMuted: { color: COLORS.textSecondary },

  time: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  ...applicationCardStyles
});