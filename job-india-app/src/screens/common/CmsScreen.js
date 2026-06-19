import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { Screen, Loader } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { adminApi } from '../../api/admin.api';
import { useFetch } from '../../hooks/useFetch';

// Strips simple HTML tags for a readable plain-text view.
const strip = (html = '') => html.replace(/<[^>]+>/g, '\n').replace(/\n{2,}/g, '\n\n').trim();

export default function CmsScreen({ route, navigation }) {
  const { slug, title } = route.params;
  const { data, loading } = useFetch(() => adminApi.cms(slug), [slug]);
  return (
    <Screen>
      <Header title={title || 'Info'} onBack={() => navigation.goBack()} />
      {loading ? <Loader /> : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>{data?.title}</Text>
          <Text style={styles.body}>{strip(data?.content)}</Text>
        </ScrollView>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md },
  heading: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text },
  body: { fontSize: FONTS.sizes.md, color: COLORS.gray600, lineHeight: 24 },
});
