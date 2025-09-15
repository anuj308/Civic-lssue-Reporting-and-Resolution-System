import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Validation middleware for registration
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  
  body('role')
    .optional()
    .isIn(['citizen', 'admin', 'department_head', 'field_worker'])
    .withMessage('Invalid role'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name cannot exceed 100 characters'),
  
  body('address.pincode')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Please provide a valid 6-digit pincode'),
  
  body('address.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('address.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

// Validation middleware for login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation middleware for OTP verification
const otpVerificationValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('otpCode')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
];

// Validation middleware for OTP resend
const otpResendValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, AuthController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear cookies)
 * @access  Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and activate user account
 * @access  Public
 */
router.post('/verify-otp', otpVerificationValidation, AuthController.verifyOTP);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP for user verification
 * @access  Public
 */
router.post('/resend-otp', otpResendValidation, AuthController.resendOTP);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires refresh token in cookies)
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify authentication status
 * @access  Private
 */
router.get('/verify', authenticateToken, AuthController.verifyAuth);

/**
 * @route   GET /api/auth/admin-only
 * @desc    Test route for admin-only access
 * @access  Private (Admin only)
 */
router.get('/admin-only', 
  authenticateToken, 
  authorizeRoles('admin'), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Admin access granted',
      data: {
        user: req.user?.toJSON(),
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * @route   GET /api/auth/department-only
 * @desc    Test route for department head and admin access
 * @access  Private (Department head and Admin only)
 */
router.get('/department-only',
  authenticateToken,
  authorizeRoles('admin', 'department_head'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Department access granted',
      data: {
        user: req.user?.toJSON(),
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * @route   GET /api/auth/staff-only
 * @desc    Test route for staff (department head, field worker, admin) access
 * @access  Private (Staff only)
 */
router.get('/staff-only',
  authenticateToken,
  authorizeRoles('admin', 'department_head', 'field_worker'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Staff access granted',
      data: {
        user: req.user?.toJSON(),
        timestamp: new Date().toISOString()
      }
    });
  }
);

export default router;
