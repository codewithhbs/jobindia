import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';
import { initials } from '../../utils/format';

export const Input = ({
  label,
  error,
  icon,
  style,
  containerStyle,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ gap: SPACING.xs }, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrap,
          focused && {
            borderColor: COLORS.primary,
            backgroundColor: COLORS.white,
          },
          error && {
            borderColor: COLORS.danger,
          },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={COLORS.textLight}
          />
        ) : null}

        <TextInput
          {...props}
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textLight}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
};

export const Card = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.9 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

export const Badge = ({
  label,
  color = COLORS.primary,
  bg,
}) => (
  <View
    style={[
      styles.badge,
      {
        backgroundColor: bg || `${color}1A`,
      },
    ]}
  >
    <Text style={[styles.badgeText, { color }]}>
      {label}
    </Text>
  </View>
);

export const Avatar = ({
  uri,
  name,
  size = 44,
}) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={{
          color: COLORS.primary,
          fontWeight: '700',
          fontSize: size * 0.36,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
};

export const Chip = ({
  label,
  active,
  onPress,
  icon,
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.chip,
      active && {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
      },
    ]}
  >
    {icon ? (
      <Ionicons
        name={icon}
        size={14}
        color={
          active
            ? COLORS.white
            : COLORS.textSecondary
        }
      />
    ) : null}

    <Text
      style={[
        styles.chipText,
        active && { color: COLORS.white },
      ]}
    >
      {label}
    </Text>
  </Pressable>
);


export const Select = ({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select option',
  error,
}) => {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || value;

  return (
    <View style={{ gap: SPACING.xs }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={() => setOpen((p) => !p)}
        style={[
          styles.selectBox,
          error && { borderColor: COLORS.danger },
        ]}
      >
        <Text
          style={{
            flex: 1,
            color: value ? COLORS.text : COLORS.textLight,
            fontSize: FONTS.sizes.md,
          }}
        >
          {selectedLabel || placeholder}
        </Text>

        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textLight}
        />
      </Pressable>

      {open && (
        <View style={styles.selectDropdown}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={[
                styles.selectItem,
                value === opt.value && {
                  backgroundColor: COLORS.primaryLight,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    value === opt.value
                      ? COLORS.primary
                      : COLORS.text,
                  fontWeight: '600',
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};


const styles = StyleSheet.create({
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,
  },

  input: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },

  error: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.danger,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },

  badgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },

  avatar: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  chipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectBox: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: COLORS.surfaceAlt,
  borderWidth: 1.5,
  borderColor: COLORS.border,
  borderRadius: RADIUS.lg,
  paddingHorizontal: SPACING.lg,
  minHeight: 52,
},

selectDropdown: {
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: RADIUS.lg,
  backgroundColor: COLORS.surface,
  marginTop: 6,
  overflow: 'hidden',
},

selectItem: {
  padding: SPACING.md,
},
});

const UI = {
  Input,
  Card,
  Badge,
  Avatar,
  Chip,
  Select
};

export default UI;