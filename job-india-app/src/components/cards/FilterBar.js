import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { JOB_TYPES } from '../../constants/config';
import { useFetch } from '../../hooks/useFetch';
import { adminApi } from '../../api/admin.api';

const SORT_OPTIONS = [
    { value: 'createdAt', label: 'Newest' },
    { value: 'salaryMax', label: 'Salary: High to Low' },
    { value: 'experience', label: 'Experience' },
];

// params: { category, jobType, salaryMin, salaryMax, experience, isRemote, sortBy }
export function FilterBar({ filters, onChange, onClear }) {
    const [sheet, setSheet] = useState(null); // 'category' | 'jobType' | 'sort' | 'salary' | null
    const { data: categoriesRaw, loading: categoriesLoading } = useFetch(() => adminApi.categories(), []);

    // ── Guard against the load gap: data starts undefined, then resolves to an array. ──
    const categories = (categoriesRaw || [])
        .filter((c) => c.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((c) => ({ value: c.name, label: c.name, icon: c.icon }));

    const selectedCategory = categories.find((c) => c.name === filters.category);

    const activeCount =
        (filters.category ? 1 : 0) +
        (filters.jobType ? 1 : 0) +
        (filters.isRemote ? 1 : 0) +
        (filters.salaryMin || filters.salaryMax ? 1 : 0);

    const set = (patch) => onChange({ ...filters, ...patch });

    return (
        <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                <FilterChip
                    label={categoriesLoading ? 'Category' : (selectedCategory?.label || 'Category')}
                    active={!!filters.category}
                    loading={categoriesLoading}
                    onPress={() => {
                        if (categoriesLoading) return;
                        setSheet('category');
                    }}
                />
                <FilterChip
                    label={filters.jobType ? JOB_TYPES.find((t) => t.value === filters.jobType)?.label || 'Job type' : 'Job type'}
                    active={!!filters.jobType}
                    onPress={() => setSheet('jobType')}
                />
                <FilterChip
                    label="Remote"
                    active={!!filters.isRemote}
                    onPress={() => set({ isRemote: filters.isRemote ? undefined : true })}
                />
                <FilterChip
                    label={filters.salaryMin || filters.salaryMax ? 'Salary ✓' : 'Salary'}
                    active={!!(filters.salaryMin || filters.salaryMax)}
                    onPress={() => setSheet('salary')}
                />
                <FilterChip
                    label={SORT_OPTIONS.find((s) => s.value === filters.sortBy)?.label || 'Sort'}
                    icon="swap-vertical"
                    onPress={() => setSheet('sort')}
                />
                {activeCount > 0 && (
                    <Pressable style={styles.clearBtn} onPress={onClear}>
                        <Ionicons name="close-circle" size={14} color={COLORS.danger} />
                        <Text style={styles.clearText}>Clear</Text>
                    </Pressable>
                )}
            </ScrollView>

            <FilterSheet
                visible={sheet === 'category'}
                title="Category"
                onClose={() => setSheet(null)}
                options={categories}
                selected={filters.category}
                onSelect={(v) => { set({ category: v }); setSheet(null); }}
            />
            <FilterSheet
                visible={sheet === 'jobType'}
                title="Job type"
                onClose={() => setSheet(null)}
                options={JOB_TYPES}
                selected={filters.jobType}
                onSelect={(v) => { set({ jobType: v }); setSheet(null); }}
            />
            <FilterSheet
                visible={sheet === 'sort'}
                title="Sort by"
                onClose={() => setSheet(null)}
                options={SORT_OPTIONS}
                selected={filters.sortBy}
                onSelect={(v) => { set({ sortBy: v }); setSheet(null); }}
            />
            <SalarySheet
                visible={sheet === 'salary'}
                onClose={() => setSheet(null)}
                salaryMin={filters.salaryMin}
                salaryMax={filters.salaryMax}
                onApply={(min, max) => { set({ salaryMin: min, salaryMax: max }); setSheet(null); }}
            />
        </View>
    );
}

function FilterChip({ label, active, icon, loading, onPress }) {
    return (
        <Pressable onPress={onPress} disabled={loading} style={[styles.chip, active && styles.chipActive, loading && styles.chipDisabled]}>
            {icon && <Ionicons name={icon} size={13} color={active ? COLORS.white : COLORS.textSecondary} />}
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{label}</Text>
            <Ionicons name="chevron-down" size={13} color={active ? COLORS.white : COLORS.textLight} />
        </Pressable>
    );
}

function FilterSheet({ visible, title, options, selected, onSelect, onClose }) {
    const safeOptions = options || [];
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.sheetTitle}>{title}</Text>
                    {safeOptions.length === 0 ? (
                        <Text style={styles.emptyText}>Nothing to show</Text>
                    ) : (
                        safeOptions.map((o) => {
                            const isSelected = selected === o.value;
                            return (
                                <Pressable
                                    key={o.value}
                                    style={[styles.sheetOption, isSelected && styles.sheetOptionActive]}
                                    onPress={() => onSelect(o.value)}
                                >
                                    <Text style={[styles.sheetOptionText, isSelected && styles.sheetOptionTextActive]}>
                                        {o.icon ? `${o.icon}  ` : ''}{o.label}
                                    </Text>
                                    {isSelected && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                                </Pressable>
                            );
                        })
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function SalarySheet({ visible, salaryMin, salaryMax, onApply, onClose }) {
    const PRESETS = [
        { label: 'Any', min: undefined, max: undefined },
        { label: 'Under ₹5L', min: undefined, max: 500000 },
        { label: '₹5L – ₹10L', min: 500000, max: 1000000 },
        { label: '₹10L – ₹20L', min: 1000000, max: 2000000 },
        { label: '₹20L+', min: 2000000, max: undefined },
    ];
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.sheetTitle}>Salary range</Text>
                    {PRESETS.map((p) => {
                        const isSelected = p.min === salaryMin && p.max === salaryMax;
                        return (
                            <Pressable
                                key={p.label}
                                style={[styles.sheetOption, isSelected && styles.sheetOptionActive]}
                                onPress={() => onApply(p.min, p.max)}
                            >
                                <Text style={[styles.sheetOptionText, isSelected && styles.sheetOptionTextActive]}>{p.label}</Text>
                                {isSelected && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                            </Pressable>
                        );
                    })}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: SPACING.sm },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: SPACING.md, paddingVertical: 8,
        borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt,
        borderWidth: 1, borderColor: COLORS.border, maxWidth: 160,
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipDisabled: { opacity: 0.5 },
    chipText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary, flexShrink: 1 },
    chipTextActive: { color: COLORS.white },

    clearBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: SPACING.md, paddingVertical: 8,
    },
    clearText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.danger },

    overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
        padding: SPACING.lg, paddingBottom: SPACING.xxl,
    },
    sheetTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
    sheetOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    sheetOptionActive: {},
    sheetOptionText: { fontSize: FONTS.sizes.md, color: COLORS.text },
    sheetOptionTextActive: { color: COLORS.primary, fontWeight: '700' },
    emptyText: { fontSize: FONTS.sizes.sm, color: COLORS.textLight, paddingVertical: SPACING.lg, textAlign: 'center' },
});