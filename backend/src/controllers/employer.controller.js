const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { ok, paginated } = require('../utils/ApiResponse');
const { EmployerProfile, Job, Application, User } = require('../models');

const getOrInit = async (userId) => {
  let profile = await EmployerProfile.findOne({ userId });
  if (!profile) profile = await EmployerProfile.create({ userId });
  return profile;
};

// GET /api/v1/employers/me
exports.getMyProfile = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);
  ok(res, profile);
});

// PUT /api/v1/employers/me
exports.upsertProfile = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);

  const allowed = [ 
    'companyName', 'industry', 'companySize', 'website', 'description',
    'foundedYear', 'contactPerson', 'gstNumber', 'panNumber', 'address',
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      profile[key] = typeof req.body[key] === 'string' && ['contactPerson', 'address'].includes(key)
        ? JSON.parse(req.body[key])
        : req.body[key];
    }
  }
  if (req.uploadedFiles?.companyLogo) profile.companyLogo = req.uploadedFiles.companyLogo;

  profile.verificationStatus = "pending"
  await profile.save();

  // Mark account complete once a company name is set
  if (profile.companyName) {
    await User.findByIdAndUpdate(req.user.userId, { isProfileComplete: true });
  }
  ok(res, profile, 'Company profile updated');
});

// POST /api/v1/employers/me/documents — upload verification docs (gst/pan etc.)
exports.uploadDocuments = catchAsync(async (req, res, next) => {
  const uploaded = req.uploadedFiles || {};
  const profile = await getOrInit(req.user.userId);

  const docFields = Object.keys(uploaded).filter((k) => Array.isArray(uploaded[k]));
  if (docFields.length === 0) return next(new AppError('No documents uploaded', 400));

  for (const field of docFields) {
    for (const file of uploaded[field]) {
      const existingIdx = profile.documents.findIndex((d) => d.fieldId === field);
      const doc = {
        fieldId: field,
        fieldName: field,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        uploadedAt: new Date(),
        verificationStatus: 'pending',
      };
      if (existingIdx >= 0) profile.documents[existingIdx] = doc;
      else profile.documents.push(doc);
    }
  }
  profile.verificationStatus = 'pending';
  await profile.save();
  ok(res, profile.documents, 'Documents uploaded');
});

// GET /api/v1/employers/me/dashboard
exports.getDashboard = catchAsync(async (req, res) => {
  const employerId = req.user.userId;
  const [profile, totalJobs, activeJobs, totalApplications, newApplications] = await Promise.all([
    getOrInit(employerId),
    Job.countDocuments({ employerId }),
    Job.countDocuments({ employerId, status: 'active' }),
    Application.countDocuments({ employerId }),
    Application.countDocuments({ employerId, status: 'applied' }),
  ]);

  ok(res, {
    subscriptionPlan: profile.subscriptionPlan,
    jobPostLimit: profile.jobPostLimit,
    totalJobs,
    activeJobs,
    totalApplications,
    newApplications,
    verificationStatus: profile.verificationStatus,
  });
});

// ── Admin ──

// GET /api/v1/employers — admin list
exports.listEmployers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, verificationStatus } = req.query;
  const filter = {};
  if (verificationStatus) filter.verificationStatus = verificationStatus;

  const [employers, total] = await Promise.all([
    EmployerProfile.find(filter)
      .populate('userId', 'name phone email isActive')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10)),
    EmployerProfile.countDocuments(filter),
  ]);
  paginated(res, employers, { total, page, limit });
});

// PUT /api/v1/employers/:id/verify — admin approve/reject
exports.verifyEmployer = catchAsync(async (req, res, next) => {
  const { status } = req.body; // approved | rejected | pending
  const profile = await EmployerProfile.findOneAndUpdate(
    { userId: req.params.id },
    { verificationStatus: status },
    { new: true }
  );
  if (!profile) return next(new AppError('Employer not found', 404));
  ok(res, profile, `Employer ${status}`);
});


// GET /api/v1/employers/:id — get single employer
exports.getSingleEmployer = catchAsync(async (req, res, next) => {
  const profile = await EmployerProfile.findOne(
    { userId: req.params.id },
  );
  if (!profile) return next(new AppError('Employer not found', 404));
  ok(res, profile, "fetched success");
});

// PUT /api/v1/employers/:id — admin uipdate

exports.upsertProfileAdmin = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.params.id);

  const allowed = [ 
    'companyName', 'industry', 'companySize', 'website', 'description',
    'foundedYear', 'contactPerson', 'gstNumber', 'panNumber', 'address',
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      profile[key] = typeof req.body[key] === 'string' && ['contactPerson', 'address'].includes(key)
        ? JSON.parse(req.body[key])
        : req.body[key];
    }
  }
  if (req.uploadedFiles?.companyLogo) profile.companyLogo = req.uploadedFiles.companyLogo;


  await profile.save();

  // Mark account complete once a company name is set
  if (profile.companyName) {
    await User.findByIdAndUpdate(req.user.userId, { isProfileComplete: true });
  }
  ok(res, profile, 'Company profile updated');
});