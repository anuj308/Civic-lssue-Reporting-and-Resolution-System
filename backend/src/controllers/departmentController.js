const { validationResult } = require('express-validator');
const Department = require('../models/Department');

// GET /api/departments
exports.list = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      category,
    } = req.query;

    const filter = {};
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';
    if (category) filter.categories = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Department.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)).lean(),
      Department.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/departments/:id
exports.getById = async (req, res, next) => {
  try {
    const dep = await Department.findById(req.params.id).lean();
    if (!dep) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dep });
  } catch (err) {
    next(err);
  }
};

// POST /api/departments
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const {
      name,
      code,
      description,
      contactEmail,
      contactPhone,
      categories = [],
      priority = 3,
      responseTime,
      workingHours,
      location,
    } = req.body;

    const dep = await Department.create({
      name,
      code,
      description,
      contactEmail,
      contactPhone,
      isActive: true,
      categories,
      priority,
      responseTime,
      workingHours,
      location,
    });

    res.status(201).json({ success: true, message: 'Department created', data: dep });
  } catch (err) {
    // Handle duplicate key (e.g., unique code/email) gracefully
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate value', details: err.keyValue });
    }
    next(err);
  }
};

// PATCH /api/departments/:id
exports.update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const update = req.body || {};
    const dep = await Department.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!dep) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department updated', data: dep });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate value', details: err.keyValue });
    }
    next(err);
  }
};

// DELETE /api/departments/:id (soft delete -> isActive=false)
exports.remove = async (req, res, next) => {
  try {
    const dep = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).lean();

    if (!dep) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department deactivated', data: dep });
  } catch (err) {
    next(err);
  }
};