const express = require('express');
const { param, body, query } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const { authenticateToken } = require('../middleware/auth');
const ensureDepartment = require('../middleware/departmentAuth');
const controller = require('../controllers/departmentController');

const router = express.Router();

// List departments (public for now)
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('isActive').optional().isBoolean().toBoolean(),
    query('search').optional().isString().trim(),
    query('category').optional().isString().trim(),
  ],
  controller.list
);

// Get one department (public for now)
router.get(
  '/:id',
  [param('id').isMongoId()],
  controller.getById
);

// Create department (admin only)
router.post(
  '/',
  adminAuth,
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('code').trim().isLength({ min: 2, max: 20 }).toUpperCase(),
    body('description').optional().isString().trim().isLength({ max: 1000 }),
    body('contactEmail').isEmail().normalizeEmail(),
    body('contactPhone').optional().isString().trim().isLength({ max: 30 }),
    body('categories').isArray().withMessage('categories must be an array'),
    body('categories.*').isString().trim(),
    body('priority').optional().isInt({ min: 1, max: 5 }).toInt(),
    body('responseTime').optional().isObject(),
    body('responseTime.acknowledgeHours').optional().isInt({ min: 0 }).toInt(),
    body('responseTime.resolveHours').optional().isInt({ min: 0 }).toInt(),
    body('workingHours').optional().isObject(),
    body('workingHours.days').optional().isArray(),
    body('workingHours.days.*').optional().isString(),
    body('workingHours.start').optional().isString(),
    body('workingHours.end').optional().isString(),
    body('location').optional().isObject(),
    body('location.address').optional().isString().trim(),
    body('location.point').optional().isObject(),
    body('location.point.type').optional().isIn(['Point']),
    body('location.point.coordinates').optional().isArray({ min: 2, max: 2 }),
    body('location.point.coordinates.*').optional().isFloat(),
  ],
  controller.create
);

// Update department (admin only)
router.patch(
  '/:id',
  adminAuth,
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('code').optional().trim().isLength({ min: 2, max: 20 }).toUpperCase(),
    body('description').optional().isString().trim().isLength({ max: 1000 }),
    body('contactEmail').optional().isEmail().normalizeEmail(),
    body('contactPhone').optional().isString().trim().isLength({ max: 30 }),
    body('categories').optional().isArray(),
    body('categories.*').optional().isString().trim(),
    body('priority').optional().isInt({ min: 1, max: 5 }).toInt(),
    body('responseTime').optional().isObject(),
    body('responseTime.acknowledgeHours').optional().isInt({ min: 0 }).toInt(),
    body('responseTime.resolveHours').optional().isInt({ min: 0 }).toInt(),
    body('workingHours').optional().isObject(),
    body('workingHours.days').optional().isArray(),
    body('workingHours.days.*').optional().isString(),
    body('workingHours.start').optional().isString(),
    body('workingHours.end').optional().isString(),
    body('location').optional().isObject(),
    body('location.address').optional().isString().trim(),
    body('location.point').optional().isObject(),
    body('location.point.type').optional().isIn(['Point']),
    body('location.point.coordinates').optional().isArray({ min: 2, max: 2 }),
    body('location.point.coordinates.*').optional().isFloat(),
    body('isActive').optional().isBoolean().toBoolean(),
  ],
  controller.update
);

// Soft delete (deactivate) department (admin only)
router.delete(
  '/:id',
  adminAuth,
  [param('id').isMongoId()],
  controller.remove
);

// Department account: list my issues
router.get(
  '/me/issues',
  authenticateToken,
  ensureDepartment,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected']),
    query('category').optional().isString().trim(),
    query('search').optional().isString().trim(),
  ],
  controller.listMyIssues
);

// Department account: update an issue status
router.patch(
  '/issues/:issueId/status',
  authenticateToken,
  ensureDepartment,
  [
    param('issueId').isMongoId(),
    body('status').isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected']),
  ],
  controller.updateIssueStatus
);

// Department account: resolve an issue with details
router.post(
  '/issues/:issueId/resolve',
  authenticateToken,
  ensureDepartment,
  [
    param('issueId').isMongoId(),
    body('description').isString().trim().isLength({ min: 5 }),
    body('images').optional().isArray(),
    body('images.*').optional().isString(),
    body('cost').optional().isFloat({ min: 0 }).toFloat(),
    body('resources').optional().isArray(),
    body('resources.*').optional().isString(),
  ],
  controller.resolveIssue
);

module.exports = router;