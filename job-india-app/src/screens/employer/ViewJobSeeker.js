import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { toast } from '../../utils/toast';
import { Screen, Loader, EmptyState } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { Badge, Avatar } from '../../components/ui';
import { userApi } from '../../api/user.api';

const BASE_SERVER = 'https://jobapi.adsdigitalmedia.com';

function fileUrl(path) {
    if (!path) return null;
    return path.startsWith('http') ? path : `${BASE_SERVER}${path}`;
}

function formatSalaryRange(salary) {
    if (!salary) return null;
    const { min, max, period } = salary;
    const suffix = period === 'monthly' ? '/mo' : period === 'yearly' ? '/yr' : '';
    const fmt = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n));
    if (min && max) return `₹${fmt(min)} - ₹${fmt(max)}${suffix}`;
    if (min) return `₹${fmt(min)}+${suffix}`;
    if (max) return `Up to ₹${fmt(max)}${suffix}`;
    return null;
}

function experienceLabel(months) {
    if (months == null) return null;
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m` : `${years} years`;
}

function jobTypeLabel(t) {
    const map = {
        full_time: 'Full Time', part_time: 'Part Time',
        contract: 'Contract', freelance: 'Freelance', internship: 'Internship',
    };
    return map[t] || t;
}

function formatDateRange(start, end, isCurrent) {
    const parts = [start || '—'];
    parts.push(isCurrent ? 'Present' : (end || '—'));
    return parts.join(' – ');
}

export default function ViewJobSeeker({ navigation, route }) {
    const id = route?.params?.applicationId;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await userApi.getUniversalProfile(id);
            setData(res?.data || res); // tolerate either {success,data} or already-unwrapped
        } catch (e) {
            toast.error('Could not load profile', e.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <Screen>
                <Header title="Candidate Profile" onBack={() => navigation.goBack()} />
                <Loader text="Loading profile..." />
            </Screen>
        );
    }

    if (!data?.user) {
        return (
            <Screen>
                <Header title="Candidate Profile" onBack={() => navigation.goBack()} />
                <EmptyState icon="person-outline" title="Profile not found" subtitle="This candidate's profile could not be loaded" />
            </Screen>
        );
    }

    const { user, profile = {} } = data;
    const hasResume = !!profile.resume?.uploadedAt;
    const salaryRange = formatSalaryRange(profile.expectedSalary);
    const expLabel = experienceLabel(profile.totalExperienceMonths);
    const location = [user.location?.city, user.location?.state].filter(Boolean).join(', ');

    const call = () => {
        if (!user.phone) return toast.error('No phone number available');
        Linking.openURL(`tel:${user.phone}`);
    };

    const email = () => {
        if (!user.email) return toast.error('No email available');
        Linking.openURL(`mailto:${user.email}`);
    };

    const openResume = () => {
        const url = fileUrl(profile.resume?.fileUrl);
        if (!url) return toast.error('No resume uploaded');
        Linking.openURL(url);
    };

    const openLink = (url) => {
        if (!url) return;
        Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
    };

    return (
        <Screen edges={['top']} noPadding>
            <Header title="Candidate Profile" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Identity card */}
                <View style={styles.card}>
                    <View style={styles.identityRow}>
                        <Avatar uri={fileUrl(user.avatar)} name={user.name} size={64} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{user.name}</Text>
                            {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
                            <View style={styles.metaRow}>
                                {location ? (
                                    <View style={styles.metaItem}>
                                        <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                                        <Text style={styles.metaText}>{location}</Text>
                                    </View>
                                ) : null}
                                {expLabel && (
                                    <View style={styles.metaItem}>
                                        <Ionicons name="briefcase-outline" size={12} color={COLORS.textSecondary} />
                                        <Text style={styles.metaText}>{expLabel} exp</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.badgeRow}>
                        {profile.isOpenToWork && <Badge label="Open to work" color="#22C55E" />}
             
                        {profile.profileCompleteness != null && (
                            <Badge label={`${profile.profileCompleteness}% complete`} color={COLORS.primary} />
                        )}
                    </View>

                    <View style={styles.contactActions}>
                        <Pressable style={[styles.contactBtn, styles.callBtn]} onPress={call}>
                            <Ionicons name="call" size={16} color="#22C55E" />
                            <Text style={[styles.contactBtnText, { color: '#22C55E' }]}>Call</Text>
                        </Pressable>
                        <Pressable style={[styles.contactBtn, styles.emailBtn]} onPress={email}>
                            <Ionicons name="mail" size={16} color={COLORS.primary} />
                            <Text style={[styles.contactBtnText, { color: COLORS.primary }]}>Email</Text>
                        </Pressable>
                    </View>
                </View>

                {/* About */}
                {profile.about ? (
                    <Section title="About">
                        <Text style={styles.body}>{profile.about}</Text>
                    </Section>
                ) : null}

                {/* Resume */}
                <Section title="Resume">
                    <Pressable
                        style={[styles.resumeRow, !hasResume && styles.resumeRowDisabled]}
                        onPress={hasResume ? openResume : undefined}
                        disabled={!hasResume}
                    >
                        <View style={[styles.resumeIconWrap, hasResume && styles.resumeIconWrapActive]}>
                            <Ionicons
                                name={hasResume ? 'document-text' : 'document-outline'}
                                size={20}
                                color={hasResume ? COLORS.primary : COLORS.textLight}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.resumeTitle} numberOfLines={1}>
                                {hasResume ? profile.resume.fileName : 'No resume uploaded'}
                            </Text>
                            {hasResume && (
                                <Text style={styles.resumeSub}>
                                    Uploaded {new Date(profile.resume.uploadedAt).toLocaleDateString()}
                                </Text>
                            )}
                        </View>
                        {hasResume && <Ionicons name="open-outline" size={18} color={COLORS.primary} />}
                    </Pressable>
                </Section>

                {/* Skills */}
                {profile.skills?.length > 0 && (
                    <Section title="Skills">
                        <View style={styles.chipWrap}>
                            {profile.skills.map((s) => (
                                <View key={s} style={styles.skillChip}>
                                    <Text style={styles.skillChipText}>{s}</Text>
                                </View>
                            ))}
                        </View>
                    </Section>
                )}

                {/* Experience */}
                {profile.experience?.length > 0 && (
                    <Section title="Experience">
                        {profile.experience.map((exp, idx) => (
                            <View key={exp._id || idx} style={styles.timelineItem}>
                                <View style={styles.timelineDotCol}>
                                    <View style={[styles.timelineDot, exp.isCurrent && styles.timelineDotActive]} />
                                    {idx < profile.experience.length - 1 && <View style={styles.timelineLine} />}
                                </View>
                                <View style={{ flex: 1, paddingBottom: SPACING.md }}>
                                    <Text style={styles.timelineTitle}>{exp.jobTitle}</Text>
                                    <Text style={styles.timelineSub}>
                                        {exp.company}{exp.location ? ` · ${exp.location}` : ''}
                                    </Text>
                                    <Text style={styles.timelineMeta}>
                                        {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                                        {exp.employmentType ? `  ·  ${jobTypeLabel(exp.employmentType)}` : ''}
                                    </Text>
                                    {exp.description ? <Text style={styles.timelineDesc}>{exp.description}</Text> : null}
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* Education */}
                {profile.education?.length > 0 && (
                    <Section title="Education">
                        {profile.education.map((edu, idx) => (
                            <View key={edu._id || idx} style={styles.timelineItem}>
                                <View style={styles.timelineDotCol}>
                                    <View style={[styles.timelineDot, edu.isPursuing && styles.timelineDotActive]} />
                                    {idx < profile.education.length - 1 && <View style={styles.timelineLine} />}
                                </View>
                                <View style={{ flex: 1, paddingBottom: SPACING.md }}>
                                    <Text style={styles.timelineTitle}>
                                        {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                                    </Text>
                                    <Text style={styles.timelineSub}>{edu.institution}</Text>
                                    <Text style={styles.timelineMeta}>
                                        {edu.startYear}{edu.isPursuing ? ' – Present' : ''}
                                        {edu.grade ? `  ·  Grade: ${edu.grade}` : ''}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* Preferences */}
                <Section title="Job Preferences">
                    <View style={styles.prefGrid}>
                        {salaryRange && <PrefItem icon="cash-outline" label="Expected Salary" value={salaryRange} />}
                        <PrefItem icon="time-outline" label="Availability" value={(profile.availability || '—').replace('_', ' ')} />
                        {profile.noticePeriodDays != null && (
                            <PrefItem icon="calendar-outline" label="Notice Period" value={`${profile.noticePeriodDays} days`} />
                        )}
                        <PrefItem icon="navigate-outline" label="Relocate" value={profile.willingToRelocate ? 'Yes' : 'No'} />
                    </View>

                    {profile.preferredJobTypes?.length > 0 && (
                        <View style={styles.chipWrap}>
                            {profile.preferredJobTypes.map((t) => (
                                <View key={t} style={styles.prefChip}>
                                    <Text style={styles.prefChipText}>{jobTypeLabel(t)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </Section>

                {/* Links */}
                {(profile.links?.linkedin || profile.links?.github || profile.links?.portfolio) && (
                    <Section title="Links">
                        <View style={{ gap: SPACING.sm }}>
                            {profile.links.linkedin ? (
                                <LinkRow icon="logo-linkedin" label="LinkedIn" onPress={() => openLink(profile.links.linkedin)} />
                            ) : null}
                            {profile.links.github ? (
                                <LinkRow icon="logo-github" label="GitHub" onPress={() => openLink(profile.links.github)} />
                            ) : null}
                            {profile.links.portfolio ? (
                                <LinkRow icon="globe-outline" label="Portfolio" onPress={() => openLink(profile.links.portfolio)} />
                            ) : null}
                        </View>
                    </Section>
                )}

            </ScrollView>
        </Screen>
    );
}

function Section({ title, children }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function PrefItem({ icon, label, value }) {
    return (
        <View style={styles.prefItem}>
            <Ionicons name={icon} size={16} color={COLORS.primary} />
            <View>
                <Text style={styles.prefValue}>{value}</Text>
                <Text style={styles.prefLabel}>{label}</Text>
            </View>
        </View>
    );
}

function LinkRow({ icon, label, onPress }) {
    return (
        <Pressable style={styles.linkRow} onPress={onPress}>
            <Ionicons name={icon} size={18} color={COLORS.primary} />
            <Text style={styles.linkText}>{label}</Text>
            <Ionicons name="open-outline" size={15} color={COLORS.textSecondary} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl +30 },

    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl || 18,
        padding: SPACING.lg,
        gap: SPACING.md,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    identityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
    name: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.text },
    headline: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
    metaRow: { flexDirection: 'row', gap: SPACING.md, marginTop: 6, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '500' },

    badgeRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },

    contactActions: { flexDirection: 'row', gap: SPACING.sm },
    contactBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, borderRadius: RADIUS.md || 10,
    },
    callBtn: { backgroundColor: '#22C55E14' },
    emailBtn: { backgroundColor: `${COLORS.primary}14` },
    contactBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },

    section: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl || 18,
        padding: SPACING.lg,
        gap: SPACING.sm,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
    body: { fontSize: FONTS.sizes.sm, color: COLORS.gray600, lineHeight: 21 },

    resumeRow: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
        backgroundColor: `${COLORS.primary}08`,
        borderRadius: RADIUS.lg || 14,
        padding: SPACING.md,
    },
    resumeRowDisabled: { backgroundColor: '#F8FAFC' },
    resumeIconWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center', justifyContent: 'center',
    },
    resumeIconWrapActive: { backgroundColor: `${COLORS.primary}1A` },
    resumeTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
    resumeSub: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 1 },

    chipWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    skillChip: { backgroundColor: `${COLORS.primary}10`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    skillChipText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.primary },

    timelineItem: { flexDirection: 'row', gap: SPACING.md },
    timelineDotCol: { alignItems: 'center', width: 16 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1', marginTop: 4 },
    timelineDotActive: { backgroundColor: COLORS.primary },
    timelineLine: { flex: 1, width: 2, backgroundColor: '#E2E8F0', marginTop: 4 },
    timelineTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
    timelineSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 1 },
    timelineMeta: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 3 },
    timelineDesc: { fontSize: FONTS.sizes.sm, color: COLORS.gray600, marginTop: 6, lineHeight: 19 },

    prefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
    prefItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '47%' },
    prefValue: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
    prefLabel: { fontSize: 11, color: COLORS.textSecondary },
    prefChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    prefChipText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.text },

    linkRow: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        paddingVertical: 8,
    },
    linkText: { flex: 1, fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
});