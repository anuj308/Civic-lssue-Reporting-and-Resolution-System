import express from 'express';
import { body, query } from 'express-validator';
import { auth, authorize } from '../middleware/auth';
import {
  getSystemOverview,
  getSystemLogs,
  bulkUserOperations,
  updateSystemConfig,
  generateSystemReport,
  performMaintenance
} from '../controllers/adminController';

const router = express.Router();

/**
 * @route GET /api/admin/overview
 * @desc Get system overview and statistics
 * @access Admin only
 */
router.get('/overview',
  auth,
  authorize(['admin']),
  getSystemOverview
);

/**
 * @route GET /api/admin/logs
 * @desc Get system logs and audit trail
 * @access Admin only
 */
router.get('/logs',
  auth,
  authorize(['admin']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    query('action')
      .optional()
      .isLength({ min: 1 })
      .withMessage('Action filter cannot be empty')
  ],
  getSystemLogs
);

/**
 * @route POST /api/admin/users/bulk
 * @desc Perform bulk operations on users
 * @access Admin only
 */
router.post('/users/bulk',
  auth,
  authorize(['admin']),
  [
    body('operation')
      .isIn(['activate', 'deactivate', 'delete', 'update_role'])
      .withMessage('Invalid operation. Must be activate, deactivate, delete, or update_role'),
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('User IDs must be a non-empty array'),
    body('userIds.*')
      .isMongoId()
      .withMessage('Each user ID must be a valid MongoDB ObjectId'),
    body('data.role')
      .if(body('operation').equals('update_role'))
      .isIn(['user', 'department_head', 'department_staff', 'admin'])
      .withMessage('Invalid role'),
    body('data.department')
      .if(body('operation').equals('update_role'))
      .if(body('data.role').custom((value, { req }) => {
        return req.body.data?.role?.includes('department');
      }))
      .isMongoId()
      .withMessage('Department ID must be valid when updating to department role')
  ],
  bulkUserOperations
);

/**
 * @route PUT /api/admin/config
 * @desc Update system configuration
 * @access Admin only
 */
router.put('/config',
  auth,
  authorize(['admin']),
  [
    body('maintenanceMode')
      .optional()
      .isBoolean()
      .withMessage('Maintenance mode must be a boolean'),
    body('registrationEnabled')
      .optional()
      .isBoolean()
      .withMessage('Registration enabled must be a boolean'),
    body('maxFileSize')
      .optional()
      .isInt({ min: 1024, max: 50 * 1024 * 1024 })
      .withMessage('Max file size must be between 1KB and 50MB'),
    body('allowedFileTypes')
      .optional()
      .isArray()
      .withMessage('Allowed file types must be an array'),
    body('allowedFileTypes.*')
      .optional()
      .isLength({ min: 1 })
      .withMessage('File type cannot be empty'),
    body('notificationSettings')
      .optional()
      .isObject()
      .withMessage('Notification settings must be an object'),
    body('notificationSettings.emailEnabled')
      .optional()
      .isBoolean()
      .withMessage('Email enabled must be a boolean'),
    body('notificationSettings.smsEnabled')
      .optional()
      .isBoolean()
      .withMessage('SMS enabled must be a boolean'),
    body('notificationSettings.pushEnabled')
      .optional()
      .isBoolean()
      .withMessage('Push notifications enabled must be a boolean'),
    body('autoAssignmentRules')
      .optional()
      .isObject()
      .withMessage('Auto assignment rules must be an object'),
    body('autoAssignmentRules.enabled')
      .optional()
      .isBoolean()
      .withMessage('Auto assignment enabled must be a boolean'),
    body('autoAssignmentRules.criteria')
      .optional()
      .isArray()
      .withMessage('Auto assignment criteria must be an array')
  ],
  updateSystemConfig
);

/**
 * @route GET /api/admin/reports
 * @desc Generate and download system reports
 * @access Admin only
 */
router.get('/reports',
  auth,
  authorize(['admin']),
  [
    query('reportType')
      .isIn(['user_activity', 'issue_summary', 'department_performance'])
      .withMessage('Invalid report type'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    query('format')
      .optional()
      .isIn(['json', 'csv'])
      .withMessage('Format must be json or csv'),
    query('startDate')
      .if(query('endDate').exists())
      .custom((startDate, { req }) => {
        const endDate = req.query.endDate as string;
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
          throw new Error('Start date must be before end date');
        }
        return true;
      })
  ],
  generateSystemReport
);

/**
 * @route POST /api/admin/maintenance
 * @desc Perform system maintenance operations
 * @access Admin only
 */
router.post('/maintenance',
  auth,
  authorize(['admin']),
  [
    body('operation')
      .isIn(['cleanup_old_notifications', 'update_issue_statistics', 'reindex_search'])
      .withMessage('Invalid maintenance operation')
  ],
  performMaintenance
);

export default router;
