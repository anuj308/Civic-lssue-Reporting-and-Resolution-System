const express = require('express');
const { body } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const controller = require('../controllers/adminAuthController');

const router = express.Router();

// Signup
router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('username').optional().isString().trim().isLength({ min: 3, max: 30 }).matches(/^[a-z0-9._-]+$/),
    body('password').isLength({ min: 8 }),
  ],
  controller.signup
);

// Login with email or username
router.post(
  '/login',
  [
    body('identifier').isString().trim().notEmpty(), // email or username
    body('password').isString().notEmpty(),
  ],
  controller.login
);

// Current admin profile (requires Bearer token)
router.get('/me', adminAuth, controller.me);

// Optional access token refresh (uses httpOnly cookie or body.refreshToken)
router.post('/refresh', controller.refresh);

module.exports = router;