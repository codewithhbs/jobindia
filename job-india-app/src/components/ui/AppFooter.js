import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFetch } from '../../hooks/useFetch';
import { useNavigation } from '@react-navigation/native';
import { adminApi } from '../../api/admin.api';

function IndiaFlagBadge({ width = 22, height = 15 }) {
  return (
    <View style={[styles.flagWrap, { width, height }]}>
      <LinearGradient
        colors={['#FF9933', '#FFFFFF', '#138808']}
        locations={[0.33, 0.5, 0.67]}
        style={styles.flagGradient}
      >
        <View style={styles.flagChakra} />
      </LinearGradient>
    </View>
  );
}

// Maps each social key from settings -> icon + label. Only rendered if the
// corresponding URL exists in settings and isn't empty.
function buildSocialLinks(setting) {
  if (!setting) return [];
  const map = [
    { key: 'social_instagram', icon: 'logo-instagram' },
    { key: 'social_facebook', icon: 'logo-facebook' },
    { key: 'social_linkedin', icon: 'logo-linkedin' },
  ];
  return map
    .filter((m) => setting[m.key] && setting[m.key].trim().length > 0)
    .map((m) => ({ id: m.key, icon: m.icon, url: setting[m.key] }));
}

export default function AppFooter({refreshing}) {
  const navigation = useNavigation();

  const { data: cmsData } = useFetch(() => adminApi.allcms(), [refreshing]);
  const { data: setting } = useFetch(() => adminApi.publicSettings(), [refreshing]);

  const cmsPages = (cmsData || []).filter((p) => p.isActive);
  const socials = buildSocialLinks(setting);

  const appName = setting?.app_name || 'Job India';
  const brandColor = setting?.primary_color || COLORS.primary;
  const supportEmail = setting?.support_email;
  const supportPhone = setting?.support_phone;
  const whatsappNumber = setting?.whatsapp_number;

  const goToCms = (slug) => {
    navigation.navigate('Cms', { slug });
  };

  const openWhatsapp = () => {
    if (!whatsappNumber) return;
    const cleaned = whatsappNumber.replace(/[^\d+]/g, '');
    Linking.openURL(`https://wa.me/${cleaned.replace('+', '')}`);
  };

  const callSupport = () => {
    if (!supportPhone) return;
    Linking.openURL(`tel:${supportPhone}`);
  };

  const emailSupport = () => {
    if (!supportEmail) return;
    Linking.openURL(`mailto:${supportEmail}`);
  };

  return (
    <View style={styles.footer}>
      {/* ── Brand row ── */}
      <View style={styles.footerTop}>
        <View style={styles.footerBrandRow}>
          <View style={[styles.footerLogo, { backgroundColor: brandColor }]}>
            <Ionicons name="briefcase" size={18} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.footerBrand}>{appName}</Text>
            <View style={styles.taglineRow}>
              <IndiaFlagBadge width={16} height={11} />
              <Text style={styles.footerTagline}>Banaya Bharat ke liye</Text>
            </View>
          </View>
        </View>

        {socials.length > 0 && (
          <View style={styles.footerSocialRow}>
            {socials.map((s) => (
              <Pressable
                key={s.id}
                style={styles.footerSocialBtn}
                onPress={() => Linking.openURL(s.url)}
                hitSlop={8}
              >
                <Ionicons name={s.icon} size={16} color={COLORS.textSecondary} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footerDivider} />

      {/* ── Support / contact row ── */}
      {(supportPhone || supportEmail || whatsappNumber) && (
        <>
          <View style={styles.supportRow}>
            {whatsappNumber && (
              <Pressable style={styles.supportBtn} onPress={openWhatsapp} hitSlop={8}>
                <Ionicons name="logo-whatsapp" size={15} color="#10B981" />
                <Text style={styles.supportText}>WhatsApp</Text>
              </Pressable>
            )}
            {supportPhone && (
              <Pressable style={styles.supportBtn} onPress={callSupport} hitSlop={8}>
                <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.supportText}>{supportPhone}</Text>
              </Pressable>
            )}
            {supportEmail && (
              <Pressable style={styles.supportBtn} onPress={emailSupport} hitSlop={8}>
                <Ionicons name="mail-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.supportText}>{supportEmail}</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.footerDivider} />
        </>
      )}

      {/* ── CMS links ── */}
      {cmsPages.length > 0 && (
        <>
          <View style={styles.footerLinksGrid}>
            {cmsPages.map((page) => (
              <Pressable
                key={page._id}
                onPress={() => goToCms(page.slug)}
                hitSlop={8}
                style={styles.footerLinkBtn}
              >
                <Text style={styles.footerLink}>{page.title}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.footerDivider} />
        </>
      )}

      {/* ── Bottom row ── */}
      <View style={styles.footerBottomRow}>
        <View style={styles.footerCopyRow}>
          <IndiaFlagBadge width={18} height={12} />
          <Text style={styles.footerCopy}>© {new Date().getFullYear()} {appName}</Text>
        </View>
        <Text style={styles.footerMadeIn}>Made with ❤️ in India</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: COLORS.surface,
    marginTop: SPACING.xxxl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerBrandRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  footerLogo: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  footerBrand: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.text },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  footerTagline: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  footerSocialRow: { flexDirection: 'row', gap: SPACING.sm },
  footerSocialBtn: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  footerDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },

  supportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  supportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt,
  },
  supportText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },

  footerLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  footerLinkBtn: { paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt },
  footerLink: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },
  footerBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerCopyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerCopy: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  footerMadeIn: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },

  flagWrap: { borderRadius: 2, overflow: 'hidden' },
  flagGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flagChakra: {
    width: 4, height: 4, borderRadius: 2,
    borderWidth: 0.5, borderColor: '#000088',
  },
});