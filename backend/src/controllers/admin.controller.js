const { Settings, FormField, Category, CMSPage, OnboardingScreen, FAQ, SubscriptionPlan ,HomeSlider} = require('../models/admin.model');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ===== SETTINGS =====

exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await Settings.find({ isPublic: true });
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json({ success: true, data: map });
  } catch (error) { next(error); }
};

exports.getAllSettings = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const settings = await Settings.find(filter).sort({ category: 1, key: 1 });
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};

exports.upsertSetting = async (req, res, next) => {
  try {
    const { key, value, type, category, description, isPublic } = req.body;
    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value, type, category, description, isPublic, updatedBy: req.user.userId, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: setting });
  } catch (error) { next(error); }
};

exports.bulkUpdateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body; // array of { key, value }
    const ops = settings.map(s => ({
      updateOne: {
        filter: { key: s.key },
        update: { $set: { value: s.value, updatedBy: req.user.userId, updatedAt: new Date() } },
        upsert: true
      }
    }));
    await Settings.bulkWrite(ops);
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) { next(error); }
};

// ===== DYNAMIC FORM FIELDS =====

exports.getFormFields = async (req, res, next) => {
  try {
    const { formType, assignedTo, isActive = true } = req.query;
    const filter = {};
    if (formType) filter.formType = formType;
    if (assignedTo) filter.assignedTo = { $in: [assignedTo, 'all'] };
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;

    const fields = await FormField.find(filter).sort({ section: 1, order: 1 });
    res.json({ success: true, data: fields });
  } catch (error) { next(error); }
};

exports.createFormField = async (req, res, next) => {
  try {
    const field = await FormField.create({ ...req.body, createdBy: req.user.userId });
    res.status(201).json({ success: true, data: field });
  } catch (error) { next(error); }
};

exports.updateFormField = async (req, res, next) => {
  try {
    const field = await FormField.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!field) throw new AppError('Field not found', 404);
    res.json({ success: true, data: field });
  } catch (error) { next(error); }
};

exports.deleteFormField = async (req, res, next) => {
  try {
    await FormField.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Field deactivated' });
  } catch (error) { next(error); }
};

exports.reorderFormFields = async (req, res, next) => {
  try {
    const { fields } = req.body; // [{ id, order }]
    const ops = fields.map(f => ({
      updateOne: { filter: { _id: f.id }, update: { $set: { order: f.order } } }
    }));
    await FormField.bulkWrite(ops);
    res.json({ success: true, message: 'Fields reordered' });
  } catch (error) { next(error); }
};

// ===== CATEGORIES =====

exports.getCategories = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = isActive !== undefined ? { isActive: isActive === 'true' } : {};
    const categories = await Category.find(filter).sort({ order: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, image, description, parentId, order } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const category = await Category.create({ name, slug, icon, image, description, parentId, order });
    res.status(201).json({ success: true, data: category });
  } catch (error) { next(error); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) throw new AppError('Category not found', 404);
    res.json({ success: true, data: category });
  } catch (error) { next(error); }
};

// ===== CMS PAGES =====

exports.getCMSPage = async (req, res, next) => {
  try {
    const page = await CMSPage.findOne({ slug: req.params.slug, isActive: true });
    if (!page) throw new AppError('Page not found', 404);
    res.json({ success: true, data: page });
  } catch (error) { next(error); }
};

exports.upsertCMSPage = async (req, res, next) => {
  try {
    const { slug, title, content } = req.body;
    const page = await CMSPage.findOneAndUpdate(
      { slug },
      { slug, title, content, updatedBy: req.user.userId, $inc: { version: 1 } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: page });
  } catch (error) { next(error); }
};

exports.listCMSPages = async (req, res, next) => {
  try {
    const pages = await CMSPage.find().select('slug title isActive version updatedAt').sort({ slug: 1 });
    res.json({ success: true, data: pages });
  } catch (error) { next(error); }
};

// ===== ONBOARDING =====

