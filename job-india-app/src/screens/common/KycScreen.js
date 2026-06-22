import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { kycApi } from '../../api/kyc.api';
import { useFetch } from '../../hooks/useFetch';
import { Loader, Screen } from '../../components/ui/Screen';
import { Badge, Card } from '../../components/ui';
import { Button } from '../../components/ui/Button';

const STATUS_CONFIG = {
  approved: {
    color: COLORS.success,
    icon: 'shield-checkmark',
    title: 'You’re verified!',
    message: 'Your KYC documents have been approved. You can now apply for jobs without restrictions.',
  },
  pending: {
    color: COLORS.accent,
    icon: 'time-outline',
    title: 'Verification in progress',
    message: 'Your documents are being reviewed. This usually takes 24–48 hours.',
  },
  under_review: {
    color: COLORS.accent,
    icon: 'time-outline',
    title: 'Under review',
    message: 'Our team is currently reviewing your submitted documents.',
  },
  rejected: {
    color: COLORS.danger,
    icon: 'close-circle-outline',
    title: 'Verification rejected',
    message: 'Some documents didn’t pass review. Please resubmit with correct details.',
  },
  not_submitted: {
    color: COLORS.gray500,
    icon: 'alert-circle-outline',
    title: 'KYC not submitted',
    message: 'Complete your KYC verification to start applying for jobs.',
  },
};

export default function KycScreen({ navigation }) {
  const { data, loading, refetch } = useFetch(() => kycApi.status(), []);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (loading && !data) {
    return (
      <Screen>
        <Header title="KYC / Documents" onBack={() => navigation.goBack()} />
        <Loader />
      </Screen>
    );
  }

  const status = data?.overallStatus || 'not_submitted';
  const user = data?.user || {};
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_submitted;

  return (
    <Screen>
      <Header title="KYC / Documents" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <Card style={[styles.statusCard, { borderColor: config.color + '40' }]}>
          <View style={[styles.iconWrap, { backgroundColor: config.color + '1A' }]}>
            <Ionicons name={config.icon} size={36} color={config.color} />
          </View>
          <Text style={styles.statusTitle}>{config.title}</Text>
          <Badge label={status.replace('_', ' ')} color={config.color} />
          <Text style={styles.statusMessage}>{config.message}</Text>

          {(status === 'rejected' || status === 'not_submitted') && (
            <Button
              title={status === 'rejected' ? 'Resubmit Documents' : 'Start Verification'}
              onPress={() => navigation.navigate('KycUpload')}
              size="md"
              style={{ marginTop: SPACING.sm, width: '100%' }}
            />
          )}
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Verification Details</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoLabel}>Phone</Text>
            <View style={styles.infoValueWrap}>
              <Text style={styles.infoValue}>{user.phone || '—'}</Text>
              <Ionicons
                name={user.isPhoneVerified ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={user.isPhoneVerified ? COLORS.success : COLORS.danger}
              />
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoLabel}>Email</Text>
            <View style={styles.infoValueWrap}>
              <Text style={styles.infoValue}>{user.email || 'Not added'}</Text>
              <Ionicons
                name={user.isEmailVerified ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={user.isEmailVerified ? COLORS.success : COLORS.danger}
              />
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoLabel}>Profile</Text>
            <View style={styles.infoValueWrap}>
              <Text style={styles.infoValue}>{user.isProfileComplete ? 'Complete' : 'Incomplete'}</Text>
              <Ionicons
                name={user.isProfileComplete ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={user.isProfileComplete ? COLORS.success : COLORS.danger}
              />
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="shield-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoLabel}>KYC Verified</Text>
            <View style={styles.infoValueWrap}>
              <Text style={styles.infoValue}>{user.isKYCVerified ? 'Yes' : 'No'}</Text>
              <Ionicons
                name={user.isKYCVerified ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={user.isKYCVerified ? COLORS.success : COLORS.danger}
              />
            </View>
          </View>
        </Card>

        {status !== 'rejected' && status !== 'not_submitted' && status !== 'approved' && (
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.noteText}>
              Pull down to refresh and check for status updates.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 40 },

  statusCard: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
    borderWidth: 1,
  },
  iconWrap: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statusTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.text },
  statusMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },

  infoCard: { gap: SPACING.xs },
  infoTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, width: 70 },
  infoValueWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: SPACING.xs },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },

  noteBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    justifyContent: 'center', paddingVertical: SPACING.sm,
  },
  noteText: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
});