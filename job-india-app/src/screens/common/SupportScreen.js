import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { supportApi } from '../../api/support.api';
import { useFetch } from '../../hooks/useFetch';
import { timeAgo } from '../../utils/format';
import { toast } from '../../utils/toast';
import { EmptyState, Loader, Screen } from '../../components/ui/Screen';
import { Badge, Card, Input } from '../../components/ui';

export default function SupportScreen({ navigation }) {
  const { data, loading, refetch } = useFetch(() => supportApi.myTickets(), []);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!subject || !message) return toast.error('Subject and message required');
    setSaving(true);
    try {
      await supportApi.create({ subject, message });
      setSubject(''); setMessage('');
      toast.success('Ticket created', 'We will get back to you soon');
      refetch();
    } catch (e) { toast.error('Error', e.message); } finally { setSaving(false); }
  };

  const tickets = data?.data || [];
  return (
    <Screen>
      <Header title="Help & Support" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: SPACING.md }}>
          <Text style={styles.title}>Raise a ticket</Text>
          <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="Brief summary" />
          <Input label="Message" value={message} onChangeText={setMessage} placeholder="Describe your issue" multiline style={{ minHeight: 90, textAlignVertical: 'top' }} />
          <Button title="Submit Ticket" onPress={submit} loading={saving} />
        </Card>

        <Text style={styles.title}>My Tickets</Text>
        {loading ? <Loader /> : tickets.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title="No tickets yet" />
        ) : tickets.map((t) => (
          <Card key={t._id} style={styles.ticket}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tSubject}>{t.subject}</Text>
              <Text style={styles.tMeta}>{t.ticketId} · {timeAgo(t.createdAt)}</Text>
            </View>
            <Badge label={t.status} color={t.status === 'closed' ? COLORS.gray500 : COLORS.primary} />
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  ticket: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  tSubject: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  tMeta: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
});
