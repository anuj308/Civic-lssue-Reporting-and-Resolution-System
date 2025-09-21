const express = require('express');
const { SessionController } = require('../controllers/sessionController');
const { SecurityAlertController } = require('../controllers/securityAlertController');
const { auth } = require('../middleware/auth');
const router = express.Router();

/**
 * Session Management Routes
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(auth);

// Apply session middleware for activity tracking
router.use(SessionController.attachSessionInfo);
router.use(SessionController.updateActivity);

// ================================
// SESSION MANAGEMENT ROUTES
// ================================

/**
 * @route   GET /api/sessions/my-sessions
 * @desc    Get all active sessions for the authenticated user
 * @access  Private
 */
router.get('/my-sessions', SessionController.getMySessions);

/**
 * @route   GET /api/sessions/security-overview
 * @desc    Get comprehensive security overview for the user
 * @access  Private
 */
router.get('/security-overview', SessionController.getSecurityOverview);

/**
 * @route   GET /api/sessions/:sessionId/details
 * @desc    Get detailed information about a specific session
 * @access  Private
 */
router.get('/:sessionId/details', SessionController.getSessionDetails);

/**
 * @route   DELETE /api/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/:sessionId', SessionController.revokeSession);

/**
 * @route   POST /api/sessions/revoke-all
 * @desc    Revoke all sessions except the current one
 * @access  Private
 */
router.post('/revoke-all', SessionController.revokeAllSessions);

/**
 * @route   PATCH /api/sessions/security-settings
 * @desc    Update user security settings
 * @access  Private
 */
router.patch('/security-settings', SessionController.updateSecuritySettings);

/**
 * @route   POST /api/sessions/report-suspicious
 * @desc    Report suspicious activity for a session
 * @access  Private
 */
router.post('/report-suspicious', SessionController.reportSuspiciousActivity);

// ================================
// SECURITY ALERT ROUTES
// ================================

/**
 * @route   GET /api/sessions/security/alerts
 * @desc    Get user's security alerts with filtering and pagination
 * @access  Private
 * @query   page, limit, severity, status, type, unreadOnly
 */
router.get('/security/alerts', SecurityAlertController.getAlerts);

/**
 * @route   GET /api/sessions/security/alerts/stats
 * @desc    Get security alert statistics and analytics
 * @access  Private
 * @query   days (default: 30)
 */
router.get('/security/alerts/stats', SecurityAlertController.getAlertStats);

/**
 * @route   GET /api/sessions/security/alerts/:alertId
 * @desc    Get detailed information about a specific alert
 * @access  Private
 */
router.get('/security/alerts/:alertId', SecurityAlertController.getAlertDetails);

/**
 * @route   PATCH /api/sessions/security/alerts/:alertId/acknowledge
 * @desc    Mark a security alert as acknowledged
 * @access  Private
 */
router.patch('/security/alerts/:alertId/acknowledge', SecurityAlertController.acknowledgeAlert);

/**
 * @route   PATCH /api/sessions/security/alerts/:alertId/dismiss
 * @desc    Mark a security alert as dismissed
 * @access  Private
 */
router.patch('/security/alerts/:alertId/dismiss', SecurityAlertController.dismissAlert);

/**
 * @route   PATCH /api/sessions/security/alerts/mark-all-read
 * @desc    Mark multiple alerts as read
 * @access  Private
 * @body    { alertIds?: string[] } - Optional array of specific alert IDs
 */
router.patch('/security/alerts/mark-all-read', SecurityAlertController.markAllRead);

/**
 * @route   GET /api/sessions/security/alert-preferences
 * @desc    Get user's alert notification preferences
 * @access  Private
 */
router.get('/security/alert-preferences', SecurityAlertController.getAlertPreferences);

/**
 * @route   PATCH /api/sessions/security/alert-preferences
 * @desc    Update user's alert notification preferences
 * @access  Private
 */
router.patch('/security/alert-preferences', SecurityAlertController.updateAlertPreferences);

// ================================
// DEVELOPMENT/TESTING ROUTES
// ================================

/**
 * @route   POST /api/sessions/security/alerts/test
 * @desc    Create a test security alert (development only)
 * @access  Private
 * @env     NODE_ENV !== 'production'
 */
router.post('/security/alerts/test', SecurityAlertController.createTestAlert);

// ================================
// ERROR HANDLING
// ================================

// Handle 404 for session routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Session endpoint not found',
    availableEndpoints: [
      'GET /api/sessions/my-sessions',
      'GET /api/sessions/security-overview',
      'GET /api/sessions/:sessionId/details',
      'DELETE /api/sessions/:sessionId',
      'POST /api/sessions/revoke-all',
      'PATCH /api/sessions/security-settings',
      'POST /api/sessions/report-suspicious',
      'GET /api/sessions/security/alerts',
      'GET /api/sessions/security/alerts/stats',
      'GET /api/sessions/security/alerts/:alertId',
      'PATCH /api/sessions/security/alerts/:alertId/acknowledge',
      'PATCH /api/sessions/security/alerts/:alertId/dismiss',
      'PATCH /api/sessions/security/alerts/mark-all-read',
      'GET /api/sessions/security/alert-preferences',
      'PATCH /api/sessions/security/alert-preferences'
    ]
  });
});

module.exports = router;