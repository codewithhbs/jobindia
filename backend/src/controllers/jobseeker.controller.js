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
// PUT /api/v1/jobseekers/me
exports.upsertProfile = catchAsync(async (req, res) => {
  const profile = await getOrInit(req.user.userId);

  const allowed = [
    "isFresher",
    "skills",
    "experience",
    "totalExperienceMonths",
    "currentSalary",
    "preferredCategories",
    "preferredJobTypes",
    "preferredLocations",
    "expectedSalary",
    "noticePeriodDays",
  ];

  const jsonFields = [
    "skills",
    "experience",
    "preferredCategories",
    "preferredJobTypes",
    "preferredLocations",
    "expectedSalary",
  ];

  // Parse preferredLocations
  if (req.body.preferredLocations !== undefined) {
    let locations = req.body.preferredLocations;

    if (typeof locations === "string") {
      locations = JSON.parse(locations);
    }

    profile.preferredLocations = locations.map((location) => ({
      name: location.name,
      lat: location.lat,
      lng: location.lng,
      city: location.city || location.name,
      state: location.state || "",
      country: location.country || "",
    }));
  }

  // Update remaining fields
  for (const key of allowed) {
    if (key === "preferredLocations") continue;

    if (req.body[key] === undefined) continue;

    if (
      typeof req.body[key] === "string" &&
      jsonFields.includes(key)
    ) {
      try {
        profile[key] = JSON.parse(req.body[key]);
      } catch {
        profile[key] = req.body[key];
      }
    } else {
      profile[key] = req.body[key];
    }
  }

  if (profile.isFresher) {
    profile.totalExperienceMonths = 0;
  }

  profile.computeCompleteness();
  await profile.save();

  const user = await User.findById(req.user.userId);

  if (user) {
    user.isProfileComplete = profile.profileCompleteness >= 60;
    await user.save();
  }

  ok(res, profile, "Profile updated successfully");
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










const ALLOWED_PROFILE_FIELDS = [
  'headline', 'about', 'skills', 'languages', 'certifications',
  'totalExperienceMonths', 'currentSalary', 'preferredCategories',
  'preferredJobTypes', 'preferredLocations', 'expectedSalary',
  'noticePeriodDays', 'availability', 'isOpenToWork', 'willingToRelocate', 'links',
];

// Yeh fields kabhi-kabhi stringified JSON aate hain (form-data se), to parse karna padta hai
const JSON_STRING_FIELDS = [
  'skills', 'languages', 'certifications', 'preferredCategories',
  'preferredJobTypes', 'preferredLocations', 'expectedSalary', 'links',
];

function safeParseIfJsonString(key, value) {
  if (typeof value === 'string' && JSON_STRING_FIELDS.includes(key)) {
    try {
      return JSON.parse(value);
    } catch (err) {
      throw new AppError(`Invalid JSON in field "${key}"`, 400);
    }
  }
  return value;
}

function applyProfileFields(profile, body) {
  for (const key of ALLOWED_PROFILE_FIELDS) {
    if (body[key] !== undefined) {
      profile[key] = safeParseIfJsonString(key, body[key]);
    }
  }
}

function buildExperienceObject(body, existing = {}) {
  return {
    ...existing,
    ...body,
    jobTitle: body.jobTitle || body.title || existing.jobTitle,
    company: body.company ?? existing.company,
    employmentType: body.employmentType || existing.employmentType || 'full_time',
    location: body.location ?? existing.location ?? '',
    startDate: body.startDate ?? existing.startDate,
    endDate: body.endDate ?? existing.endDate,
    isCurrent: body.isCurrent ?? body.currentlyWorking ?? existing.isCurrent ?? false,
    description: body.description ?? existing.description ?? '',
  };
}

// ────────────────────────────────────────────────────────────
// PUT /api/v1/jobseekers/me/full-update
//
// Single combined endpoint — admin/jobseeker ek hi call me yeh sab bhej sakta hai:
//
// {
//   "profile": { headline, about, skills: [...], ... },   // optional
//   "isOpenToWork": true,                                  // optional, shortcut
//   "education": {
//     "add": [ {degree, institution, ...}, ... ],          // optional
//     "update": [ {itemId, ...fields}, ... ],               // optional
//     "remove": [ "itemId1", "itemId2" ]                    // optional
//   },
//   "experience": {
//     "add": [ {jobTitle, company, ...}, ... ],
//     "update": [ {itemId, ...fields}, ... ],
//     "remove": [ "itemId1", "itemId2" ]
//   }
// }
//
// Resume upload still ek alag multipart route se aata hai (file upload),
// isliye usko niche separate rakha hai (mergeResumeFile helper se chahe to
// same request me bhi handle ho sakta hai agar req.uploadedFiles aaya ho).
// ────────────────────────────────────────────────────────────
exports.fullUpdate = catchAsync(async (req, res, next) => {
  const profile = await getOrInit(req.params.userId);
  const body = req.body || {};

  // ── 1. Plain profile fields (headline, about, skills, etc.) ──
  if (body.profile && typeof body.profile === 'object') {
    applyProfileFields(profile, body.profile);
  }
  // Bhi top-level se allowed fields support karo (backward compatible with old payloads)
  applyProfileFields(profile, body);

  // ── 2. Open to work shortcut ──
  if (body.isOpenToWork !== undefined) {
    profile.isOpenToWork = body.isOpenToWork;
  }

  // ── 3. Education: add / update / remove ──
  if (body.education) {
    const { add = [], update = [], remove = [] } = body.education;

    for (const entry of add) {
      profile.education.push(entry);
    }

    for (const entry of update) {
      const { itemId, ...fields } = entry;
      const item = profile.education.id(itemId);
      if (!item) return next(new AppError(`Education entry not found: ${itemId}`, 404));
      item.set(fields);
    }

    for (const itemId of remove) {
      profile.education.pull({ _id: itemId });
    }
  }

  // ── 4. Experience: add / update / remove ──
  if (body.experience) {
    const { add = [], update = [], remove = [] } = body.experience;

    for (const entry of add) {
      profile.experience.push(buildExperienceObject(entry));
    }

    for (const entry of update) {
      const { itemId, ...fields } = entry;
      const item = profile.experience.id(itemId);
      if (!item) return next(new AppError(`Experience entry not found: ${itemId}`, 404));
      item.set(buildExperienceObject(fields, item.toObject()));
    }

    for (const itemId of remove) {
      profile.experience.pull({ _id: itemId });
    }
  }

  // ── 5. Resume (agar same request multipart ke through file ke sath aaye) ──
  const resumeInfo = req.uploadedFiles?.resume_info;
  if (resumeInfo) {
    profile.resume = {
      fileUrl: resumeInfo.fileUrl,
      fileName: resumeInfo.fileName,
      fileType: resumeInfo.fileType,
      uploadedAt: new Date(),
    };
  }

  // ── Recompute completeness + save ──
  profile.computeCompleteness();
  await profile.save();

  // ── Sync overall account completeness flag ──
  const user = await User.findById(req.user.userId);
  if (user && profile.profileCompleteness >= 60 && !user.isProfileComplete) {
    user.isProfileComplete = true;
    await user.save();
  }

  ok(res, profile, 'Profile fully updated');
});
