const { JobSeekerProfile, EmployerProfile, Category } = require('../models');
const { Job, Application, SavedJob } = require('../models/job.model');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { enqueueSingle, enqueueRecommendJob } = require('../queue');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const JobAuditLog = require('../models/JobAuditLog');

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
  const userSkills = profile?.skills || [];


  const skillMatch = calculateSkillMatch(userSkills, job.skills || []);
  const normalize = (s) => (s || '').toString().trim().toLowerCase();

  const categoryMatch =
    profile?.preferredCategories?.some(
      (c) => normalize(c.name) === normalize(job.category)
    )
      ? 1
      : 0;
  const locationMatch =
    profile?.preferredLocations?.some(l =>
      job.location?.city?.toLowerCase() === l.city?.toLowerCase()
    ) ? 1 : 0;

  const experienceMatch =
    profile?.totalExperienceMonths >= (job.requirements?.experience?.min || 0) ? 1 : 0;

  const salaryMatch =
    job.salary?.max >= (profile?.expectedSalary?.min || 0) ? 1 : 0;

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
    const {
      title,
      description,
      employerName,
      companyName,
      companyLogo,
      category,
      subCategory,
      salary,
      location,
      requirements,
      vacancies,
      jobType,
      dynamicFields,
      applicationDeadline,
      benefits,
      tags,
      status,
      expiryDate,
      isFeatured,
      featuredUntil,
      featuredOrder
    } = req.body;
    console.log(req.body)
    const { userId, role } = req.user;

    if (!["employer", "admin", "superadmin"].includes(role)) {
      return next(new AppError("Only employers can post jobs", 403));
    }

    if (!title?.trim()) {
      return next(new AppError("Job title is required", 400));
    }

    if (!description?.trim()) {
      return next(new AppError("Job description is required", 400));
    }

    if (!location) {
      return next(new AppError("Location is required", 400));
    }

    if (!category) {
      return next(new AppError("Category is required", 400));
    }

    // ── Subscription / job-post-limit check (only for employer role) ───────
    let employerProfile = null;
    if (role === "employer") {
      employerProfile = await EmployerProfile.findOne({ userId });

      if (!employerProfile) {
        return next(new AppError("Employer profile not found. Please complete your company profile first.", 404));
      }

      // Downgrade to free if subscription has expired
      const isExpired =
        employerProfile.subscriptionExpiry &&
        employerProfile.subscriptionExpiry.getTime() < Date.now();

      if (isExpired && employerProfile.subscriptionPlan !== "free") {
        employerProfile.subscriptionPlan = "free";
        employerProfile.subscriptionExpiry = null;

        const freePlan = await SubscriptionPlan.findOne({ slug: "free", isActive: true });
        employerProfile.jobPostLimit = freePlan?.jobPostLimit ?? 3;

        await employerProfile.save();
      }

      const limit = employerProfile.jobPostLimit ?? 3;
      const activeCount = employerProfile.activeJobs ?? 0;

      if (activeCount >= limit) {
        return next(
          new AppError(
            `You've reached your active job posting limit (${activeCount}/${limit}) for the ${employerProfile.subscriptionPlan} plan. Upgrade your plan or close an existing job to post a new one.`,
            403
          )
        );
      }
    }

     let longitude = null;
    let latitude = null;

    // Case 1: coordinates array
    if (
      Array.isArray(location.coordinates) &&
      location.coordinates.length >= 2
    ) {
      longitude = Number(location.coordinates[0]);
      latitude = Number(location.coordinates[1]);
    }

    // Case 2: latitude/longitude fields
    else if (
      location.latitude !== undefined &&
      location.longitude !== undefined
    ) {
      latitude = Number(location.latitude);
      longitude = Number(location.longitude);
    }

    const isRemote = Boolean(location.isRemote);
    const locationData = {
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      country: location.country || "",
      pincode: location.pincode || "",
      isRemote
    };

    if (!isRemote) {
      if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        return next(new AppError("Valid latitude and longitude are required", 400));
      }

      locationData.type = "Point";
      locationData.coordinates = [longitude, latitude];
    }


    // ✅ remote job ke liye type/coordinates set hi nahi karenge — schema default isse override na kare iske liye schema bhi fix karna padega (niche dekho)

    // ── Normalize requirements (skills/languages array-safe — old client comma-string bhi bhej sakta h) ──
    const toArray = (val) => {
      if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const requirementsData = requirements
      ? {
          ...requirements,
          skills: toArray(requirements.skills),
          languages: toArray(requirements.languages),
          licenseType: Array.isArray(requirements.licenseType) ? requirements.licenseType : [],
          vehicleType: Array.isArray(requirements.vehicleType) ? requirements.vehicleType : []
        }
      : undefined;

    const tagsData = toArray(tags);
    const benefitsData = toArray(benefits);

    // ── Featured listing validation ──
    let featuredUntilDate;
    if (isFeatured) {
      if (featuredUntil) {
        featuredUntilDate = new Date(featuredUntil);
        if (Number.isNaN(featuredUntilDate.getTime())) {
          return next(new AppError("Valid featuredUntil date is required for featured listings", 400));
        }
      }
    }

    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      employerName: employerName || "",
      companyName: companyName || "",
      companyLogo: companyLogo || "",
      category,
      salary,
      jobType,
      vacancies,
      requirements: requirementsData,
      dynamicFields,
      applicationDeadline,
      benefits: benefitsData,
      expiryDate,
      subCategory,
      tags: tagsData,
      location: locationData,
      employerId: userId,
      status: status || "paused",
      isFeatured: Boolean(isFeatured),
      featuredUntil: featuredUntilDate,
      featuredOrder: featuredOrder != null ? Number(featuredOrder) : undefined,
      publishedAt: new Date()
    });

    // ── Bump employer counters now that the job exists ──────────────────────
    if (employerProfile) {
      const increments = { totalJobsPosted: 1 };
      // Only count toward the active-jobs limit if the job is actually live.
      if (job.status === "active") {
        increments.activeJobs = 1;
      }
      await EmployerProfile.updateOne(
        { _id: employerProfile._id },
        { $inc: increments }
      );
    }

    // ── Notify recommended jobseekers about the new job (only when live) ────
    // Heavy matching + fan-out runs in the worker, so this returns instantly.
    if (job.status === 'active') {
      enqueueRecommendJob(job._id);
    }

    return res.status(201).json({
      success: true,
      message: "Job posted successfully",
      data: job
    });

  } catch (error) {
    console.error("Create Job Error:", {
      message: error.message,
      body: req.body,
      user: req.user
    });

    next(error);
  }
};
exports.getRecommendedJobs = async (req, res, next) => {
  try {
    const { search, category } = req.query;

    const profile = await JobSeekerProfile
      .findOne({ userId: req?.user?.userId })
      .populate('preferredCategories', 'name');

    let jobsQuery = { status: 'active' };

    if (req.user?.role === 'driver') {
      const driverCategories = await Category.find(
        { is_Drivercat: true },
        { name: 1 }
      );

      const driverCatNames = driverCategories.map(c => c.name);

      if (!driverCatNames.length) {
        return res.json({ success: true, data: [] });
      }

      jobsQuery.category = { $in: driverCatNames };

      if (category && driverCatNames.includes(category)) {
        jobsQuery.category = category;
      }
    } else if (category) {
      jobsQuery.category = category;
    }

    if (search) {
      jobsQuery.$text = { $search: search };
    }

    const jobs = await Job.find(jobsQuery).limit(200);

    let ranked = await Promise.all(
      jobs.map(async (job) => {
        const employerProfile = await EmployerProfile.findOne({
          userId: job.employerId,
        }).lean();

        return {
          ...rankJob(job, profile),
          employerProfile,
        };
      })
    );

    ranked = ranked.sort((a, b) => b.score - a.score);

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
      page = 1,
      limit = 20,
      search,
      category,
      isFeatured,
      jobType,
      city,
      state,
      admin,
      lat,
      lng,
      radius,
      salaryMin,
      salaryMax,
      experience,
      isRemote,
      sortBy = 'createdAt'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let filter = {};

    // =============================
    // ADMIN vs PUBLIC FILTER
    // =============================
    if (admin !== 'true') {
      filter.status = 'active';

      // ── Belt-and-suspenders: never show a job whose expiryDate has passed,
      // even if a delayed cron hasn't flipped status to 'expired' yet.
      filter.$or = [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ];

      // fetch driver categories
      const driverCategories = await Category.find(
        { is_Drivercat: true },
        { name: 1 }
      );

      const driverCatNames = driverCategories.map(c => c.name);

      // role-based category control
      if (req.user?.role === 'driver') {
        filter.category =
          category && driverCatNames.includes(category)
            ? category
            : { $in: driverCatNames };
      } else {
        if (category) {
          if (driverCatNames.includes(category)) {
            return res.json({
              success: true,
              data: [],
              pagination: {
                total: 0,
                page: pageNum,
                limit: limitNum,
                pages: 0
              }
            });
          }
          filter.category = category;
        } else if (driverCatNames.length) {
          filter.category = { $nin: driverCatNames };
        }
      }
    }

    // =============================
    // SEARCH
    // =============================
    if (search) {
      filter.$text = { $search: search };
    }

    // =============================
    // BASIC FILTERS
    // =============================
    if (jobType) filter.jobType = jobType;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (state) filter['location.state'] = new RegExp(state, 'i');

    if (isRemote === 'true') {
      filter['location.isRemote'] = true;
    }

    if (salaryMin) {
      filter['salary.min'] = { $gte: parseInt(salaryMin) };
    }

    if (salaryMax) {
      filter['salary.max'] = { $lte: parseInt(salaryMax) };
    }

    if (experience) {
      filter['requirements.experience.min'] = {
        $lte: parseInt(experience)
      };
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true';
    }

    // =============================
    // GEO SEARCH
    // =============================
    let geoStage = null;

    if (lat && lng) {
      geoStage = {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius || 25000),
          spherical: true,
          query: filter
        }
      };
      filter = {}; // moved into geoNear
    }

    // =============================
    // SORTING
    // =============================
    const sortOptions = {
      createdAt: { createdAt: -1 },
      salary: { 'salary.max': -1 },
      relevance: search
        ? { score: { $meta: 'textScore' } }
        : { createdAt: -1 }
    };

    const sort = sortOptions[sortBy] || {
      isFeatured: -1,
      createdAt: -1
    };

    // =============================
    // AGGREGATION PIPELINE
    // =============================
    const pipeline = [];

    if (geoStage) pipeline.push(geoStage);
    else pipeline.push({ $match: filter });

    // Employer (User join)
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'employerId',
        foreignField: '_id',
        as: 'employer'
      }
    });

    pipeline.push({
      $unwind: {
        path: '$employer',
        preserveNullAndEmptyArrays: true
      }
    });

    // EmployerProfile join (YOUR REQUIREMENT)
    pipeline.push({
      $lookup: {
        from: 'employerprofiles',
        localField: 'employer._id',
        foreignField: 'userId',
        as: 'employerProfile'
      }
    });

    pipeline.push({
      $unwind: {
        path: '$employerProfile',
        preserveNullAndEmptyArrays: true
      }
    });

    // projection of text score if needed
    if (search) {
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    }

    pipeline.push({ $sort: sort });

    pipeline.push({
      $facet: {
        data: [
          { $skip: (pageNum - 1) * limitNum },
          { $limit: limitNum }
        ],
        totalCount: [{ $count: 'count' }]
      }
    });

    // =============================
    // EXECUTE
    // =============================
    const result = await Job.aggregate(pipeline);

    const jobs = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    return res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};


