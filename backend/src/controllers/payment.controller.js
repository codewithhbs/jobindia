const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const { Payment, SubscriptionPlan, EmployerProfile, User } = require('../models');
const notificationService = require('../services/notification.service');

// Lazy Razorpay instance (only needed if keys are configured).
let razorpay = null;
const getRazorpay = () => {
  if (razorpay) return razorpay;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  // eslint-disable-next-line global-require
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return razorpay;
};

// POST /api/v1/payments/create-order  { planId | planSlug }
exports.createOrder = catchAsync(async (req, res, next) => {
  const { planId, planSlug } = req.body;
  const plan = await SubscriptionPlan.findOne(planId ? { _id: planId } : { slug: planSlug });
  if (!plan) return next(new AppError('Plan not found', 404));
  if (!plan.price || plan.price <= 0) return next(new AppError('This plan is free — no payment required', 400));

  const amountPaise = Math.round(plan.price * 100);
  const rp = getRazorpay();

  // Persist a local payment record first.
  const payment = await Payment.create({
    userId: req.user.userId,
    planId: plan._id,
    planSlug: plan.slug,
    amount: plan.price,
    currency: plan.currency || 'INR',
    status: 'created',
  });

  let order;
  if (rp) {
    order = await rp.orders.create({
      amount: amountPaise,
      currency: plan.currency || 'INR',
      receipt: String(payment._id),
      notes: { userId: String(req.user.userId), planSlug: plan.slug },
    });
    payment.razorpayOrderId = order.id;
    await payment.save();
  } else {
    // Dev fallback: no keys configured — return a mock order so the client flow works.
    logger.warn('RAZORPAY keys not set — returning mock order (dev only)');
    order = { id: `order_mock_${payment._id}`, amount: amountPaise, currency: plan.currency || 'INR' };
    payment.razorpayOrderId = order.id;
    await payment.save();
  }

  created(res, {
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    paymentRecordId: payment._id,
    plan: { name: plan.name, slug: plan.slug, price: plan.price },
  }, 'Order created');
});

// POST /api/v1/payments/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, userId: req.user.userId });
  if (!payment) return next(new AppError('Payment record not found', 404));

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const isMock = razorpay_order_id?.startsWith('order_mock_');

  if (!isMock) {
    if (!secret) return next(new AppError('Payment verification not configured', 500));
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expected !== razorpay_signature) {
      payment.status = 'failed';
      await payment.save();
      return next(new AppError('Payment signature verification failed', 400));
    }
  }

  payment.status = 'paid';
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  await payment.save();

  // Activate the employer subscription.
  const plan = await SubscriptionPlan.findById(payment.planId);
  if (plan) {
    const expiry = new Date(Date.now() + (plan.duration || 30) * 24 * 60 * 60 * 1000);
    await EmployerProfile.findOneAndUpdate(
      { userId: req.user.userId },
      {
        subscriptionPlan: plan.slug === 'enterprise' ? 'enterprise' : plan.slug === 'premium' ? 'premium' : 'free',
        subscriptionExpiry: expiry,
        jobPostLimit: plan.jobPostLimit || 999,
      },
      { upsert: true }
    );
  }

  await notificationService.sendToUser({
    userId: req.user.userId,
    title: 'Subscription Activated 🎉',
    body: `Your ${plan?.name || 'premium'} plan is now active.`,
    category: 'payment',
  }).catch(() => {});

  ok(res, { status: 'paid', plan: plan?.slug }, 'Payment verified and subscription activated');
});

// GET /api/v1/payments/me — payment history
exports.myPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(50);
  ok(res, payments);
});
