import React from 'react';
import { View, Text, Modal, StyleSheet, Linking, BackHandler, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { Button } from './Button';

export function UpdateModal({ visible, forceUpdate, storeUrl, onDismiss }) {
  const openStore = () => {
    if (storeUrl) Linking.openURL(storeUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {
      if (forceUpdate) return; // block hardware back on force update
      onDismiss?.();
    }}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Ionicons name="rocket-outline" size={48} color={COLORS.primary} />
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.subtitle}>
            {forceUpdate
              ? 'A new version of the app is required to continue. Please update now.'
              : 'A new version of the app is available with improvements and fixes.'}
          </Text>

          <Button title={`Update on ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'}`} onPress={openStore} size="lg" style={{ marginTop: SPACING.md, width: '100%' }} />

          {!forceUpdate ? (
            <Text style={styles.laterText} onPress={onDismiss}>Maybe later</Text>
          ) : (
            <Text style={styles.laterText} onPress={() => BackHandler.exitApp()}>Exit app</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    width: '100%',
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text, marginTop: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  laterText: { fontSize: FONTS.sizes.sm, color: COLORS.textLight, fontWeight: '600', marginTop: SPACING.sm, padding: SPACING.sm },
});