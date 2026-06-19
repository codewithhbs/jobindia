import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';

export function Button({
  title,
  onPress,
  variant = 'primary', // primary | secondary | outline | ghost | danger
  size = 'md', // sm | md | lg
  loading = false,
  disabled = false,
  icon,
  style,
  full = true,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, paddingVertical: s.py, borderRadius: s.radius },
        full && { alignSelf: 'stretch' },
        variant === 'primary' && SHADOWS.xs,
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={s.font + 2} color={v.text} />}
          <Text style={[styles.text, { color: v.text, fontSize: s.font }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS = {
  primary: { bg: COLORS.primary, text: COLORS.white, border: COLORS.primary },
  secondary: { bg: COLORS.secondary, text: COLORS.white, border: COLORS.secondary },
  outline: { bg: 'transparent', text: COLORS.primary, border: COLORS.primary },
  ghost: { bg: COLORS.primaryLight, text: COLORS.primary, border: COLORS.primaryLight },
  danger: { bg: COLORS.danger, text: COLORS.white, border: COLORS.danger },
};

const SIZES = {
  sm: { py: 9, font: FONTS.sizes.sm, radius: RADIUS.md },
  md: { py: 14, font: FONTS.sizes.md, radius: RADIUS.lg },
  lg: { py: 17, font: FONTS.sizes.lg, radius: RADIUS.lg },
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, paddingHorizontal: SPACING.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  text: { fontWeight: '700' },
});
