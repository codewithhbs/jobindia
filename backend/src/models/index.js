// Single import surface for every model in the app.
// Lets controllers do: const { User, Job, JobSeekerProfile } = require('../models');
const User = require('./user.model');
const JobSeekerProfile = require('./jobseeker.model');
const EmployerProfile = require('./employer.model');
const DriverProfile = require('./driver.model');
const { OTP, RefreshToken } = require('./auth.model');
const { Job, Application, SavedJob } = require('./job.model');
const { KYCDocument, KYCSubmission } = require('./kyc.model');
const Notification = require('./notification.model');
const Support = require('./support.model');
const Payment = require('./payment.model');
const {
  Settings,
  FormField,
  Category,
  CMSPage,
  OnboardingScreen,
  NotifTemplate,
  FAQ,
  SubscriptionPlan,
} = require('./admin.model');

module.exports = {
  User,
  JobSeekerProfile,
  EmployerProfile,
  DriverProfile,
  OTP,
  RefreshToken,
  Job,
  Application,
  SavedJob,
  KYCDocument,
  KYCSubmission,
  Notification,
  Support,
  Payment,
  Settings,
  FormField,
  Category,
  CMSPage,
  OnboardingScreen,
  NotifTemplate,
  FAQ,
  SubscriptionPlan,
};
