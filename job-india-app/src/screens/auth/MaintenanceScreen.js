import React from 'react';
import { View, Text, StyleSheet, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';

export function MaintenanceScreen({ settings }) {
  const supportEmail = settings?.support_email;
  const supportPhone = settings?.support_phone;

  return (
    <View style={styles.container}>
      {settings?.app_logo ? (
        <Image source={{ uri: settings.app_logo }} style={styles.logo} resizeMode="contain" />
      ) : (
        <Ionicons name="construct-outline" size={64} color={COLORS.primary} />
      )}

      <Text style={styles.title}>We'll be right back</Text>
      <Text style={styles.subtitle}>
        {settings?.app_name || 'The app'} is currently under maintenance. Please check back shortly.
      </Text>

      {supportEmail || supportPhone ? (
        <View style={styles.supportBox}>
          <Text style={styles.supportLabel}>Need help right now?</Text>
          {supportPhone ? (
            <Button
              title={`Call ${supportPhone}`}
              variant="outline"
              onPress={() => Linking.openURL(`tel:${supportPhone}`)}
              style={{ marginTop: SPACING.sm }}
            />
          ) : null}
          {supportEmail ? (
            <Text style={styles.supportEmail} onPress={() => Linking.openURL(`mailto:${supportEmail}`)}>
              {supportEmail}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  logo: { width: 80, height: 80, marginBottom: SPACING.sm },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  supportBox: { marginTop: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  supportLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textLight, fontWeight: '600' },
  supportEmail: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
});