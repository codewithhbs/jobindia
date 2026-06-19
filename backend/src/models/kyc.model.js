const mongoose = require('mongoose');

const kycDocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userRole: { type: String, enum: ['driver', 'employer', 'jobseeker'] },
  fieldId: { type: String, required: true },
  fieldName: { type: String, required: true },
  documentType: String,
  fileUrl: { type: String, required: true },
  fileType: String,
  fileSize: Number,
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  reviewedBy: mongoose.Schema.Types.ObjectId,
  reviewedAt: Date,
  rejectionReason: String,
  expiryDate: Date,
  metadata: mongoose.Schema.Types.Mixed,
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const kycSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  userRole: String,
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KYCDocument' }],
  overallStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'under_review', 'approved', 'rejected', 'partial'],
    default: 'not_submitted',
    index: true
  },
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: mongoose.Schema.Types.ObjectId,
  adminNotes: String,
  autoApproved: { type: Boolean, default: false }
}, { timestamps: true });

const KYCDocument = mongoose.model('KYCDocument', kycDocumentSchema);
const KYCSubmission = mongoose.model('KYCSubmission', kycSubmissionSchema);

module.exports = { KYCDocument, KYCSubmission };
