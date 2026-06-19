const { JobSeekerProfile } = require('../models');
const { Job, Application, SavedJob } = require('../models/job.model');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function calculateSkillMatch(userSkills = [], jobSkills = []) {
  if (!jobSkills.length) return 0;

  const userSet = new Set(userSkills.map(s => s.toLowerCase()));

  let matchCount = 0;
  for (const skill of jobSkills) {
    if (userSet.has(skill.toLowerCase())) matchCount++;
  }

  return matchCount / jobSkills.length; // 0 → 1
}

function rankJob(job, profile) {
  const userSkills = profile.skills || [];


  const skillMatch = calculateSkillMatch(userSkills, job.skills || []);
  const normalize = (s) => (s || '').toString().trim().toLowerCase();

  const categoryMatch =
    profile.preferredCategories?.some(
      (c) => normalize(c.name) === normalize(job.category)
    )
      ? 1
      : 0;
  const locationMatch =
    profile.preferredLocations?.some(l =>
      job.location?.city?.toLowerCase() === l.city?.toLowerCase()
    ) ? 1 : 0;

  const experienceMatch =
    profile.totalExperienceMonths >= (job.requirements?.experience?.min || 0) ? 1 : 0;

  const salaryMatch =
    job.salary?.max >= (profile.expectedSalary?.min || 0) ? 1 : 0;

  const freshnessBoost =
    job.createdAt ? Math.max(0, 1 - (Date.now() - job.createdAt) / (1000 * 60 * 60 * 24 * 30)) : 0;

  const featuredBoost = job.isFeatured ? 1 : 0;

  const score =
    skillMatch * 40 +
    categoryMatch * 20 +
    locationMatch * 15 +
    experienceMatch * 10 +
    salaryMatch * 10 +
    freshnessBoost * 5 +
    featuredBoost * 5;

  return { ...job.toObject(), score };
}
// POST /api/v1/jobs
exports.createJob = async (req, res, next) => {
  try {
    console.log(req.body)
    const { title, description, category, salary, location, requirements, vacancies, jobType, dynamicFields, applicationDeadline, benefits, tags } = req.body;
    const { userId, role } = req.user;
    console.log(req.user)
    if (!['employer', 'admin', 'superadmin'].includes(role)) {
      throw new AppError('Only employers can post jobs', 403);
    }

    const job = await Job.create({
      title, description, category, salary, jobType,
      location: {
        ...location,
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
      },
      requirements, vacancies, dynamicFields, applicationDeadline, benefits, tags,
      employerId: userId,
      status: 'paused',
      publishedAt: new Date()
    });

    res.status(201).json({ success: true, data: job, message: 'Job posted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendedJobs = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    console.log(search)
    const filter = {
      status: 'active',
    };

    // ✅ Add text search support
    if (search) {
      filter.$text = { $search: search };
    }

    // (optional) category filter if you want it
    if (category) {
      filter.category = category;
    }

    const profile = await JobSeekerProfile
      .findOne({ userId: req?.user?.userId })
      .populate('preferredCategories', 'name');

    const jobs = await Job.find().limit(200);
    const ranked = jobs
      .map(job => rankJob(job, profile))
      .sort((a, b) => b.score - a.score);

    let finalJobs = ranked;

    if (search) {
      const s = search.toLowerCase();

      finalJobs = ranked.filter(job =>
        job.title?.toLowerCase().includes(s) ||
        job.description?.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data: finalJobs.slice(0, 50),
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/v1/jobs (search + filter)
exports.getJobs = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      search,
      category,
      isFeatured,
      jobType,
      city, state, admin,
      lat, lng, radius,
      salaryMin, salaryMax,
      experience, isRemote,
      sortBy = 'createdAt'
    } = req.query;
    console.log(admin)
    let filter;

    if (admin === 'true') {
      filter = {};
    } else {
      filter = { status: 'active' };
    }

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) filter.category = category;
    if (jobType) filter.jobType = jobType;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (state) filter['location.state'] = new RegExp(state, 'i');
    if (isRemote === 'true') filter['location.isRemote'] = true;
    if (salaryMin) filter['salary.min'] = { $gte: parseInt(salaryMin) };
    if (salaryMax) filter['salary.max'] = { $lte: parseInt(salaryMax) };
    if (experience) filter['requirements.experience.min'] = { $lte: parseInt(experience) };
    if (isFeatured) filter.isFeatured = isFeatured
    let query;

    // Geo-based search
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius || 25000)
        }
      };
      query = Job.find(filter);
    } else {
      // Sort options
      const sortOptions = {
        createdAt: { createdAt: -1 },
        salary: { 'salary.max': -1 },
        relevance: search ? { score: { $meta: 'textScore' } } : { createdAt: -1 }
      };

      query = Job.find(filter, search ? { score: { $meta: 'textScore' } } : {})
        .sort(sortOptions[sortBy] || { isFeatured: -1, createdAt: -1 });
    }

    const [jobs, total] = await Promise.all([
      query.skip((page - 1) * limit).limit(parseInt(limit)),
      Job.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/jobs/nearby
exports.getNearbyJobs = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10000, category, page = 1, limit = 20 } = req.query;

    if (!lat || !lng) throw new AppError('Latitude and longitude required', 400);

    const filter = {
      status: 'active',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      }
    };
    if (category) filter.category = category;

    const jobs = await Job.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: jobs, count: jobs.length });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/jobs/:id
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!job) throw new AppError('Job not found', 404);

    let applied = false;

    if (req.user?.userId) {
      const application = await Application.findOne({
        jobId: req.params.id,
        applicantId: req.user.userId,
        status: 'applied',
      });

      applied = !!application;
    }

    const jobData = {
      ...job.toObject(),
      applied,
    };

    res.json({ success: true, data: jobData });
  } catch (error) {
    next(error);
  }
};
// PUT /api/v1/jobs/:id
exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    // Authorization check
    if (
      job.employerId.toString() !== req.user.userId &&
      !["admin", "superadmin"].includes(req.user.role)
    ) {
      throw new AppError("Not authorized to update this job", 403);
    }

    const updateData = { ...req.body };

    // Convert location to GeoJSON format if lat/lng provided
    if (
      updateData.location &&
      updateData.location.latitude &&
      updateData.location.longitude
    ) {
      updateData.location = {
        type: "Point",
        coordinates: [
          Number(updateData.location.longitude),
          Number(updateData.location.latitude),
        ],

        address: updateData.location.address,
        city: updateData.location.city,
        state: updateData.location.state,
        country: updateData.location.country,
        pincode: updateData.location.pincode,
        isRemote: updateData.location.isRemote || false,
      };
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};
// DELETE /api/v1/jobs/:id
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) throw new AppError('Job not found', 404);

    if (job.employerId.toString() !== req.user.userId && !['admin', 'superadmin'].includes(req.user.role)) {
      throw new AppError('Not authorized', 403);
    }

    await Job.findByIdAndUpdate(req.params.id, { status: 'closed' });
    res.json({ success: true, message: 'Job closed' });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/jobs/:id/apply
