const { Router } = require('express');
const { body } = require('express-validator');
const { AuthController } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = Router();

// Validation middleware for profile update
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),

  body('address.pincode')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Please provide a valid 6-digit pincode')
];

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile (alias for /auth/me)
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getMe);

/**
 * @route   PATCH /api/users/profile
 * @desc    Update user profile (alias for /auth/profile)
 * @access  Private
 */
router.patch('/profile', authenticateToken, updateProfileValidation, AuthController.updateProfile);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, AuthController.getUserStats);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/avatar', authenticateToken, upload.single('avatar'), AuthController.uploadAvatar);

module.exports = router;