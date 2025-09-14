import express from 'express';
import { query } from 'express-validator';
import {
  getDashboardOverview,
  getIssueStatistics,
  getPerformanceMetrics,
  exportData,
  getTrendingIssues
} from '../controllers/analyticsController';
import { 
  authenticateToken, 
  authorizeRoles 
} from '../middleware/auth';

const router = express.Router();

// Dashboard overview (role-based access)
router.get('/dashboard',
  authenticateToken,
  authorizeRoles('admin', 'department_head', 'department_staff'),
  getDashboardOverview
);

// Issue statistics with filtering
router.get('/issues',
  authenticateToken,
  authorizeRoles('admin', 'department_head', 'department_staff'),
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    query('department')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID'),
    query('category')
      .optional()
      .isIn(['water', 'electricity', 'road', 'waste', 'sewage', 'streetlight', 'public_transport', 'healthcare', 'education', 'other'])
      .withMessage('Invalid category'),
    query('status')
      .optional()
      .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'])
      .withMessage('Invalid status')
  ],
  getIssueStatistics
);

// Performance metrics
router.get('/performance',
  authenticateToken,
  authorizeRoles('admin', 'department_head'),
  [
    query('departmentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
  ],
  getPerformanceMetrics
);

// Trending issues (public access with optional auth)
router.get('/trending',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('timeframe')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('Invalid timeframe. Use 7d, 30d, or 90d')
  ],
  getTrendingIssues
);

// Data export (Admin only)
router.get('/export',
  authenticateToken,
  authorizeRoles('admin'),
  [
    query('format')
      .optional()
      .isIn(['json', 'csv'])
      .withMessage('Invalid format. Use json or csv'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    query('department')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID'),
    query('category')
      .optional()
      .isIn(['water', 'electricity', 'road', 'waste', 'sewage', 'streetlight', 'public_transport', 'healthcare', 'education', 'other'])
      .withMessage('Invalid category'),
    query('status')
      .optional()
      .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'])
      .withMessage('Invalid status'),
    query('includeDetails')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('includeDetails must be true or false')
  ],
  exportData
);

export default router;
