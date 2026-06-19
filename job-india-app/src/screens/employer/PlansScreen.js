import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { Screen, Loader, Card, Badge } from '../../components/ui';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../constants/theme';
import { adminApi } from '../../api/admin.api';
import { paymentsApi } from '../../api/payments.api';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toast';

// Full server-driven flow: backend creates the order, we open Razorpay,
// then the backend verifies the signature and activates the subscription.
export function PlansScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const { data: plans, loading } = useFetch(() => adminApi.plans(), []);
  const [busy, setBusy] = useState(null);

  const subscribe = async (plan) => {
    if (!plan.price || plan.price === 0) {
      toast.info('Free plan', 'You are already on the free plan');
      return;
    }
    setBusy(plan._id);
    try {
      // 1) create order on backend
      const order = await paymentsApi.createOrder({ planId: plan._id });

      // 2) open Razorpay checkout with the server order id
      const options = {
        description: `${plan.name} subscription`,
        currency: order.currency || 'INR',
        key: order.key,
        order_id: order.orderId,
        amount: order.amount,
        name: 'Job India',
        prefill: { contact: user?.phone?.replace('+91', ''), name: user?.name || '' },
        theme: { color: COLORS.primary },
      };
      const result = await RazorpayCheckout.open(options);

      // 3) verify on backend -> activates subscription
      await paymentsApi.verify({
        razorpay_order_id: result.razorpay_order_id || order.orderId,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      });
      toast.success('Subscribed!', `${plan.name} plan is now active`);
      navigation.goBack();
    } catch (e) {
      if (e?.code !== 0 && e?.code !== undefined) toast.error('Payment cancelled', e?.description || '');
      else if (e?.message) toast.error('Could not subscribe', e.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Screen><Header title="Upgrade Plan" onBack={() => navigation.goBack()} /><Loader /></Screen>;

  return (
    <Screen>
      <Header title="Upgrade Plan" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {(plans || []).map((plan) => (
          <Card key={plan._id} style={[styles.plan, plan.isPopular && styles.popular]}>
            {plan.isPopular ? <Badge label="POPULAR" color={COLORS.accent} /> : null}
            <Text style={styles.name}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price === 0 ? 'Free' : `₹${plan.price}`}</Text>
              {plan.price > 0 ? <Text style={styles.per}>/{plan.duration} days</Text> : null}
            </View>
            <View style={styles.features}>
              {(plan.features || []).map((f, i) => (
                <View key={i} style={styles.feat}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.featText}>{f.label}{typeof f.value === 'number' ? `: ${f.value}` : ''}</Text>
                </View>
              ))}
            </View>
            <Button
              title={plan.price === 0 ? 'Current Free Plan' : 'Subscribe'}
              variant={plan.isPopular ? 'primary' : 'outline'}
              onPress={() => subscribe(plan)}
              loading={busy === plan._id}
              disabled={plan.price === 0}
            />
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  plan: { gap: SPACING.md, ...SHADOWS.sm },
  popular: { borderWidth: 2, borderColor: COLORS.accent },
  name: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  price: { fontSize: FONTS.sizes.xxxl, fontWeight: '900', color: COLORS.primary },
  per: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 6 },
  features: { gap: SPACING.sm },
  feat: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  featText: { fontSize: FONTS.sizes.md, color: COLORS.gray600 },
});
