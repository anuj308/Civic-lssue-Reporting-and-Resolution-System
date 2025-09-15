import express from 'express';
import { body, query } from 'express-validator';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  addStaff,
  removeStaff,
  getDepartmentStatistics,
  getDepartmentIssues,
  deleteDepartment
} from '../controllers/departmentController';
import { 
  authenticateToken, 
  authorizeRoles 
} from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getAllDepartments);
router.get('/:departmentId', getDepartmentById);
router.get('/:departmentId/statistics', getDepartmentStatistics);

// Protected routes (Admin only)
router.post('/',
  authenticateToken,
  authorizeRoles('admin'),
  [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Department name must be between 3 and 100 characters'),
    body('type')
      .isIn(['municipal', 'state', 'federal', 'utility', 'emergency', 'health', 'education', 'transport'])
      .withMessage('Invalid department type'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('head')
      .optional()
      .isMongoId()
      .withMessage('Invalid head user ID'),
    body('contactInfo.phone')
      .optional()
      .matches(/^[+]?[1-9][\d]{1,14}$/)
      .withMessage('Please provide a valid phone number'),
    body('contactInfo.email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('contactInfo.address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters'),
    body('categories')
      .optional()
      .isArray()
      .withMessage('Categories must be an array'),
    body('categories.*')
      .optional()
      .isIn(['water', 'electricity', 'road', 'waste', 'sewage', 'streetlight', 'public_transport', 'healthcare', 'education', 'other'])
      .withMessage('Invalid category'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  createDepartment
);

router.put('/:departmentId',
  authenticateToken,
  authorizeRoles('admin', 'department_head'),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Department name must be between 3 and 100 characters'),
    body('type')
      .optional()
      .isIn(['municipal', 'state', 'federal', 'utility', 'emergency', 'health', 'education', 'transport'])
      .withMessage('Invalid department type'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('head')
      .optional()
      .isMongoId()
      .withMessage('Invalid head user ID'),
    body('contactInfo.phone')
      .optional()
      .matches(/^[+]?[1-9][\d]{1,14}$/)
      .withMessage('Please provide a valid phone number'),
    body('contactInfo.email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('contactInfo.address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters'),
    body('categories')
      .optional()
      .isArray()
      .withMessage('Categories must be an array'),
    body('categories.*')
      .optional()
      .isIn(['water', 'electricity', 'road', 'waste', 'sewage', 'streetlight', 'public_transport', 'healthcare', 'education', 'other'])
      .withMessage('Invalid category'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  updateDepartment
);

// Staff management routes
router.post('/:departmentId/staff',
  authenticateToken,
  authorizeRoles('admin', 'department_head'),
  [
    body('userId')
      .isMongoId()
      .withMessage('Invalid user ID')
  ],
  addStaff
);

router.delete('/:departmentId/staff/:userId',
  authenticateToken,
  authorizeRoles('admin', 'department_head'),
  removeStaff
);

// Department issues
router.get('/:departmentId/issues',
  authenticateToken,
  authorizeRoles('admin', 'department_head', 'field_worker'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'])
      .withMessage('Invalid status'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority')
  ],
  getDepartmentIssues
);

// Delete department (Admin only)
router.delete('/:departmentId',
  authenticateToken,
  authorizeRoles('admin'),
  deleteDepartment
);

export default router;