exports.jobDetailsForAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job id'
      });
    }

    // =========================
    // 1. JOB BASIC DETAILS
    // =========================
    const job = await Job.findById(id).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // =========================
    // 2. EMPLOYER PROFILE
    // =========================
    const employerProfile = await EmployerProfile.findOne({
      userId: job.employerId
    }).lean();

    // =========================
    // 3. APPLICATIONS (with applicant details)
    // =========================
    const applications = await Application.aggregate([
      {
        $match: {
          jobId: new mongoose.Types.ObjectId(id)
        }
      },

      // applicant user details
      {
        $lookup: {
          from: 'users',
          localField: 'applicantId',
          foreignField: '_id',
          as: 'applicant'
        }
      },
      {
        $unwind: {
          path: '$applicant',
          preserveNullAndEmptyArrays: true
        }
      },

      // job seeker profile
      {
        $lookup: {
          from: 'jobseekerprofiles',
          localField: 'applicantId',
          foreignField: 'userId',
          as: 'jobSeekerProfile'
        }
      },
      {
        $unwind: {
          path: '$jobSeekerProfile',
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $sort: { createdAt: -1 }
      }
    ]);

    // =========================
    // 4. SAVED JOBS
    // =========================
    const savedUsers = await SavedJob.aggregate([
      {
        $match: {
          jobId: new mongoose.Types.ObjectId(id)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    // =========================
    // 5. RESPONSE
    // =========================
    return res.json({
      success: true,
      data: {
        job,
        employerProfile: employerProfile || null,

        applications: {
          total: applications.length,
          data: applications
        },

        savedBy: {
          total: savedUsers.length,
          data: savedUsers
        }
      }
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

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    let applied = false;

    if (req.user?.userId) {
      const application = await Application.findOne({
        jobId: req.params.id,
        applicantId: req.user.userId,
      });

      applied = !!application;
    }

    // Fetch employer profile using employerId (User._id)
    const employerProfile = await EmployerProfile.findOne({
      userId: job.employerId,
    }).lean();

    const jobData = {
      ...job.toObject(),
      applied,
      employerProfile: employerProfile || null,
    };

    res.json({
      success: true,
      data: jobData,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/jobs/:id

// Deep-ish equality check for primitives, arrays, plain objects (good enough for diffing)
function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a == b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => isEqual(v, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => isEqual(a[k], b[k]));
  }
  return false;
}

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

    // ── Normalize location: handle BOTH coordinates-array AND lat/lng-field shapes ──
    if (updateData.location) {
      const loc = updateData.location;
      let longitude = null;
      let latitude = null;

      if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        longitude = Number(loc.coordinates[0]);
        latitude = Number(loc.coordinates[1]);
      } else if (loc.latitude !== undefined && loc.longitude !== undefined) {
        latitude = Number(loc.latitude);
        longitude = Number(loc.longitude);
      }

      const isRemote = Boolean(loc.isRemote);
      const locationData = {
        address: loc.address || "",
        city: loc.city || "",
        state: loc.state || "",
        country: loc.country || "",
        pincode: loc.pincode || "",
        isRemote,
      };

      if (!isRemote) {
        if (
          longitude === null ||
          latitude === null ||
          Number.isNaN(latitude) ||
          Number.isNaN(longitude) ||
          latitude < -90 || latitude > 90 ||
          longitude < -180 || longitude > 180
        ) {
          return next(new AppError("Valid latitude and longitude are required", 400));
        }
        locationData.type = "Point";
        locationData.coordinates = [longitude, latitude];
      }

      updateData.location = locationData;
    }

    // ── Normalize requirements: DEEP-MERGE with existing DB doc, never replace wholesale ──
    // (Root cause of "requirements changing on their own": a $set with a partial
    // requirements object replaces the WHOLE nested object in Mongo, wiping out
    // any field the client didn't include in this particular request.)
    const toArray = (val) => {
      if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
      return undefined;
    };

    if (updateData.requirements) {
      const incoming = updateData.requirements;
      const existing = job.requirements ? job.toObject().requirements : {};

      const mergedExperience = incoming.experience
        ? { ...existing.experience, ...incoming.experience }
        : existing.experience;

      updateData.requirements = {
        ...existing,
        ...incoming,
        experience: mergedExperience,
        ...(incoming.skills !== undefined && { skills: toArray(incoming.skills) }),
        ...(incoming.languages !== undefined && { languages: toArray(incoming.languages) }),
        ...(incoming.licenseType !== undefined && {
          licenseType: Array.isArray(incoming.licenseType) ? incoming.licenseType : [],
        }),
        ...(incoming.vehicleType !== undefined && {
          vehicleType: Array.isArray(incoming.vehicleType) ? incoming.vehicleType : [],
        }),
      };
    }

    if (updateData.tags !== undefined) {
      updateData.tags = toArray(updateData.tags) || [];
    }
    if (updateData.benefits !== undefined) {
      updateData.benefits = toArray(updateData.benefits) || [];
    }

    // ── Featured listing validation ──
    if (updateData.featuredUntil !== undefined) {
      if (updateData.featuredUntil) {
        const d = new Date(updateData.featuredUntil);
        if (Number.isNaN(d.getTime())) {
          return next(new AppError("Valid featuredUntil date is required", 400));
        }
        updateData.featuredUntil = d;
      } else {
        updateData.featuredUntil = undefined;
      }
    }
    if (updateData.featuredOrder !== undefined) {
      updateData.featuredOrder =
        updateData.featuredOrder === "" || updateData.featuredOrder == null
          ? undefined
          : Number(updateData.featuredOrder);
    }

    // ── Strings: trim title/description if present ──
    if (typeof updateData.title === "string") updateData.title = updateData.title.trim();
    if (typeof updateData.description === "string") updateData.description = updateData.description.trim();

    // Never let client overwrite ownership/internal fields directly
    delete updateData.employerId;
    delete updateData._id;
    delete updateData.publishedAt;
    delete updateData.statusHistory;

    // ── Build diff BEFORE saving — compare EVERY field in updateData, no exclusions ──
    const jobPlain = job.toObject();
    const changes = {};
    for (const key of Object.keys(updateData)) {
      const before = jobPlain[key];
      const after = updateData[key];
      if (!isEqual(before, after)) {
        changes[key] = { from: before, to: after };
      }
    }

    const prevStatus = job.status;
    const newStatus = updateData.status;
    const statusChanged = newStatus !== undefined && newStatus !== prevStatus;

    // ── If status is changing, push to embedded statusHistory ──
    if (statusChanged) {
      updateData.$push = {
        statusHistory: {
          status: newStatus,
          changedAt: new Date(),
          changedBy: req.user.userId,
          changedByRole: req.user.role,
          reason: req.body.statusReason || undefined,
        },
      };
    }

    const { $push, ...setFields } = updateData;
    const mongoUpdate = $push ? { $set: setFields, $push } : { $set: setFields };

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      mongoUpdate,
      {
        new: true,
        runValidators: true,
      }
    );

    // ── Write the general audit log (every field that changed) ──
    if (Object.keys(changes).length > 0) {
      await JobAuditLog.create({
        job: updatedJob._id,
        changedBy: req.user.userId,
        changedByRole: req.user.role,
        changes,
      });
    }

    // ── Notify the employer who posted when the job's status changes ─────────
    if (statusChanged) {
      const newStatusFinal = updatedJob.status;
      const STATUS_MSG = {
        verified: 'has been verified and is now live 🎉',
        active: 'is now live and visible to candidates ✅',
        rejected: 'was rejected by the admin. Please review and edit it.',
        closed: 'has been closed.',
        paused: 'has been paused.',
        expired: 'has expired.',
      };
      const tail = STATUS_MSG[newStatusFinal] || `status changed to "${newStatusFinal}".`;
      enqueueSingle({
        userId: updatedJob.employerId,
        title: 'Job status updated',
        body: `Your job "${updatedJob.title}" ${tail}`,
        category: 'job',
        data: { type: 'job_status', jobId: String(updatedJob._id), status: newStatusFinal },
      });

      const wasLive = ['active', 'verified'].includes(prevStatus);
      const isLive = ['active', 'verified'].includes(newStatusFinal);
      if (isLive && !wasLive) {
        enqueueRecommendJob(updatedJob._id);
      }
    }

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

    enqueueSingle({
      userId: job.employerId,
      title: 'Job closed',
      body: `Your job "${job.title}" has been closed.`,
      category: 'job',
      data: { type: 'job_status', jobId: String(job._id), status: 'closed' },
    });

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

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { $inc: { applications: 1 } },
      { new: true }
    );

    // ── Milestone: ping the employer after every 5th application ────────────
    const totalApplications = updatedJob?.applications || 0;
    if (totalApplications > 0 && totalApplications % 5 === 0) {
      enqueueSingle({
        userId: job.employerId,
        title: 'New applications 📨',
        body: `Your job "${job.title}" has received ${totalApplications} applications so far.`,
        category: 'application',
        data: {
          type: 'application_milestone',
          jobId: String(jobId),
          count: String(totalApplications),
        },
      });
    }

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
      .populate('applicantId')
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const applicantIds = apps.map(a => a.applicantId?._id || a.applicantId);

    const profiles = await JobSeekerProfile.find({
      userId: { $in: applicantIds }
    });

    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.userId.toString()] = profile;
      return acc;
    }, {});

    const enrichedApps = apps.map(app => ({
      ...app.toObject(),
      profile: profileMap[(app.applicantId?._id || app.applicantId).toString()] || null,
    }));

    console.log(enrichedApps)

    res.json({ success: true, data: enrichedApps, count: enrichedApps.length });
  } catch (error) {
    next(error);
  }
};



