require('dotenv').config();
const mongoose = require('mongoose');
const {
  User,
  Settings,
  FormField,
  Category,
  CMSPage,
  OnboardingScreen,
  FAQ,
  SubscriptionPlan,
} = require('../models');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobmarketplace';

// A superadmin so you can log in immediately (OTP via /send-otp-admin).
const adminUser = {
  phone: process.env.SEED_ADMIN_PHONE || '+919999999999',
  name: 'Super Admin',
  role: 'superadmin',
  isPhoneVerified: true,
  isProfileComplete: true,
  isKYCVerified: true,
};

const categories = [
  { name: 'Driver', slug: 'driver', icon: '🚗', order: 1, description: 'All types of driving jobs' },
  { name: 'Delivery', slug: 'delivery', icon: '📦', order: 2, description: 'Delivery and courier jobs' },
  { name: 'Truck Driver', slug: 'truck-driver', icon: '🚚', order: 3, description: 'Heavy vehicle driving' },
  { name: 'Taxi Driver', slug: 'taxi-driver', icon: '🚕', order: 4, description: 'Taxi and cab services' },
  { name: 'Software Developer', slug: 'software-developer', icon: '💻', order: 5 },
  { name: 'Designer', slug: 'designer', icon: '🎨', order: 6 },
  { name: 'Accountant', slug: 'accountant', icon: '📊', order: 7 },
  { name: 'Sales', slug: 'sales', icon: '💼', order: 8 },
  { name: 'Marketing', slug: 'marketing', icon: '📢', order: 9 },
  { name: 'Healthcare', slug: 'healthcare', icon: '🏥', order: 10 },
  { name: 'Security', slug: 'security', icon: '🔒', order: 11 },
  { name: 'Education', slug: 'education', icon: '📚', order: 12 },
];

const settings = [
  { key: 'app_name', value: 'JobMarket', type: 'string', category: 'app', isPublic: true },
  { key: 'app_logo', value: '', type: 'string', category: 'app', isPublic: true },
  { key: 'support_email', value: 'support@jobmarket.com', type: 'string', category: 'contact', isPublic: true },
  { key: 'support_phone', value: '+91-9999999999', type: 'string', category: 'contact', isPublic: true },
  { key: 'whatsapp_number', value: '+91-9999999999', type: 'string', category: 'contact', isPublic: true },
  { key: 'social_facebook', value: '', type: 'string', category: 'social', isPublic: true },
  { key: 'social_instagram', value: '', type: 'string', category: 'social', isPublic: true },
  { key: 'social_linkedin', value: '', type: 'string', category: 'social', isPublic: true },
  { key: 'force_update', value: false, type: 'boolean', category: 'app_control', isPublic: true },
  { key: 'maintenance_mode', value: false, type: 'boolean', category: 'app_control', isPublic: true },
  { key: 'min_app_version_android', value: '1.0.0', type: 'string', category: 'app_control', isPublic: true },
  { key: 'min_app_version_ios', value: '1.0.0', type: 'string', category: 'app_control', isPublic: true },
  { key: 'play_store_url', value: '', type: 'string', category: 'app_control', isPublic: true },
  { key: 'app_store_url', value: '', type: 'string', category: 'app_control', isPublic: true },
  { key: 'registration_enabled', value: true, type: 'boolean', category: 'features', isPublic: true },
  { key: 'job_posting_enabled', value: true, type: 'boolean', category: 'features', isPublic: true },
  { key: 'kyc_required_driver', value: true, type: 'boolean', category: 'features', isPublic: false },
  { key: 'search_radius_options', value: [5, 10, 25, 50, 100], type: 'array', category: 'search', isPublic: true },
  { key: 'default_search_radius', value: 25, type: 'number', category: 'search', isPublic: true },
  { key: 'primary_color', value: '#2563EB', type: 'string', category: 'theme', isPublic: true },
  { key: 'secondary_color', value: '#10B981', type: 'string', category: 'theme', isPublic: true },
];

// FormField kept for admin-driven KYC document checklists (not per-user free-form data).
const formFields = [
  {
    fieldId: 'driver_license', label: 'Driving License', type: 'file',
    validation: { required: true, fileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5242880 },
    assignedTo: ['driver'], section: 'documents', order: 1, formType: 'kyc', isActive: true,
  },
  {
    fieldId: 'driver_aadhaar', label: 'Aadhaar Card', type: 'file',
    validation: { required: true, fileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5242880 },
    assignedTo: ['driver'], section: 'documents', order: 2, formType: 'kyc', isActive: true,
  },
  {
    fieldId: 'candidate_resume', label: 'Resume / CV', type: 'file',
    validation: { required: true, fileTypes: ['pdf', 'doc', 'docx'], maxFileSize: 5242880 },
    assignedTo: ['jobseeker'], section: 'documents', order: 1, formType: 'profile', isActive: true,
  },
  {
    fieldId: 'employer_pan', label: 'PAN Card', type: 'file',
    validation: { required: true, fileTypes: ['pdf', 'jpg', 'png'], maxFileSize: 5242880 },
    assignedTo: ['employer'], section: 'documents', order: 1, formType: 'kyc', isActive: true,
  },
];

