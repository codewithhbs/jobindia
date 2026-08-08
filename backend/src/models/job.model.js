const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: 'text' },
  description: { type: String, required: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  employerName: String,
  companyName: String,
  companyLogo: String,
  expiryDate: Date,
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
    isHidden: { type: Boolean, default: false },
    incentiveAvailable: { type: Boolean, default: false },   // ✅ new
    incentiveDescription: { type: String, default: '' }      // ✅ new (optional detail, e.g. "₹2000/month on target")
  },

  callingNumber: {
    type: String,
    trim: true,
  },

  whatsappNumber: {
    type: String,
    trim: true,
  },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number], required: false, default: undefined }, // [lng, lat]
    address: String,
    city: { type: String, required: false },
    state: String,
    country: { type: String, default: 'India' },
    pincode: String,
    isRemote: { type: Boolean, default: false }
  },

  workLocationType: {
    type: String,
    enum: ['work_from_office', 'field_job', 'work_from_home'],
    default: 'work_from_office',
  },

  shiftTime: {
    type: String,
    enum: ['day', 'night', 'rotational', 'flexible'],
    default: 'day',
  },

  workingDays: {
    type: String,
    enum: ['5_days', '6_days'],
    default: '6_days',
  },

  interviewType: {
    type: String,
    enum: ['in_person', 'telephonic'],
    default: 'in_person',
  },

  joiningFeeRequired: {
    type: Boolean,
    default: false,
  },
  joiningFeeDescription: {
    type: String,
    default: ''
  },
  maritalStatus: {
    type: String,
    enum: ['married', 'unmarried', 'both'],
    default: 'both',
  },

  callTimeStart: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setHours(10, 0, 0, 0);
      return d;
    },
  },

  callTimeEnd: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setHours(19, 0, 0, 0);
      return d;
    },
  },
  requirements: {
    experience: {
      min: { type: Number, default: 0 },
      max: Number,
      unit: { type: String, enum: ['months', 'years'], default: 'years' },
      isFresher: { type: Boolean, default: false }   // ✅ new
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

jobSchema.index({ 'location.coordinates': '2dsphere' });
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

jobSchema.pre('save', function (next) {
  if (this.location?.isRemote) {
    this.location.type = undefined;
    this.location.coordinates = undefined;
  }
  next();
});

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
