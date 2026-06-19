import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';

// ---- Variants: pick an icon + tint automatically, or override per-call ----
const VARIANTS = {
  info: { icon: 'information-circle', color: COLORS.primary, bg: COLORS.primaryLight },
  success: { icon: 'checkmark-circle', color: COLORS.success, bg: COLORS.successLight },
  warning: { icon: 'alert-circle', color: COLORS.accent, bg: COLORS.warningLight },
  danger: { icon: 'close-circle', color: COLORS.danger, bg: COLORS.dangerLight },
};

let _show = () => console.warn('AppAlertHost is not mounted yet');
let _hide = () => {};

/**
 * Mount this ONCE near the root of the app (e.g. in App.js, next to your
 * toast host), then call `Alert.show(...)` / `Alert.hide()` from anywhere —
 * no props, no context, no navigation prop drilling.
 */
export function AppAlertHost() {
  const [state, setState] = useState(null);

  _show = (cfg) => setState(cfg);
  _hide = () => setState(null);

  if (!state) return null;
  const v = VARIANTS[state.variant || 'info'];
  const buttons = state.buttons?.length ? state.buttons : [{ text: 'OK', style: 'primary' }];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={_hide} statusBarTranslucent>
      <Pressable
        style={styles.backdrop}
        onPress={state.dismissible !== false ? _hide : undefined}
      >
        {/* inner Pressable swallows the tap so the backdrop press above doesn't close it */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.iconWrap, { backgroundColor: v.bg }]}>
            <Ionicons name={state.icon || v.icon} size={26} color={v.color} />
          </View>

          {state.title ? <Text style={styles.title}>{state.title}</Text> : null}
          {state.message ? <Text style={styles.message}>{state.message}</Text> : null}

          <View style={styles.buttons}>
            {buttons.map((b, i) => (
              <Pressable
                key={i}
                disabled={b.disabled}
                style={({ pressed }) => [
                  styles.btn,
                  b.style === 'primary' && styles.btnPrimary,
                  b.style === 'danger' && styles.btnDanger,
                  b.style === 'cancel' && styles.btnCancel,
                  pressed && { opacity: 0.85 },
                  b.disabled && { opacity: 0.5 },
                ]}
                onPress={() => {
                  _hide();
                  b.onPress?.();
                }}
              >
                <Text
                  style={[
                    styles.btnText,
                    (b.style === 'primary' || b.style === 'danger') && styles.btnTextOnColor,
                  ]}
                >
                  {b.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Imperative API — usable from any file, no hooks needed:
 *
 *   Alert.show({
 *     variant: 'warning',                 // info | success | warning | danger
 *     icon: 'person-circle-outline',      // optional override
 *     title: 'Complete your profile',
 *     message: 'Finish your profile to apply.',
 *     dismissible: true,                  // tap outside to close (default true)
 *     buttons: [
 *       { text: 'Later', style: 'cancel' },
 *       { text: 'Complete Profile', style: 'primary', onPress: () => nav... },
 *     ],
 *   });
 *
 *   Alert.hide();
 */
export const Alert = {
  show: (config) => _show(config),
  hide: () => _hide(),
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  message: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  buttons: { width: '100%', gap: SPACING.sm },
  btn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnDanger: { backgroundColor: COLORS.danger },
  btnCancel: { backgroundColor: COLORS.surfaceAlt },
  btnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  btnTextOnColor: { color: COLORS.white },
});