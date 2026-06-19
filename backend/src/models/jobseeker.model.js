const mongoose = require('mongoose');

/**
 * JobSeekerProfile — the full candidate profile (Apna / WorkIndia style).
 * Replaces the old `jobSeekerProfileSchema` stub + per-user dynamicFields Map
 * with a complete, typed structure: CV, education, experience, skills,
 * preferences, etc. Applications themselves live in the Application model
 * (job.model.js) — here we expose convenience counters + a virtual.
 */

const educationSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['10th', '12th', 'diploma', 'iti', 'graduate', 'post_graduate', 'doctorate', 'other'],
    },
    degree: String, // e.g. "B.Tech Computer Science"
    institution: String,
    fieldOfStudy: String,
    startYear: Number,
    endYear: Number,
    grade: String, // "8.5 CGPA" / "78%"
    isPursuing: { type: Boolean, default: false },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship'],
      default: 'full_time',
    },
    location: String,
    startDate: String,
    endDate: String,
    isCurrent: { type: Boolean, default: false },
    description: String,
  },
  { _id: true }
);

const languageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'fluent', 'native'],
      default: 'conversational',
    },
    canRead: { type: Boolean, default: true },
    canWrite: { type: Boolean, default: true },
    canSpeak: { type: Boolean, default: true },
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    name: String,
    issuedBy: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String,
  },
  { _id: true }
);

const jobSeekerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    headline: { type: String, maxlength: 120 }, // "Delivery Executive | 3 yrs"
    about: { type: String, maxlength: 2000 },

    // ── CV / Resume ──
    resume: {
      fileUrl: String,
      fileName: String,
      fileType: String,
      uploadedAt: Date,
    },

    // ── Education / Experience / Skills ──
    education: [educationSchema],
    experience: [experienceSchema],
    skills: [String],
    languages: [languageSchema],
    certifications: [certificationSchema],

    totalExperienceMonths: { type: Number, default: 0 },
    currentSalary: Number, // monthly INR

    // ── Job preferences ──
    preferredCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    preferredJobTypes: [
      { type: String, enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship'] },
    ],
    preferredLocations: [
      {
        city: String,
        state: String,
      },
    ],
    expectedSalary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'INR' },
      period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    },
    noticePeriodDays: { type: Number, default: 0 },
    availability: {
      type: String,
      enum: ['immediate', 'within_15_days', 'within_1_month', 'more_than_1_month'],
      default: 'immediate',
    },
    isOpenToWork: { type: Boolean, default: true },
    willingToRelocate: { type: Boolean, default: false },

    // ── Links ──
    links: {
      linkedin: String,
      github: String,
      portfolio: String,
      other: String,
    },

    // ── Counters (kept in sync by job controller) ──
    stats: {
      profileViews: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      savedJobs: { type: Number, default: 0 },
    },

    profileCompleteness: { type: Number, default: 0 }, // 0-100 %
  },
  { timestamps: true }
);

jobSeekerProfileSchema.index({ skills: 1 });
jobSeekerProfileSchema.index({ preferredCategories: 1 });
jobSeekerProfileSchema.index({ isOpenToWork: 1 });

// Live list of this candidate's applications.
jobSeekerProfileSchema.virtual('applications', {
  ref: 'Application',
  localField: 'userId',
  foreignField: 'applicantId',
});

jobSeekerProfileSchema.set('toJSON', { virtuals: true });
jobSeekerProfileSchema.set('toObject', { virtuals: true });

// Compute a rough completeness % whenever the profile is saved.
jobSeekerProfileSchema.methods.computeCompleteness = function computeCompleteness() {
  const checks = [
    !!this.headline,
    !!this.about,
    !!(this.resume && this.resume.fileUrl),
    this.education.length > 0,
    this.experience.length > 0 || this.totalExperienceMonths === 0,
    this.skills.length > 0,
    this.languages.length > 0,
    this.preferredCategories.length > 0,
    !!(this.expectedSalary && this.expectedSalary.min),
  ];
  const done = checks.filter(Boolean).length;
  this.profileCompleteness = Math.round((done / checks.length) * 100);
  return this.profileCompleteness;
};

const JobSeekerProfile = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);

module.exports = JobSeekerProfile;
