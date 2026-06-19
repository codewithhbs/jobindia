import { View, Text, StyleSheet, Pressable } from 'react-native'
import React from 'react'
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';



export default function AppFooter() {
    const socials = [
        { id: 'ig', icon: 'logo-instagram', url: 'https://instagram.com' },
        { id: 'tw', icon: 'logo-twitter', url: 'https://twitter.com' },
        { id: 'li', icon: 'logo-linkedin', url: 'https://linkedin.com' },
        { id: 'yt', icon: 'logo-youtube', url: 'https://youtube.com' },
    ];
    const links = ['About Us', 'Privacy Policy', 'Terms of Use', 'Contact Us'];

    return (
        <View style={styles.footer}>
            <View style={styles.footerTop}>
                <View style={styles.footerBrandRow}>
                    <View style={styles.footerLogo}>
                        <Ionicons name="briefcase" size={18} color={COLORS.white} />
                    </View>
                    <View>
                        <Text style={styles.footerBrand}>Job India</Text>
                        <Text style={styles.footerTagline}>Banaya Bharat ke liye</Text>
                    </View>
                </View>

                <View style={styles.footerSocialRow}>
                    {socials.map((s) => (
                        <Pressable key={s.id} style={styles.footerSocialBtn} onPress={() => Linking.openURL(s.url)} hitSlop={8}>
                            <Ionicons name={s.icon} size={16} color={COLORS.textSecondary} />
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.footerDivider} />

            <View style={styles.footerLinksGrid}>
                {links.map((label) => (
                    <Pressable key={label} onPress={() => onNavigate?.(label)} hitSlop={8} style={styles.footerLinkBtn}>
                        <Text style={styles.footerLink}>{label}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.footerDivider} />

            <View style={styles.footerBottomRow}>
                <Text style={styles.footerCopy}>© {new Date().getFullYear()} JobConnect</Text>
                <Text style={styles.footerMadeIn}>Made with ❤️ in India</Text>
            </View>
        </View>
    )
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
    footerLogo: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
    footerBrand: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.text },
    footerTagline: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
    footerSocialRow: { flexDirection: 'row', gap: SPACING.sm },
    footerSocialBtn: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    footerDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },
    footerLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    footerLinkBtn: { paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt },
    footerLink: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },
    footerBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerCopy: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
    footerMadeIn: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
});