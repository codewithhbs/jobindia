import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../constants/theme';

export function Screen({ children, style, edges = ['top'], scroll = false }) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

export function Loader({ text }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {!!text && <Text style={styles.muted}>{text}</Text>}
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle }) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.muted}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, gap: SPACING.sm },
  muted: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, textAlign: 'center' },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
});
