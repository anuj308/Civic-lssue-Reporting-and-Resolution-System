const { Session } = require('../models/Session');
const { SecurityAlert } = require('../models/SecurityAlert');
const { User } = require('../models/User');
const { LocationService } = require('../utils/locationService');

/**
 * Session Management Controller
 * Handles device sessions, security monitoring, and user session control
 */
class SessionController {

  /**
   * Get all active sessions for a user
   * @route GET /api/sessions/my-sessions
   */
  static async getMySessions(req, res) {
    try {
      const sessions = await Session.find({
        userId: req.user._id, // Use req.user._id instead of req.userId
        isActive: true
      })
      .select('-refreshTokenFamily') // Don't expose refresh tokens
      .sort({ lastActiveAt: -1 });

      // Add current session indicator
      const currentSession = req.sessionId;
      const sessionsWithCurrent = sessions.map(session => ({
        ...session.toObject(),
        isCurrent: session._id.toString() === currentSession
      }));

      res.json({
        success: true,
        data: {
          sessions: sessionsWithCurrent,
          total: sessions.length
        }
      });

    } catch (error) {
      console.error('❌ Get sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sessions'
      });
    }
  }

  /**
   * Revoke a specific session
   * @route DELETE /api/sessions/:sessionId
   */
  static async revokeSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      // Don't allow revoking current session via this endpoint
      if (sessionId === req.sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot revoke current session. Use logout instead.'
        });
      }

      const session = await Session.findOne({
        _id: sessionId,
        userId: userId,
        isActive: true
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Revoke the session
      await session.markAsInactive();

      // Create security alert
      await SecurityAlert.create({
        userId: userId,
        sessionId: sessionId,
        type: 'session_revoke',
        severity: 'medium',
        title: 'Session Revoked',
        description: 'Your session has been revoked by the user',
        metadata: {
          sessionId: sessionId,
          userId: userId,
          action: 'revoke'
        }
      });

      res.json({
        success: true,
        message: 'Session revoked successfully'
      });

    } catch (error) {
      console.error('❌ Revoke session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke session'
      });
    }
  }

  /**
   * Revoke all sessions except current one
   * @route POST /api/sessions/revoke-all
   */
  static async revokeAllSessions(req, res) {
    try {
      const userId = req.user._id;
      const currentSessionId = req.sessionId;

      // Find all active sessions except current one
      const sessionsToRevoke = await Session.find({
        userId: userId,
        isActive: true,
        _id: { $ne: currentSessionId }
      });

      if (sessionsToRevoke.length === 0) {
        return res.json({
          success: true,
          message: 'No other active sessions to revoke',
          data: { revokedCount: 0 }
        });
      }

      // Revoke all sessions
      const revokePromises = sessionsToRevoke.map(session => session.markAsInactive());
      await Promise.all(revokePromises);

      // Create security alert for mass session revocation
      await SecurityAlert.create({
        userId: userId,
        sessionId: currentSessionId,
        type: 'mass_session_revoke',
        severity: 'high',
        title: 'All Sessions Revoked',
        description: `User revoked ${sessionsToRevoke.length} active sessions`,
        metadata: {
          action: 'revoke_all',
          revokedCount: sessionsToRevoke.length,
          revokedSessions: sessionsToRevoke.map(s => ({
            sessionId: s._id,
            deviceInfo: s.deviceInfo,
            location: s.location
          }))
        }
      });

      res.json({
        success: true,
        message: `${sessionsToRevoke.length} sessions revoked successfully`,
        data: {
          revokedCount: sessionsToRevoke.length,
          currentSessionKept: true
        }
      });

    } catch (error) {
      console.error('❌ Revoke all sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke all sessions'
      });
    }
  }

  /**
   * Get user security settings
   * @route GET /api/sessions/security-settings
   */
  static async getSecuritySettings(req, res) {
    try {
      const userId = req.user._id;

      // Get user with their security preferences
      const user = await User.findById(userId).select('preferences');
      
      const settings = {
        emailAlerts: user?.preferences?.emailNotifications ?? true,
        pushNotifications: user?.preferences?.pushNotifications ?? true,
        newDeviceAlerts: user?.preferences?.newDeviceAlerts ?? true,
        locationAlerts: user?.preferences?.locationAlerts ?? true,
        failedLoginAlerts: user?.preferences?.failedLoginAlerts ?? true,
        twoFactorEnabled: user?.preferences?.twoFactorEnabled ?? false,
        loginNotifications: user?.preferences?.loginNotifications ?? true,
        suspiciousActivityAlerts: user?.preferences?.suspiciousActivityAlerts ?? true,
        weeklySecurityReport: user?.preferences?.weeklySecurityReport ?? false,
        // Backwards compatibility
        enableLocationAlerts: user?.preferences?.locationAlerts ?? true,
        enableNewDeviceAlerts: user?.preferences?.newDeviceAlerts ?? true,
        requireStrongAuth: false
      };

      res.json({
        success: true,
        data: {
          settings
        }
      });

    } catch (error) {
      console.error('❌ Get security settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get security settings'
      });
    }
  }

  /**
   * Update user security settings
   * @route PATCH /api/sessions/security-settings
   */
  static async updateSecuritySettings(req, res) {
    try {
      const userId = req.user._id;
      const {
        emailAlerts,
        pushNotifications,
        newDeviceAlerts,
        locationAlerts,
        failedLoginAlerts,
        twoFactorEnabled,
        loginNotifications,
        suspiciousActivityAlerts,
        weeklySecurityReport,
        enableLocationAlerts, // backwards compatibility
        enableNewDeviceAlerts, // backwards compatibility
        requireStrongAuth = false
      } = req.body;

      // Build update object for user preferences
      const updateFields = {};
      
      // Security notification preferences
      if (emailAlerts !== undefined) updateFields['preferences.emailNotifications'] = emailAlerts;
      if (pushNotifications !== undefined) updateFields['preferences.pushNotifications'] = pushNotifications;
      if (loginNotifications !== undefined) updateFields['preferences.loginNotifications'] = loginNotifications;
      if (weeklySecurityReport !== undefined) updateFields['preferences.weeklySecurityReport'] = weeklySecurityReport;
      
      // Alert type preferences  
      if (newDeviceAlerts !== undefined) updateFields['preferences.newDeviceAlerts'] = newDeviceAlerts;
      if (locationAlerts !== undefined) updateFields['preferences.locationAlerts'] = locationAlerts;
      if (failedLoginAlerts !== undefined) updateFields['preferences.failedLoginAlerts'] = failedLoginAlerts;
      if (suspiciousActivityAlerts !== undefined) updateFields['preferences.suspiciousActivityAlerts'] = suspiciousActivityAlerts;
      
      // Two-factor (placeholder for future implementation)
      if (twoFactorEnabled !== undefined) updateFields['preferences.twoFactorEnabled'] = twoFactorEnabled;

      // Backwards compatibility fields
      if (enableLocationAlerts !== undefined) updateFields['preferences.locationAlerts'] = enableLocationAlerts;
      if (enableNewDeviceAlerts !== undefined) updateFields['preferences.newDeviceAlerts'] = enableNewDeviceAlerts;

      // Update user preferences
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select('preferences');

      res.json({
        success: true,
        message: 'Security settings updated successfully',
        data: {
          settings: updatedUser.preferences
        }
      });

    } catch (error) {
      console.error('❌ Update security settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update security settings'
      });
    }
  }

  /**
   * Report suspicious activity
   * @route POST /api/sessions/report-suspicious
   */
  static async reportSuspiciousActivity(req, res) {
    try {
      const { sessionId, reason, description } = req.body;
      const userId = req.user._id;

      if (!sessionId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Session ID and reason are required'
        });
      }

      const session = await Session.findOne({
        _id: sessionId,
        userId: userId
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Create security alert for suspicious activity report
      await SecurityAlert.create({
        userId: userId,
        sessionId: req.sessionId,
        type: 'user_reported_suspicious',
        severity: 'high',
        title: 'User Reported Suspicious Activity',
        description: `User reported suspicious activity for session: ${reason}`,
        metadata: {
          reportedSessionId: sessionId,
          reason,
          userDescription: description,
          reportedSession: {
            deviceInfo: session.deviceInfo,
            location: session.location,
            createdAt: session.createdAt
          }
        }
      });

      // Mark the reported session for review
      session.flags.push({
        type: 'user_reported',
        reason,
        timestamp: new Date()
      });
      await session.save();

      res.json({
        success: true,
        message: 'Suspicious activity reported successfully'
      });

    } catch (error) {
      console.error('❌ Report suspicious activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to report suspicious activity'
      });
    }
  }

  /**
   * Get detailed session information
   * @route GET /api/sessions/:sessionId/details
   */
  static async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      const session = await Session.findOne({
        _id: sessionId,
        userId: userId
      }).select('-refreshToken');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Get related security alerts
      const alerts = await SecurityAlert.find({
        sessionId: sessionId
      }).select('type severity title description createdAt');

      res.json({
        success: true,
        data: {
          session: {
            ...session.toObject(),
            isCurrent: sessionId === req.sessionId
          },
          relatedAlerts: alerts
        }
      });

    } catch (error) {
      console.error('❌ Session details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch session details'
      });
    }
  }

  /**
   * Middleware to extract session info from request
   */
  static async attachSessionInfo(req, res, next) {
    try {
      if (req.user._id && req.sessionId) {
        const session = await Session.findById(req.sessionId);
        if (session) {
          req.sessionData = session;
        }
      }
      next();
    } catch (error) {
      console.error('❌ Attach session info error:', error);
      next(); // Continue even if session info fails
    }
  }

  /**
   * Update session activity
   */
  static async updateActivity(req, res, next) {
    try {
      if (req.sessionId) {
        await Session.findByIdAndUpdate(req.sessionId, {
          lastActivity: new Date(),
          'metadata.lastEndpoint': req.originalUrl,
          'metadata.requestCount': { $inc: 1 }
        });
      }
      next();
    } catch (error) {
      console.error('❌ Update activity error:', error);
      next(); // Continue even if activity update fails
    }
  }

  /**
   * Get session activity and security overview
   * @route GET /api/sessions/security-overview
   */
  static async getSecurityOverview(req, res) {
    try {
      const userId = req.user._id;

      // Get recent sessions (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        activeSessions,
        recentSessions,
        recentAlerts
      ] = await Promise.all([
        Session.find({ userId, isActive: true }).countDocuments(),
        Session.find({
          userId,
          createdAt: { $gte: thirtyDaysAgo }
        })
        .select('deviceInfo location createdAt isActive security')
        .sort({ createdAt: -1 })
        .limit(10),
        SecurityAlert.find({
          userId,
          createdAt: { $gte: thirtyDaysAgo }
        })
        .select('type severity title createdAt status')
        .sort({ createdAt: -1 })
        .limit(5)
      ]);

      // Get unique locations and devices from recent sessions
      const uniqueLocations = new Set();
      const uniqueDevices = new Set();
      let highRiskCount = 0;

      recentSessions.forEach(session => {
        if (session.location.city && session.location.country) {
          uniqueLocations.add(`${session.location.city}, ${session.location.country}`);
        }
        if (session.deviceInfo.type) {
          uniqueDevices.add(session.deviceInfo.type);
        }
        if (session.security.riskScore > 60) {
          highRiskCount++;
        }
      });

      res.json({
        success: true,
        data: {
          overview: {
            activeSessions,
            recentLoginCount: recentSessions.length,
            uniqueLocations: uniqueLocations.size,
            uniqueDevices: uniqueDevices.size,
            highRiskLogins: highRiskCount,
            pendingAlerts: recentAlerts.filter(a => a.status === 'unread').length
          },
          recentSessions: recentSessions.map(session => ({
            id: session._id,
            device: `${session.deviceInfo.type} - ${session.deviceInfo.os}`,
            location: `${session.location.city}, ${session.location.country}`,
            loginTime: session.createdAt,
            status: session.isActive ? 'active' : 'inactive',
            riskLevel: session.security.riskScore < 30 ? 'low' : session.security.riskScore < 60 ? 'medium' : 'high'
          })),
          recentAlerts
        }
      });

    } catch (error) {
      console.error('❌ Security overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security overview'
      });
    }
  }
}

module.exports = { SessionController };
