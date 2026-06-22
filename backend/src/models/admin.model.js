const mongoose = require('mongoose');

// App Settings (admin-controlled)
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  type: { type: String, enum: ['string', 'number', 'boolean', 'json', 'array'], default: 'string' },
  category: { type: String, default: 'general' },
  description: String,
  isPublic: { type: Boolean, default: false }, // visible to mobile app without auth
  updatedBy: mongoose.Schema.Types.ObjectId,
  updatedAt: { type: Date, default: Date.now }
});

// Dynamic Form Field
const formFieldSchema = new mongoose.Schema({
  fieldId: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'number', 'email', 'phone', 'date', 'file', 'image', 'select', 'multiselect', 'radio', 'checkbox', 'textarea'],
    required: true
  },
  placeholder: String,
  helpText: String,
  defaultValue: mongoose.Schema.Types.Mixed,
  options: [{ label: String, value: String }], // for select/radio/checkbox
  validation: {
    required: { type: Boolean, default: false },
    minLength: Number,
    maxLength: Number,
    pattern: String,
    minValue: Number,
    maxValue: Number,
    fileTypes: [String], // ['pdf', 'jpg', 'png']
    maxFileSize: Number  // in bytes
  },
  assignedTo: [{
    type: String,
    enum: ['jobseeker', 'driver', 'employer', 'all']
  }],
  section: { type: String, default: 'basic' }, // profile section
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  formType: {
    type: String,
    enum: ['registration', 'profile', 'kyc', 'job_posting'],
    required: true
  },
  createdBy: mongoose.Schema.Types.ObjectId,
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Job Category
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  icon: String,
  image: String,
  description: String,
  is_Drivercat: { type: Boolean, default: false },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  jobCount: { type: Number, default: 0 }
}, { timestamps: true });

// CMS Pages
const cmsPageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  updatedBy: mongoose.Schema.Types.ObjectId,
  version: { type: Number, default: 1 }
}, { timestamps: true });

// Onboarding Screens
const onboardingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: String,
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Notification Templates
const notifTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['push', 'sms', 'email'], required: true },
  subject: String,
  title: String,
  body: { type: String, required: true },
  variables: [String], // e.g., ['{{name}}', '{{jobTitle}}']
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// FAQ
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: String,
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Subscription Plans
const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  duration: { type: Number, required: true }, // in days
  features: [{
    key: String,
    label: String,
    value: mongoose.Schema.Types.Mixed,
    limit: Number
  }],
  jobPostLimit: { type: Number, default: 3 },
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const homeSliderSchema = new mongoose.Schema(
  {
    title: { type: String },
    subtitle: { type: String },
    image: { type: String, required: true }, // banner image URL
    redirectType: {
      type: String,
      enum: ['job', 'category', 'external', 'none'],
      default: 'none',
    },
    redirectValue: {
      type: String, // jobId / categoryId / URL
    },
    type: {
      type: String,
      default: "jobseeker",
      enum: ["jobseeker", "driver", "employer"]
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    createdBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);
const FormField = mongoose.model('FormField', formFieldSchema);
const Category = mongoose.model('Category', categorySchema);
const CMSPage = mongoose.model('CMSPage', cmsPageSchema);
const OnboardingScreen = mongoose.model('OnboardingScreen', onboardingSchema);
const NotifTemplate = mongoose.model('NotifTemplate', notifTemplateSchema);
const FAQ = mongoose.model('FAQ', faqSchema);
const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const HomeSlider = mongoose.model('HomeSlider', homeSliderSchema);
module.exports = { Settings, FormField, Category, CMSPage, OnboardingScreen, NotifTemplate, FAQ, SubscriptionPlan, HomeSlider };
