import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { EmptyState, Loader, Screen } from '../../components/ui/Screen';

import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { notificationsApi } from '../../api/notifications.api';
import { useFetch } from '../../hooks/useFetch';
import { timeAgo } from '../../utils/format';

export default function NotificationsScreen({ navigation }) {
  const { data, loading, refetch } = useFetch(() => notificationsApi.list({ limit: 50 }), []);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch().catch(() => {}); setRefreshing(false); }, [refetch]);
  const markAll = async () => { await notificationsApi.markAllRead().catch(() => {}); refetch(); };
  const open = async (n) => { if (!n.isRead) await notificationsApi.markRead(n._id).catch(() => {}); refetch(); };

  const items = data?.data || [];
  return (
    <Screen>
      <Header title="Notifications" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        right={<Pressable onPress={markAll}><Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm }}>Read all</Text></Pressable>} />
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item)} style={[styles.item, !item.isRead && styles.unread]}>
            <View style={styles.icon}><Ionicons name="notifications" size={18} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.dot} />}
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="notifications-outline" title="No notifications" subtitle="You're all caught up" />}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  list: { padding: SPACING.lg, flexGrow: 1 },
  item: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg },
  unread: { backgroundColor: COLORS.primaryLight },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  body: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  time: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6 },
});