const subscriptionPlans = [
  {
    name: 'Free', slug: 'free', price: 0, currency: 'INR', duration: 365, jobPostLimit: 3, order: 1, isActive: true,
    features: [
      { key: 'job_posts', label: 'Job Posts', value: 3, limit: 3 },
      { key: 'applications_view', label: 'View Applications', value: true },
      { key: 'candidate_search', label: 'Candidate Search', value: false },
    ],
  },
  {
    name: 'Premium', slug: 'premium', price: 999, currency: 'INR', duration: 30, jobPostLimit: 999, order: 2, isActive: true, isPopular: true,
    features: [
      { key: 'job_posts', label: 'Unlimited Job Posts', value: 'unlimited' },
      { key: 'candidate_search', label: 'Candidate Search', value: true },
      { key: 'featured_jobs', label: 'Featured Job Listings', value: 5, limit: 5 },
      { key: 'priority_support', label: 'Priority Support', value: true },
    ],
  },
  {
    name: 'Enterprise', slug: 'enterprise', price: 4999, currency: 'INR', duration: 30, jobPostLimit: 999, order: 3, isActive: true,
    features: [
      { key: 'job_posts', label: 'Unlimited Job Posts', value: 'unlimited' },
      { key: 'candidate_search', label: 'Advanced Candidate Search', value: true },
      { key: 'dedicated_manager', label: 'Dedicated Account Manager', value: true },
      { key: 'analytics', label: 'Advanced Analytics', value: true },
    ],
  },
];

const cmsPages = [
  { slug: 'about-us', title: 'About Us', content: '<h1>About JobMarket</h1><p>We connect job seekers with employers across India.</p>', isActive: true },
  { slug: 'privacy-policy', title: 'Privacy Policy', content: '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>', isActive: true },
  { slug: 'terms-conditions', title: 'Terms & Conditions', content: '<h1>Terms & Conditions</h1><p>By using our platform, you agree to...</p>', isActive: true },
];

const onboardingScreens = [
  { title: 'Find Jobs Near You', description: 'Discover thousands of job opportunities in your city', image: 'https://via.placeholder.com/400x300?text=Find+Jobs', order: 1 },
  { title: 'Connect with Employers', description: 'Apply directly to verified employers and get hired faster', image: 'https://via.placeholder.com/400x300?text=Connect', order: 2 },
  { title: 'Grow Your Career', description: 'Track applications, schedule interviews, land your dream job', image: 'https://via.placeholder.com/400x300?text=Grow', order: 3 },
];

const faqs = [
  { question: 'How do I create an account?', answer: 'Enter your phone number, verify OTP, and complete your profile.', category: 'account', order: 1 },
  { question: 'Is the app free to use?', answer: 'Yes, completely free for job seekers. Employers have free and premium plans.', category: 'general', order: 2 },
  { question: 'How long does KYC verification take?', answer: 'Typically 24-48 hours. You will be notified once approved.', category: 'kyc', order: 4 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    Settings.deleteMany({}),
    FormField.deleteMany({}),
    Category.deleteMany({}),
    CMSPage.deleteMany({}),
    OnboardingScreen.deleteMany({}),
    FAQ.deleteMany({}),
    SubscriptionPlan.deleteMany({}),
  ]);
  console.log('Cleared existing seed data');

  await Promise.all([
    Settings.insertMany(settings),
    FormField.insertMany(formFields),
    Category.insertMany(categories),
    CMSPage.insertMany(cmsPages),
    OnboardingScreen.insertMany(onboardingScreens),
    FAQ.insertMany(faqs),
    SubscriptionPlan.insertMany(subscriptionPlans),
  ]);

  await User.findOneAndUpdate({ phone: adminUser.phone }, adminUser, { upsert: true, new: true });

  console.log('✅ Seed complete:');
  console.log(`   - ${settings.length} settings, ${formFields.length} form fields, ${categories.length} categories`);
  console.log(`   - ${cmsPages.length} CMS pages, ${onboardingScreens.length} onboarding, ${faqs.length} FAQs, ${subscriptionPlans.length} plans`);
  console.log(`   - superadmin: ${adminUser.phone}`);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
