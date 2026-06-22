import React, { useCallback, useState } from 'react';
import { StyleSheet, RefreshControl, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Screen, Loader } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { adminApi } from '../../api/admin.api';
import { useFetch } from '../../hooks/useFetch';

function buildHtml(title, content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, Roboto, sans-serif;
      color: ${COLORS.text};
      background-color: ${COLORS.background || '#fff'};
      font-size: 16px;
      line-height: 1.6;
    }
    h1, h2, h3, h4 {
      color: ${COLORS.text};
      font-weight: 800;
      margin-top: 1.2em;
      margin-bottom: 0.5em;
    }
    h1.page-title {
      margin-top: 0;
      font-size: 16px;
    }
    p { margin: 0 0 1em 0; }
    a { color: ${COLORS.primary}; text-decoration: underline; }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 8px 0;
    }
    ul, ol { padding-left: 22px; margin: 0 0 1em 0; }
    li { margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #ddd; padding: 6px; }
    blockquote {
      border-left: 3px solid ${COLORS.primary};
      margin: 1em 0;
      padding-left: 12px;
      color: ${COLORS.textSecondary};
    }
  </style>
</head>
<body>
  
  ${content || ''}
</body>
</html>`;
}

export default function CmsScreen({ route, navigation }) {
  const { slug, title } = route.params;
  const { data, loading, refetch } = useFetch(() => adminApi.cms(slug), [slug]);
  const [refreshing, setRefreshing] = useState(false);
  const [webviewKey, setWebviewKey] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      setWebviewKey((k) => k + 1); // ✅ force WebView reload with fresh content
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <Screen edges={['top']} noPadding>
      <Header title={data?.title || 'Info'} onBack={() => navigation.goBack()} />
      {loading && !data ? (
        <Loader />
      ) : (
        <View style={styles.container}>
          <WebView
            key={webviewKey}
            originWhitelist={['*']}
            source={{ html: buildHtml(data?.title, data?.content) }}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => <Loader />}
            scalesPageToFit={false}
            showsVerticalScrollIndicator={false}
            pullToRefreshEnabled // ✅ native pull-to-refresh (Android/iOS support)
          />
          {refreshing && (
            <View style={styles.refreshOverlay}>
              <Loader />
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
  refreshOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});