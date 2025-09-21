const { Router } = require('express');
const { body, param, query } = require('express-validator');
const { IssueController } = require('../controllers/issueController');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

// Validation middleware for issue creation
const createIssueValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .isIn([
      'pothole', 'streetlight', 'garbage', 'water_supply', 'sewerage',
      'traffic', 'park_maintenance', 'road_maintenance', 'electrical',
      'construction', 'noise_pollution', 'air_pollution', 'water_pollution',
      'stray_animals', 'illegal_parking', 'illegal_construction',
      'public_transport', 'healthcare', 'education', 'other'
    ])
    .withMessage('Invalid category'),
  
  body('subcategory')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subcategory cannot exceed 100 characters'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  
  body('location.address')
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage('Address must be between 5 and 300 characters'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('location.pincode')
    .matches(/^\d{6}$/)
    .withMessage('Please provide a valid 6-digit pincode'),
  
  body('location.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.landmark')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Landmark cannot exceed 100 characters'),
  
  body('media.images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('media.videos')
    .optional()
    .isArray()
    .withMessage('Videos must be an array'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// Validation for issue ID parameter
const issueIdValidation = [
  param('issueId')
    .isMongoId()
    .withMessage('Invalid issue ID format')
];

// Validation for status update
const updateStatusValidation = [
  ...issueIdValidation,
  body('status')
    .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'])
    .withMessage('Invalid status'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// Validation for nearby issues query
const nearbyIssuesValidation = [
  query('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  query('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  query('radius')
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage('Radius must be between 100 and 50000 meters')
];

/**
 * @route   POST /api/issues
 * @desc    Create a new issue
 * @access  Private (Authenticated users)
 */
router.post('/', authenticateToken, createIssueValidation, IssueController.createIssue);

/**
 * @route   GET /api/issues/my
 * @desc    Get current user's issues
 * @access  Private (Authenticated users)
 */
router.get('/my', authenticateToken, IssueController.getMyIssues);

/**
 * @route   GET /api/issues/public
 * @desc    Get all public issues
 * @access  Public
 */
router.get('/public', IssueController.getPublicIssues);

/**
 * @route   GET /api/issues/nearby
 * @desc    Get nearby issues based on location
 * @access  Public
 */
router.get('/nearby', nearbyIssuesValidation, IssueController.getNearbyIssues);

/**
 * @route   GET /api/issues/:issueId
 * @desc    Get issue by ID
 * @access  Public (but respects privacy settings)
 */
router.get('/:issueId', issueIdValidation, IssueController.getIssueById);

/**
 * @route   PUT /api/issues/:issueId/status
 * @desc    Update issue status
 * @access  Private (Issue reporter or authorized users)
 */
router.put('/:issueId/status', authenticateToken, updateStatusValidation, IssueController.updateIssueStatus);

/**
 * @route   DELETE /api/issues/:issueId
 * @desc    Delete issue (only pending issues by reporter)
 * @access  Private (Issue reporter only)
 */
router.delete('/:issueId', authenticateToken, issueIdValidation, IssueController.deleteIssue);

/**
 * @route   POST /api/issues/test-cloudinary
 * @desc    Test Cloudinary image upload
 * @access  Private (for testing only)
 */
router.post('/test-cloudinary', authenticateToken, async (req, res) => {
  try {
    const { uploadImage } = require('../utils/cloudinaryService');
    
    // Test with a simple base64 image (1x1 pixel red image)
    const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const result = await uploadImage(testBase64, {
      folder: 'civic-issues/test',
      public_id: `test_${Date.now()}`
    });
    
    res.json({
      success: true,
      message: 'Cloudinary test successful',
      data: result
    });
  } catch (error) {
    console.error('❌ Cloudinary test error:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary test failed',
      error: error.message
    });
  }
});

module.exports = router;