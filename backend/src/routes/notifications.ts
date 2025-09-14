import express from 'express';
import { body, query } from 'express-validator';
import {
  getUserNotifications,
  markNotificationsAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createSystemAnnouncement,
  createCustomNotification,
  getSystemAnnouncements,
  deleteSystemAnnouncement
} from '../controllers/notificationController';
import { 
  authenticateToken, 
  authorizeRoles 
} from '../middleware/auth';

const router = express.Router();

// User notification routes
router.get('/',
  authenticateToken,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('isRead')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('isRead must be true or false'),
    query('type')
      .optional()
      .isIn(['issue_created', 'issue_assigned', 'issue_updated', 'issue_resolved', 'comment_added', 'system_announcement', 'reminder'])
      .withMessage('Invalid notification type')
  ],
  getUserNotifications
);

router.get('/stats',
  authenticateToken,
  getNotificationStats
);

router.put('/mark-read',
  authenticateToken,
  [
    body('notificationIds')
      .isArray({ min: 1 })
      .withMessage('notificationIds must be a non-empty array'),
    body('notificationIds.*')
      .isMongoId()
      .withMessage('Invalid notification ID')
  ],
  markNotificationsAsRead
);

router.put('/mark-all-read',
  authenticateToken,
  markAllAsRead
);

router.delete('/:notificationId',
  authenticateToken,
  deleteNotification
);

// Admin/Department Head notification management
router.post('/custom',
  authenticateToken,
  authorizeRoles('admin', 'department_head'),
  [
    body('recipients')
      .isArray({ min: 1 })
      .withMessage('recipients must be a non-empty array'),
    body('recipients.*')
      .isMongoId()
      .withMessage('Invalid recipient ID'),
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('type')
      .optional()
      .isIn(['issue_created', 'issue_assigned', 'issue_updated', 'issue_resolved', 'comment_added', 'system_announcement', 'reminder'])
      .withMessage('Invalid notification type'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('channels')
      .optional()
      .isArray()
      .withMessage('channels must be an array'),
    body('channels.*')
      .optional()
      .isIn(['app', 'email', 'sms', 'push'])
      .withMessage('Invalid notification channel'),
    body('relatedIssue')
      .optional()
      .isMongoId()
      .withMessage('Invalid issue ID'),
    body('relatedDepartment')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID'),
    body('scheduledFor')
      .optional()
      .isISO8601()
      .withMessage('Invalid scheduled date format'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiry date format')
  ],
  createCustomNotification
);

// System announcement routes (Admin only)
router.post('/system-announcement',
  authenticateToken,
  authorizeRoles('admin'),
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('channels')
      .optional()
      .isArray()
      .withMessage('channels must be an array'),
    body('channels.*')
      .optional()
      .isIn(['app', 'email', 'sms', 'push'])
      .withMessage('Invalid notification channel'),
    body('targetRoles')
      .optional()
      .isArray()
      .withMessage('targetRoles must be an array'),
    body('targetRoles.*')
      .optional()
      .isIn(['admin', 'department_head', 'department_staff', 'citizen'])
      .withMessage('Invalid target role'),
    body('targetDepartments')
      .optional()
      .isArray()
      .withMessage('targetDepartments must be an array'),
    body('targetDepartments.*')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID'),
    body('scheduledFor')
      .optional()
      .isISO8601()
      .withMessage('Invalid scheduled date format'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiry date format')
  ],
  createSystemAnnouncement
);

router.get('/system-announcements',
  authenticateToken,
  authorizeRoles('admin'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  getSystemAnnouncements
);

router.delete('/system-announcements/:announcementId',
  authenticateToken,
  authorizeRoles('admin'),
  deleteSystemAnnouncement
);

export default router;
