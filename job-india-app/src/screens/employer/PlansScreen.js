import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { LinearGradient } from 'expo-linear-gradient';

import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';
import { adminApi } from '../../api/admin.api';
import { paymentsApi } from '../../api/payments.api';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toast';
import { Loader, Screen } from '../../components/ui/Screen';
import { employerApi } from '../../api/employer.api';

const PLAN_COLORS = {
  free: '#94A3B8',
  premium: '#6366F1',
  enterprise: '#A855F7',
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function PlansScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const { data: plans, loading } = useFetch(() => adminApi.plans(), []);
  const { data: profile, refetch: refetchProfile } = useFetch(() => employerApi.me(), []);
  const [busy, setBusy] = useState(null);

  const currentPlanSlug = profile?.subscriptionPlan || 'free';
  const activeJobs = profile?.activeJobs ?? 0;
  const jobPostLimit = profile?.jobPostLimit ?? 3;
  const usagePct = jobPostLimit > 0 ? Math.min(100, Math.round((activeJobs / jobPostLimit) * 100)) : 0;
  const expiryDate = formatDate(profile?.subscriptionExpiry);
  const remainingDays = daysLeft(profile?.subscriptionExpiry);
  const planColor = PLAN_COLORS[currentPlanSlug] || COLORS.primary;

  const subscribe = async (plan) => {
    if (!plan.price || plan.price === 0) {
      toast.info('Free plan', 'You are already on the free plan');
      return;
    }
    setBusy(plan._id);
    try {
      const order = await paymentsApi.createOrder({ planId: plan._id });

      const options = {
        description: `${plan.name} subscription`,
        currency: order.currency || 'INR',
        key: order.key,
        order_id: order.orderId,
        amount: order.amount,
        name: 'Krishna Job',
        prefill: { contact: user?.phone?.replace('+91', ''), name: user?.name || '' },
        theme: { color: COLORS.primary },
      };
      const result = await RazorpayCheckout.open(options);

      await paymentsApi.verify({
        razorpay_order_id: result.razorpay_order_id || order.orderId,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      });
      toast.success('Subscribed!', `${plan.name} plan is now active`);
      refetchProfile();
      navigation.goBack();
    } catch (e) {
      if (e?.code !== 0 && e?.code !== undefined) toast.error('Payment cancelled', e?.description || '');
      else if (e?.message) toast.error('Could not subscribe', e.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Header title="Plans & Billing" onBack={() => navigation.goBack()} />
        <Loader />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <Header title="Plans & Billing" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Current plan hero */}
        <LinearGradient
          colors={[planColor, `${planColor}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>CURRENT PLAN</Text>
              <Text style={styles.heroPlanName}>{currentPlanSlug.toUpperCase()}</Text>
            </View>
            <View style={styles.heroIconWrap}>
              <Ionicons name="diamond" size={22} color="#fff" />
            </View>
          </View>

          <View style={styles.usageBlock}>
            <View style={styles.usageLabelRow}>
              <Text style={styles.usageLabel}>Active job slots</Text>
              <Text style={styles.usageValue}>{activeJobs} / {jobPostLimit}</Text>
            </View>
            <View style={styles.usageTrack}>
              <View style={[styles.usageFill, { width: `${usagePct}%` }]} />
            </View>
          </View>

          {expiryDate && currentPlanSlug !== 'free' && (
            <View style={styles.expiryRow}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.expiryText}>
                {remainingDays > 0 ? `Renews/expires in ${remainingDays} days` : 'Expired'} · {expiryDate}
              </Text>
            </View>
          )}
        </LinearGradient>

        <Text style={styles.sectionTitle}>Available Plans</Text>

        {/* Plans list */}
        {(plans || []).map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug || (plan.price === 0 && currentPlanSlug === 'free');
          const accentColor = PLAN_COLORS[plan.slug] || COLORS.primary;

          return (
            <View
              key={plan._id}
              style={[
                styles.planCard,
                plan.isPopular && styles.planCardPopular,
                isCurrent && styles.planCardCurrent,
              ]}
            >
              {(plan.isPopular || isCurrent) && (
                <View
                  style={[
                    styles.cornerBadge,
                    { backgroundColor: isCurrent ? '#22C55E' : COLORS.accent },
                  ]}
                >
                  <Text style={styles.cornerBadgeText}>
                    {isCurrent ? 'CURRENT' : 'POPULAR'}
                  </Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={[styles.planIconWrap, { backgroundColor: `${accentColor}14` }]}>
                  <Ionicons name="briefcase" size={18} color={accentColor} />
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>{plan.price === 0 ? 'Free' : `₹${plan.price}`}</Text>
                {plan.price > 0 ? <Text style={styles.per}>/{plan.duration} days</Text> : null}
              </View>

              <View style={styles.features}>
                {(plan.features || []).map((f, i) => (
                  <View key={i} style={styles.feat}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                    <Text style={styles.featText}>
                      {f.label}{typeof f.value === 'number' ? `: ${f.value}` : ''}
                    </Text>
                  </View>
                ))}
              </View>

              <Button
                title={isCurrent ? 'Current Plan' : 'Subscribe'}
                variant={isCurrent ? 'outline' : plan.isPopular ? 'primary' : 'outline'}
                onPress={() => subscribe(plan)}
                loading={busy === plan._id}
                disabled={isCurrent}
              />
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl +30 },

  // Hero
  heroCard: {
    borderRadius: RADIUS.xl || 20,
    padding: SPACING.lg,
    gap: SPACING.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroEyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroPlanName: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 2 },
  heroIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  usageBlock: { gap: 6 },
  usageLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  usageLabel: { color: 'rgba(255,255,255,0.85)', fontSize: FONTS.sizes.sm, fontWeight: '600' },
  usageValue: { color: '#fff', fontSize: FONTS.sizes.sm, fontWeight: '800' },
  usageTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  usageFill: { height: '100%', borderRadius: 4, backgroundColor: '#fff' },

  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expiryText: { color: 'rgba(255,255,255,0.85)', fontSize: FONTS.sizes.xs, fontWeight: '500' },

  sectionTitle: {
    fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.text,
    marginTop: SPACING.sm,
  },

  // Plan cards
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl || 18,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardPopular: { borderColor: COLORS.accent },
  planCardCurrent: { borderColor: '#22C55E' },

  cornerBadge: {
    position: 'absolute', top: 0, right: 0,
    paddingHorizontal: 10, paddingVertical: 5,
    borderBottomLeftRadius: 10,
  },
  cornerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.text },

  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  price: { fontSize: FONTS.sizes.xxxl, fontWeight: '900', color: COLORS.primary },
  per: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 6 },

  features: { gap: SPACING.sm },
  feat: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  featText: { fontSize: FONTS.sizes.md, color: COLORS.gray600 },
});