// GET /api/v1/jobs/:id/applications/export (employer) — Excel download
exports.exportJobApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const job = await Job.findById(req.params.id);
    if (!job) throw new AppError('Job not found', 404);


    // if (job.employerId.toString() !== req.user.userId && !['admin', 'superadmin'].includes(req.user.role)) {
    //   throw new AppError('Not authorized', 403);
    // }

    const filter = { jobId: req.params.id };
    if (status) filter.status = status;

    const apps = await Application.find(filter)
      .populate('applicantId')
      .sort({ appliedAt: -1 });

    const applicantIds = apps.map(a => a.applicantId?._id || a.applicantId);

    const profiles = await JobSeekerProfile.find({
      userId: { $in: applicantIds }
    });

    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.userId.toString()] = profile;
      return acc;
    }, {});

    const enrichedApps = apps.map(app => ({
      ...app.toObject(),
      profile: profileMap[(app.applicantId?._id || app.applicantId).toString()] || null,
    }));

    // ---- Build Excel ----
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'myJOBee';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Applications');

    const columns = [
      { header: 'Applicant Name', key: 'name', width: 24 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Application Status', key: 'status', width: 16 },
      { header: 'Applied On', key: 'appliedAt', width: 18 },
      { header: 'Availability', key: 'availability', width: 14 },
      { header: 'Open To Work', key: 'isOpenToWork', width: 14 },
      { header: 'Willing To Relocate', key: 'willingToRelocate', width: 16 },
      { header: 'Experience (months)', key: 'totalExperienceMonths', width: 18 },
      { header: 'Notice Period (days)', key: 'noticePeriodDays', width: 16 },
      { header: 'Profile Completeness (%)', key: 'profileCompleteness', width: 20 },
    ];

    // set widths upfront (column defs only set widths here, header added manually below)
    sheet.columns = columns.map(c => ({ key: c.key, width: c.width }));

    // ---- Row 1: Job title, merged across all columns ----
    const jobTitleRow = sheet.addRow([`Job: ${job.title || job.jobTitle || '—'}`]);
    sheet.mergeCells(1, 1, 1, columns.length);
    jobTitleRow.height = 24;
    jobTitleRow.getCell(1).font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    jobTitleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    jobTitleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };

    // ---- Row 2: actual headers ----
    const headerRow = sheet.addRow(columns.map(c => c.header));
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' },
      };
    });

    // ---- Data rows ----
    enrichedApps.forEach((app) => {
      const applicant = app.applicantId || {};
      const profile = app.profile || {};

      sheet.addRow({
        name: applicant.name || '—',
        phone: applicant.phone || '—',
        email: applicant.email || '—',
        role: applicant.role || '—',
        status: app.status || '—',
        appliedAt: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN') : '—',
        availability: profile.availability || '—',
        isOpenToWork: profile.isOpenToWork ? 'Yes' : 'No',
        willingToRelocate: profile.willingToRelocate ? 'Yes' : 'No',
        totalExperienceMonths: profile.totalExperienceMonths ?? 0,
        noticePeriodDays: profile.noticePeriodDays ?? 0,
        profileCompleteness: profile.profileCompleteness ?? 0,
      });
    });

    // auto-filter on header row (row 2 now, not row 1)
    sheet.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: 2, column: columns.length },
    };

    const safeJobTitle = (job.title || job.jobTitle || 'job').replace(/[^a-z0-9]+/gi, '_');
    const fileName = `applications_${safeJobTitle}_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
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

// POST /api/v1/jobs/pending-vericiation
exports.getPeningJobVerication = async (req, res, next) => {
  try {
    const jobs = await Job.find(
      { status: "paused" },
      { _id: 1, title: 1, employerId: 1 }
    )
      .populate({
        path: "employerId",
        select: "name email"
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });

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
