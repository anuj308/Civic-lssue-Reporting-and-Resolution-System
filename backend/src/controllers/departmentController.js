const { validationResult } = require('express-validator');
// FIX: destructure the model export
const { Department } = require('../models/Department');
const { Issue } = require('../models/Issue');

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

// List issues for the authenticated department (GET /api/departments/me/issues)
exports.listMyIssues = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search,
    } = req.query;

    const filter = { assignedDepartment: req.user.departmentId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Issue.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Issue.countDocuments(filter),
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

// Update issue status by department (PATCH /api/departments/issues/:issueId/status)
exports.updateIssueStatus = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { status } = req.body;

    const issue = await Issue.findOne({ _id: issueId, assignedDepartment: req.user.departmentId });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found for this department' });

    // Update status and timeline
    issue.status = status;
    const now = new Date();
    if (status === 'acknowledged') issue.timeline.acknowledged = now;
    if (status === 'in_progress') issue.timeline.started = now;
    if (status === 'resolved') issue.timeline.resolved = now;
    if (status === 'closed') issue.timeline.closed = now;

    await issue.save();
    res.json({ success: true, message: 'Issue status updated', data: issue.toObject() });
  } catch (err) {
    next(err);
  }
};

// Resolve issue with details (POST /api/departments/issues/:issueId/resolve)
exports.resolveIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { description, images = [], cost, resources = [] } = req.body;

    const issue = await Issue.findOne({ _id: issueId, assignedDepartment: req.user.departmentId });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found for this department' });

    issue.status = 'resolved';
    issue.timeline.resolved = new Date();
    issue.resolution = {
      description,
      images,
      cost,
      resources,
      // resolvedBy could be department account user, but Issue.resolvedBy is ref User (optional)
      resolvedBy: req.user._id,
    };

    await issue.save();
    res.json({ success: true, message: 'Issue marked as resolved', data: issue.toObject() });
  } catch (err) {
    next(err);
  }
};