exports.getOnboarding = async (req, res, next) => {
  try {
    const screens = await OnboardingScreen
      .find({ isActive: true })
      .sort({ order: 1 });

    const data = screens.map(screen => {
      const item = screen.toObject();

      if (item.image) {
        item.image = `${process.env.BASE_URL}${item.image}`;
      }

      return item;
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
exports.createOnboarding = async (req, res, next) => {
  try {
    const {
      title,
      description,
      order,
      isActive,
    } = req.body;

    const image =
      req.uploadedFiles?.onboardImage ||
      null;


    const screen = await OnboardingScreen.create({
      title,
      description,
      image,
      order,
      isActive,
    });

    res.status(201).json({
      success: true,
      data: screen,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOnboarding = async (req, res, next) => {
  try {
    const screen = await OnboardingScreen.findById(req.params.id);


    if (!screen) {
      throw new AppError("Onboarding screen not found", 404);
    }

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      order: req.body.order,
      isActive: req.body.isActive,
    };

    const image = req.uploadedFiles?.onboardImage;

    if (image) {
      updateData.image = image;
    }

    const updated = await OnboardingScreen.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
exports.deleteOnboarding = async (req, res, next) => {
  try {
    const screen = await OnboardingScreen.findById(req.params.id);

    if (!screen) {
      throw new AppError("Onboarding screen not found", 404);
    }

    await screen.deleteOne();

    res.json({
      success: true,
      message: "Onboarding screen deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ===== FAQ =====

exports.getFAQs = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const faqs = await FAQ.find(filter).sort({ order: 1 });
    res.json({ success: true, data: faqs });
  } catch (error) { next(error); }
};

exports.createFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.create(req.body);
    res.status(201).json({ success: true, data: faq });
  } catch (error) { next(error); }
};

exports.updateFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faq) throw new AppError('FAQ not found', 404);
    res.json({ success: true, data: faq });
  } catch (error) { next(error); }
};

exports.deleteFAQ = async (req, res, next) => {
  try {
    await FAQ.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (error) { next(error); }
};

// ===== SUBSCRIPTION PLANS =====

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: plans });
  } catch (error) { next(error); }
};

exports.upsertPlan = async (req, res, next) => {
  try {
    const { slug } = req.body;
    const plan = await SubscriptionPlan.findOneAndUpdate({ slug }, req.body, { upsert: true, new: true });
    res.json({ success: true, data: plan });
  } catch (error) { next(error); }
};


exports.getHomeSliders = async (req, res, next) => {
  try {
    const sliders = await HomeSlider.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 });

    const IMAGE_IP = process.env.IMAGE_IP;

    const data = sliders.map((s) => {
      const obj = s.toObject();

      return {
        ...obj,
        image: obj.image
          ? `${IMAGE_IP}${obj.image}`
          : null,
      };
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
exports.getHomeSlider = async (req, res, next) => {
  try {
    const slider = await HomeSlider.findById(req.params.id);

    if (!slider) {
      throw new AppError('Slider not found', 404);
    }

    res.json({
      success: true,
      data: slider,
    });
  } catch (error) {
    next(error);
  }
};
exports.createHomeSlider = async (req, res, next) => {
  try {
    const image = req.uploadedFiles?.image;

    if (!image) {
      throw new AppError('Image is required', 400);
    }

    const slider = await HomeSlider.create({
      title: req.body.title,
      subtitle: req.body.subtitle,
      image,
      redirectType: req.body.redirectType || 'none',
      redirectValue: req.body.redirectValue,
      isActive: req.body.isActive ?? true,
      order: req.body.order || 0,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      data: slider,
    });
  } catch (error) {
    next(error);
  }
};
exports.updateHomeSlider = async (req, res, next) => {
  try {
    const slider = await HomeSlider.findById(req.params.id);

    if (!slider) {
      throw new AppError('Slider not found', 404);
    }

    const image = req.uploadedFiles?.image;

    const updateData = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      redirectType: req.body.redirectType,
      redirectValue: req.body.redirectValue,
      isActive: req.body.isActive,
      order: req.body.order,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    };

    // only update image if new one uploaded
    if (image) {
      updateData.image = image;
    }

    const updated = await HomeSlider.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
exports.deleteHomeSlider = async (req, res, next) => {
  try {
    const slider = await HomeSlider.findById(req.params.id);

    if (!slider) {
      throw new AppError('Slider not found', 404);
    }

    await slider.deleteOne();

    res.json({
      success: true,
      message: 'Slider deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};