exports.applyJob = async (req, res, next) => {
  try {
    const { coverLetter, resumeUrl } = req.body;
    const { userId } = req.user;
    const jobId = req.params.id;

    const job = await Job.findOne({ _id: jobId, status: 'active' });
    if (!job) throw new AppError('Job not found or inactive', 404);

    // Check deadline
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      throw new AppError('Application deadline passed', 400);
    }

    // Check duplicate
    const existing = await Application.findOne({ jobId, applicantId: userId });
    if (existing) throw new AppError('Already applied to this job', 409);

    const application = await Application.create({
      jobId, applicantId: userId, employerId: job.employerId,
      jobTitle: job.title, coverLetter, resumeUrl, status: 'applied'
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applications: 1 } });

    res.status(201).json({ success: true, data: application, message: 'Application submitted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/jobs/my-applications
exports.getMyApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { applicantId: req.user.userId };
    if (status) filter.status = status;

    const [apps, total] = await Promise.all([
      Application.find(filter)
        .populate('jobId', 'title category location salary status companyName')
        .sort({ appliedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Application.countDocuments(filter)
    ]);

    res.json({ success: true, data: apps, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/jobs/:id/applications (employer)
exports.getJobApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const job = await Job.findById(req.params.id);
    if (!job) throw new AppError('Job not found', 404);

    if (job.employerId.toString() !== req.user.userId && !['admin', 'superadmin'].includes(req.user.role)) {
      throw new AppError('Not authorized', 403);
    }

    const filter = { jobId: req.params.id };
    if (status) filter.status = status;

    const apps = await Application.find(filter)
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: apps, count: apps.length });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/applications/:id/status (employer)
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, employerNotes, rejectionReason, interviewDetails } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) throw new AppError('Application not found', 404);

    if (application.employerId.toString() !== req.user.userId && !['admin', 'superadmin'].includes(req.user.role)) {
      throw new AppError('Not authorized', 403);
    }

    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status, employerNotes, rejectionReason, interviewDetails },
      { new: true }
    );

    // Update shortlisted count
    if (status === 'shortlisted') {
      await Job.findByIdAndUpdate(application.jobId, { $inc: { shortlisted: 1 } });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/jobs/:id/save
exports.saveJob = async (req, res, next) => {
  try {
    const existing = await SavedJob.findOne({ userId: req.user.userId, jobId: req.params.id });
    if (existing) {
      await SavedJob.deleteOne({ _id: existing._id });
      return res.json({ success: true, saved: false, message: 'Job unsaved' });
    }
    await SavedJob.create({ userId: req.user.userId, jobId: req.params.id });
    res.json({ success: true, saved: true, message: 'Job saved' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/jobs/saved
exports.getSavedJobs = async (req, res, next) => {
  try {
    const saved = await SavedJob.find({ userId: req.user.userId })
      .populate('jobId')
      .sort({ savedAt: -1 });
    res.json({ success: true, data: saved.map(s => s.jobId).filter(Boolean) });
  } catch (error) {
    next(error);
  }
};

// Employer: GET /api/v1/jobs/my-jobs
exports.getMyJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { employerId: req.user.userId };
    if (status) filter.status = status;

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
      Job.countDocuments(filter)
    ]);

    res.json({ success: true, data: jobs, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
};
