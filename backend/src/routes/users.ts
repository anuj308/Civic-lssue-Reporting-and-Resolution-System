import express from 'express';
import { body } from 'express-validator';
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  updateUserRole,
  deleteOwnProfile
} from '../controllers/userController';
import { 
  authenticateToken, 
  authorizeRoles,
  authorizeOwnerOrAdmin 
} from '../middleware/auth';

const router = express.Router();

// User profile routes
router.get('/profile', authenticateToken, getProfile);

router.put('/profile', 
  authenticateToken,
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('phone')
      .optional()
      .matches(/^[+]?[1-9][\d]{1,14}$/)
      .withMessage('Please provide a valid phone number'),
    body('address.street')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Street address cannot exceed 100 characters'),
    body('address.city')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('City cannot exceed 50 characters'),
    body('address.state')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('State cannot exceed 50 characters'),
    body('address.pincode')
      .optional()
      .matches(/^[1-9][0-9]{5}$/)
      .withMessage('Please provide a valid 6-digit pincode')
  ],
  updateProfile
);

router.put('/change-password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  changePassword
);

// Delete own profile
router.delete('/profile',
  authenticateToken,
  deleteOwnProfile
);

// Admin-only routes for user management
router.get('/',
  authenticateToken,
  authorizeRoles('admin'),
  getAllUsers
);

router.get('/:userId',
  authenticateToken,
  authorizeOwnerOrAdmin,
  getUserById
);

router.put('/:userId/status',
  authenticateToken,
  authorizeRoles('admin'),
  [
    body('isActive')
      .isBoolean()
      .withMessage('isActive must be a boolean value')
  ],
  updateUserStatus
);

router.put('/:userId/role',
  authenticateToken,
  authorizeRoles('admin'),
  [
    body('role')
      .isIn(['admin', 'department_head', 'field_worker', 'citizen'])
      .withMessage('Invalid role specified'),
    body('department')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID')
  ],
  updateUserRole
);

router.delete('/:userId',
  authenticateToken,
  authorizeRoles('admin'),
  deleteUser
);

export default router;
