import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Loader, Card, Badge, EmptyState } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { kycApi } from '../../api/kyc.api';
import { useFetch } from '../../hooks/useFetch';

const STATUS_COLOR = { approved: COLORS.success, pending: COLORS.accent, under_review: COLORS.accent, rejected: COLORS.danger, not_submitted: COLORS.gray500 };

export default function KycScreen({ navigation }) {
  const { data, loading } = useFetch(() => kycApi.status(), []);
  if (loading) return <Screen><Header title="KYC / Documents" onBack={() => navigation.goBack()} /><Loader /></Screen>;

  const status = data?.overallStatus || 'not_submitted';
  const docs = data?.documents || [];

  return (
    <Screen>
      <Header title="KYC / Documents" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.statusCard}>
          <Ionicons name="shield-checkmark" size={32} color={STATUS_COLOR[status]} />
          <Text style={styles.statusText}>Overall Status</Text>
          <Badge label={status.replace('_', ' ')} color={STATUS_COLOR[status]} />
        </Card>
        {docs.length === 0 ? (
          <EmptyState icon="document-outline" title="No documents submitted" subtitle="Upload documents from your profile screen" />
        ) : docs.map((d) => (
          <Card key={d._id} style={styles.docRow}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            <Text style={styles.docName}>{d.fieldName || d.documentType}</Text>
            <Badge label={d.status} color={STATUS_COLOR[d.status] || COLORS.gray500} />
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md },
  statusCard: { alignItems: 'center', gap: SPACING.sm },
  statusText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  docName: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
});
