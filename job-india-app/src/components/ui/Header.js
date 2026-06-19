import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../constants/theme';

export function Header({ title, subtitle, onBack, right, style }) {
  return (
    <View style={[styles.header, style]}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={styles.right}>{right || <View style={{ width: 40 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 1 },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
