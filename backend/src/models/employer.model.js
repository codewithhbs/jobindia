const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    fieldId: String,
    fieldName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { _id: true }
);

/**
 * EmployerProfile — company + recruiter details, subscription, verification.
 * companyName is no longer required at creation (it is filled when the
 * employer completes their profile), so a placeholder profile can be created
 * at signup. The old dynamicFields Map has been removed.
 */
const employerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    companyName: { type: String, trim: true },
    companyLogo: String,
    industry: String,
    companySize: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
    website: String,
    description: String,
    foundedYear: Number,

    contactPerson: {
      name: String,
      designation: String,
      email: String,
      phone: String,
    },

    gstNumber: String,
    panNumber: String,

    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String,
    },

    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },

    subscriptionPlan: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
      default: 'free',
    },
    subscriptionExpiry: Date,
    jobPostLimit: { type: Number, default: 3 },
    totalJobsPosted: { type: Number, default: 0 },
    activeJobs: { type: Number, default: 0 },

    documents: [documentSchema],
  },
  { timestamps: true }
);

const EmployerProfile = mongoose.model('EmployerProfile', employerProfileSchema);

module.exports = EmployerProfile;
