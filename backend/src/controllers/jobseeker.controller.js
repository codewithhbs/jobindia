const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { ok, paginated } = require('../utils/ApiResponse');
const { JobSeekerProfile, Application, SavedJob, User } = require('../models');

const getOrInit = async (userId) => {
  let profile = await JobSeekerProfile.findOne({ userId }).populate('userId');
  if (!profile) profile = await JobSeekerProfile.create({ userId });
  return profile;
};

// GET /api/v1/jobseekers/me
exports.getMyProfile = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);
  ok(res, profile);
});

// PUT /api/v1/jobseekers/me — update structured profile fields
exports.upsertProfile = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);

  const allowed = [
    'headline', 'about', 'skills', 'languages', 'certifications',
    'totalExperienceMonths', 'currentSalary', 'preferredCategories',
    'preferredJobTypes', 'preferredLocations', 'expectedSalary',
    'noticePeriodDays', 'availability', 'isOpenToWork', 'willingToRelocate', 'links',
  ];
  console.log(req.body)

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      profile[key] = typeof req.body[key] === 'string' && ['skills', 'languages', 'certifications', 'preferredCategories', 'preferredJobTypes', 'preferredLocations', 'expectedSalary', 'links'].includes(key)
        ? JSON.parse(req.body[key])
        : req.body[key];
    }
  }

  profile.computeCompleteness();
  await profile.save();

  // Sync overall account completeness flag
  const user = await User.findById(req.user.userId);
  if (user && profile.profileCompleteness >= 60 && !user.isProfileComplete) {
    user.isProfileComplete = true;
    await user.save();
  }

  ok(res, profile, 'Profile updated');
});

// PUT /api/v1/jobseekers/me/resume — upload CV (pdf/doc/image)
exports.uploadResume = catchAsync(async (req, res, next) => {
  console.log(req)
  const info = req.uploadedFiles?.resume_info;
  if (!info) return next(new AppError('No resume file uploaded', 400));

  const profile = await getOrInit(req.user.userId);
  profile.resume = {
    fileUrl: info.fileUrl,
    fileName: info.fileName,
    fileType: info.fileType,
    uploadedAt: new Date(),
  };
  profile.computeCompleteness();
  await profile.save();
  ok(res, profile.resume, 'Resume uploaded');
});

// ── Education ──
exports.addEducation = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);
  profile.education.push(req.body);
  profile.computeCompleteness();
  await profile.save();
  ok(res, profile.education, 'Education added', 201);
});

exports.updateEducation = catchAsync(async (req, res, next) => {
  const profile = await getOrInit(req.user.userId);
  const item = profile.education.id(req.params.itemId);
  if (!item) return next(new AppError('Education entry not found', 404));
  item.set(req.body);
  await profile.save();
  ok(res, profile.education, 'Education updated');
});

exports.deleteEducation = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);
  profile.education.pull({ _id: req.params.itemId });
  await profile.save();
  ok(res, profile.education, 'Education removed');
});

// ── Experience ──
exports.addExperience = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);

  const experience = {
    jobTitle: req.body.jobTitle || req.body.title,
    company: req.body.company,
    employmentType: req.body.employmentType || 'full_time',
    location: req.body.location || '',
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    isCurrent:
      req.body.isCurrent ??
      req.body.currentlyWorking ??
      false,
    description: req.body.description || '',
  };

  profile.experience.push(experience);

  profile.computeCompleteness();
  await profile.save();

  ok(res, profile.experience, 'Experience added', 201);
});

exports.updateExperience = catchAsync(async (req, res, next) => {
  const profile = await getOrInit(req.user.userId);

  const item = profile.experience.id(req.params.itemId);
  if (!item) {
    return next(new AppError('Experience entry not found', 404));
  }

  const experience = {
    ...req.body,
    jobTitle: req.body.jobTitle || req.body.title,
    isCurrent:
      req.body.isCurrent ??
      req.body.currentlyWorking ??
      false,
  };

  item.set(experience);

  profile.computeCompleteness();
  await profile.save();

  ok(res, profile.experience, 'Experience updated');
});
exports.deleteExperience = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);
  profile.experience.pull({ _id: req.params.itemId });
  await profile.save();
  ok(res, profile.experience, 'Experience removed');
});

// PUT /api/v1/jobseekers/me/open-to-work
exports.toggleOpenToWork = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);
  profile.isOpenToWork = req.body.isOpenToWork ?? !profile.isOpenToWork;
  await profile.save();
  ok(res, { isOpenToWork: profile.isOpenToWork }, 'Updated');
});

// GET /api/v1/jobseekers/me/dashboard — applied + saved counts, recent activity
exports.getDashboard = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const [profile, totalApplications, statusBreakdown, savedCount, recent] = await Promise.all([
    getOrInit(userId),
    Application.countDocuments({ applicantId: userId }),
    Application.aggregate([
      { $match: { applicantId: require('mongoose').Types.ObjectId.createFromHexString(String(userId)) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    SavedJob.countDocuments({ userId }),
    Application.find({ applicantId: userId })
      .populate('jobId', 'title category location salary status companyName')
      .sort({ appliedAt: -1 })
      .limit(5),
  ]);

  const byStatus = {};
  statusBreakdown.forEach((s) => { byStatus[s._id] = s.count; });

  ok(res, {
    profileCompleteness: profile.profileCompleteness,
    isOpenToWork: profile.isOpenToWork,
    totalApplications,
    savedJobs: savedCount,
    applicationsByStatus: byStatus,
    recentApplications: recent,
  });
});

// GET /api/v1/jobseekers/:id — public candidate view (employers)
exports.getPublicProfile = catchAsync(async (req, res, next) => {
  const profile = await JobSeekerProfile.findOne({ userId: req.params.id })
    .populate('userId', 'name avatar location');
  if (!profile) return next(new AppError('Candidate profile not found', 404));
  await JobSeekerProfile.updateOne({ _id: profile._id }, { $inc: { 'stats.profileViews': 1 } });
  ok(res, profile);
});

// GET /api/v1/jobseekers — admin/employer search by skills/category/location
exports.searchCandidates = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, skill, category, openToWork } = req.query;
  const filter = {};
  if (skill) filter.skills = new RegExp(skill, 'i');
  if (category) filter.preferredCategories = category;
  if (openToWork !== undefined) filter.isOpenToWork = openToWork === 'true';

  const [candidates, total] = await Promise.all([
    JobSeekerProfile.find(filter)
      .populate('userId', 'name avatar location phone')
      .sort({ profileCompleteness: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10)),
    JobSeekerProfile.countDocuments(filter),
  ]);
  paginated(res, candidates, { total, page, limit });
});
