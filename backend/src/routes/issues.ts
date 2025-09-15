import express from 'express';
import { body, query } from 'express-validator';
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  assignIssue,
  addComment,
  toggleUpvote,
  getUserIssues,
  submitFeedback,
  getIssuesByLocation,
  deleteIssue
} from '../controllers/issueController';
import { 
  authenticateToken, 
  authorizeRoles,
  optionalAuth 
} from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', getAllIssues);
router.get('/location', getIssuesByLocation);
router.get('/:issueId/public', getIssueById);

// Protected routes (authentication required)
router.post('/',
  authenticateToken,
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('category')
      .isIn(['water', 'electricity', 'road', 'waste', 'sewage', 'streetlight', 'public_transport', 'healthcare', 'education', 'other'])
      .withMessage('Invalid category'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority'),
    body('location.address')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body('location.coordinates.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    body('location.coordinates.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    body('media.images')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Maximum 5 images allowed'),
    body('media.videos')
      .optional()
      .isArray({ max: 2 })
      .withMessage('Maximum 2 videos allowed')
  ],
  createIssue
);

router.get('/my-issues', authenticateToken, getUserIssues);

router.get('/',
  optionalAuth,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('category')
      .optional()
      .isIn(['water', 'electricity', 'road', 'waste', 'sewage', 'streetlight', 'public_transport', 'healthcare', 'education', 'other'])
      .withMessage('Invalid category'),
    query('status')
      .optional()
      .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'])
      .withMessage('Invalid status'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'priority', 'status', 'upvotes'])
      .withMessage('Invalid sort field')
  ],
  getAllIssues
);

router.get('/:issueId',
  optionalAuth,
  getIssueById
);

// Issue management routes (Department/Admin only)
router.put('/:issueId/status',
  authenticateToken,
  authorizeRoles('admin', 'department_head', 'field_worker'),
  [
    body('status')
      .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'])
      .withMessage('Invalid status'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Comment cannot exceed 1000 characters'),
    body('estimatedResolution')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format for estimated resolution')
  ],
  updateIssueStatus
);

router.put('/:issueId/assign',
  authenticateToken,
  authorizeRoles('admin', 'department_head'),
  [
    body('assignedDepartment')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID'),
    body('assignedTo')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID')
  ],
  assignIssue
);

// Comment routes
router.post('/:issueId/comments',
  authenticateToken,
  [
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters'),
    body('isOfficial')
      .optional()
      .isBoolean()
      .withMessage('isOfficial must be a boolean')
  ],
  addComment
);

// Voting routes
router.post('/:issueId/upvote',
  authenticateToken,
  toggleUpvote
);

// Feedback routes
router.post('/:issueId/feedback',
  authenticateToken,
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Feedback comment cannot exceed 500 characters')
  ],
  submitFeedback
);

// Admin routes
router.delete('/:issueId',
  authenticateToken,
  deleteIssue
);

// Location-based routes
router.get('/nearby',
  [
    query('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    query('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    query('radius')
      .optional()
      .isFloat({ min: 0.1, max: 50 })
      .withMessage('Radius must be between 0.1 and 50 km')
  ],
  getIssuesByLocation
);

export default router;
