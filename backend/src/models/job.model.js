const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: 'text' },
  description: { type: String, required: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  employerName: String,
  companyName: String,
  companyLogo: String,

  category: { type: String, required: true, index: true },
  subCategory: String,
  jobType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship'],
    default: 'full_time'
  },

  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'INR' },
    period: { type: String, enum: ['hourly', 'daily', 'monthly', 'yearly'], default: 'monthly' },
    isNegotiable: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false }
  },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: false }, // [lng, lat]
    address: String,
    city: { type: String, required: true },
    state: String,
    country: { type: String, default: 'India' },
    pincode: String,
    isRemote: { type: Boolean, default: false }
  },

  requirements: {
    experience: {
      min: { type: Number, default: 0 },
      max: Number,
      unit: { type: String, enum: ['months', 'years'], default: 'years' }
    },
    education: String,
    skills: [String],
    languages: [String],
    licenseRequired: { type: Boolean, default: false },
    licenseType: [String],
    vehicleRequired: { type: Boolean, default: false },
    vehicleType: [String],
    gender: { type: String, enum: ['any', 'male', 'female'], default: 'any' },
    ageMin: Number,
    ageMax: Number
  },

  vacancies: { type: Number, default: 1 },
  applicationDeadline: Date,

  // Dynamic fields from admin configuration
  dynamicFields: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },

  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'expired', 'verified', 'rejected'],
    default: 'draft',
    index: true
  },

  // Stats
  views: { type: Number, default: 0 },
  applications: { type: Number, default: 0 },
  shortlisted: { type: Number, default: 0 },

  isFeatured: { type: Boolean, default: false },
  featuredUntil: Date,
  featuredOrder: Number,

  tags: [String],
  benefits: [String],

  expiresAt: Date,
  publishedAt: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

jobSchema.index({ location: '2dsphere' });
jobSchema.index({ title: 'text', description: 'text', tags: 'text' });
jobSchema.index({ category: 1, status: 1, 'location.city': 1 });
jobSchema.index({ employerId: 1, status: 1 });
jobSchema.index({ isFeatured: 1, featuredOrder: 1 });

// Application Schema
const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  jobTitle: String,
  employerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true, index: true
  },
  applicantName: String,
  applicantPhone: String,

  status: {
    type: String,
    enum: ['applied', 'viewed', 'shortlisted', 'interview_scheduled', 'offered', 'hired', 'rejected', 'withdrawn'],
    default: 'applied',
    index: true
  },

  coverLetter: String,
  resumeUrl: String,

  interviewDetails: {
    scheduledAt: Date,
    location: String,
    type: { type: String, enum: ['in_person', 'phone', 'video'] },
    notes: String
  },

  employerNotes: String,
  rejectionReason: String,

  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
applicationSchema.index({ applicantId: 1, status: 1 });

// Saved Jobs
const savedJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  savedAt: { type: Date, default: Date.now }
});
savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Job = mongoose.model('Job', jobSchema);
const Application = mongoose.model('Application', applicationSchema);
const SavedJob = mongoose.model('SavedJob', savedJobSchema);

module.exports = { Job, Application, SavedJob };
