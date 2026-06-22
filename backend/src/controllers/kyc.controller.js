const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { ok, paginated } = require('../utils/ApiResponse');
const { KYCDocument, KYCSubmission, User, DriverProfile } = require('../models');
const notificationService = require('../services/notification.service');

// POST /api/v1/kyc/submit
exports.submitDocument = catchAsync(async (req, res) => {
  const { fieldId, fieldName, documentType, fileUrl, fileType, fileSize, expiryDate } = req.body;
  const { userId, role } = req.user;

  const doc = await KYCDocument.findOneAndUpdate(
    { userId, fieldId },
    { userId, userRole: role, fieldId, fieldName, documentType, fileUrl, fileType, fileSize, expiryDate, status: 'pending' },
    { upsert: true, new: true }
  );

  let submission = await KYCSubmission.findOne({ userId });
  if (!submission) {
    submission = new KYCSubmission({ userId, userRole: role, documents: [], overallStatus: 'pending' });
  }
  if (!submission.documents.some((d) => d.toString() === doc._id.toString())) {
    submission.documents.push(doc._id);
  }
  submission.overallStatus = 'pending';
  submission.submittedAt = new Date();
  await submission.save();

  await User.findByIdAndUpdate(userId, { kycStatus: 'pending' });

  ok(res, doc, 'Document submitted for verification', 201);
});

// GET /api/v1/kyc/status
exports.getKYCStatus = catchAsync(async (req, res) => {
  const submission = await User.findById(req.user.userId)
    .populate('kycStatus');

  if (!submission) {
    return ok(res, {
      overallStatus: null,
      message: "User not found"
    });
  }

  return ok(res, {
    overallStatus: submission.kycStatus,
    user: submission
  });
});
// GET /api/v1/kyc/pending — admin
exports.getPendingKYC = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, userRole, status = 'pending' } = req.query;
  const filter = { overallStatus: status };
  if (userRole) filter.userRole = userRole;

  const [submissions, total] = await Promise.all([
    KYCSubmission.find(filter).populate('documents').sort({ submittedAt: 1 }).skip((page - 1) * limit).limit(parseInt(limit, 10)),
    KYCSubmission.countDocuments(filter),
  ]);
  paginated(res, submissions, { total, page, limit });
});

// PUT /api/v1/kyc/:userId/review — admin
exports.reviewKYC = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { status, adminNotes, documentReviews } = req.body;

  if (documentReviews?.length) {
    await Promise.all(
      documentReviews.map((dr) =>
        KYCDocument.findByIdAndUpdate(dr.documentId, {
          status: dr.status,
          rejectionReason: dr.rejectionReason,
          reviewedBy: req.user.userId,
          reviewedAt: new Date(),
        })
      )
    );
  }

  const submission = await KYCSubmission.findOneAndUpdate(
    { userId },
    { overallStatus: status, adminNotes, reviewedBy: req.user.userId, reviewedAt: new Date() },
    { new: true }
  );

  // Keep the User doc in sync + notify (direct in-process call — no HTTP)
  await User.findByIdAndUpdate(userId, {
    kycStatus: status,
    isKYCVerified: status === 'approved',
  });

  await notificationService.sendToUser({
    userId,
    title: status === 'approved' ? 'KYC Approved 🎉' : 'KYC Update',
    body:
      status === 'approved'
        ? 'Your documents have been verified. You can now apply / post freely.'
        : `Your KYC was ${status}. ${adminNotes || ''}`.trim(),
    category: 'kyc',
  });

  ok(res, submission, `KYC ${status}`);
});

// GET /api/v1/kyc/stats — admin
exports.getKYCStats = catchAsync(async (req, res) => {
  const stats = await KYCSubmission.aggregate([
    { $group: { _id: '$overallStatus', count: { $sum: 1 } } },
  ]);
  const result = {};
  stats.forEach((s) => { result[s._id] = s.count; });
  ok(res, result);
});
