const { Session } = require('../models/Session');
const { SecurityAlert } = require('../models/SecurityAlert');
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
        sessionId: req.sessionId,
        type: 'session_revoked',
        severity: 'info',
        title: 'Device Session Revoked',
        description: `Session revoked for ${session.deviceInfo.type} device from ${session.location.city}`,
        metadata: {
          revokedSessionId: sessionId,
          deviceInfo: session.deviceInfo,
          location: session.location
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
   * Revoke all sessions except current
   * @route POST /api/sessions/revoke-all
   */
  static async revokeAllSessions(req, res) {
    try {
      const userId = req.user._id;
      const currentSessionId = req.sessionId;

      // Find all other active sessions
      const sessions = await Session.find({
        userId: userId,
        _id: { $ne: currentSessionId },
        isActive: true
      });

      // Revoke all sessions
      const revokePromises = sessions.map(session => 
        session.markAsInactive()
      );
      await Promise.all(revokePromises);

      // Create security alert
      await SecurityAlert.create({
        userId: userId,
        sessionId: currentSessionId,
        type: 'all_sessions_revoked',
        severity: 'info',
        title: 'All Device Sessions Revoked',
        description: `${sessions.length} device sessions were revoked by user`,
        metadata: {
          revokedCount: sessions.length,
          revokedSessions: sessions.map(s => ({
            deviceType: s.deviceInfo.type,
            location: s.location.city,
            lastActivity: s.lastActiveAt
          }))
        }
      });

      res.json({
        success: true,
        message: `Successfully revoked ${sessions.length} sessions`,
        data: {
          revokedCount: sessions.length
        }
      });

    } catch (error) {
      console.error('❌ Revoke all sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke sessions'
      });
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
        recentAlerts,
        securityStatsResult
      ] = await Promise.all([
        // Active sessions
        Session.find({ userId, isActive: true }).countDocuments(),
        
        // Recent sessions with basic info
        Session.find({
          userId,
          createdAt: { $gte: thirtyDaysAgo }
        })
        .select('deviceInfo location createdAt isActive security')
        .sort({ createdAt: -1 })
        .limit(10),

        // Recent security alerts
        SecurityAlert.find({
          userId,
          createdAt: { $gte: thirtyDaysAgo }
        })
        .select('type severity title createdAt status')
        .sort({ createdAt: -1 })
        .limit(5),

        // Security statistics
        Session.getSecurityStats(userId)
      ]);

      // Extract security stats from aggregation result
      const securityStats = securityStatsResult.length > 0 ? securityStatsResult[0] : {
        totalSessions: 0,
        activeSessions: 0,
        averageRiskScore: 0,
        countries: [],
        devices: [],
        lastLogin: null
      };

      // Get unique locations and devices from recent sessions
      const uniqueLocations = new Set();
      const uniqueDevices = new Set();
      let highRiskCount = 0;

      recentSessions.forEach(session => {
        uniqueLocations.add(`${session.location.city}, ${session.location.country}`);
        uniqueDevices.add(`${session.deviceInfo.type} - ${session.deviceInfo.os}`);
        if (session.security.riskScore > 50) highRiskCount++;
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
          recentAlerts,
          securityStats
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
   * Update session security settings
   * @route PATCH /api/sessions/security-settings
   */
  static async updateSecuritySettings(req, res) {
    try {
      const userId = req.user._id;
      const {
        enableLocationAlerts = true,
        enableNewDeviceAlerts = true,
        sessionTimeout = 7 * 24 * 60 * 60 * 1000, // 7 days default
        requireStrongAuth = false
      } = req.body;

      // Validate session timeout (min: 1 hour, max: 30 days)
      const minTimeout = 60 * 60 * 1000; // 1 hour
      const maxTimeout = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      if (sessionTimeout < minTimeout || sessionTimeout > maxTimeout) {
        return res.status(400).json({
          success: false,
          message: 'Session timeout must be between 1 hour and 30 days'
        });
      }

      // Update user's security preferences (you might want to add this to User model)
      // For now, we'll store it in the current session as metadata
      const currentSession = await Session.findById(req.sessionId);
      if (currentSession) {
        currentSession.metadata = {
          ...currentSession.metadata,
          securitySettings: {
            enableLocationAlerts,
            enableNewDeviceAlerts,
            sessionTimeout,
            requireStrongAuth,
            updatedAt: new Date()
          }
        };
        await currentSession.save();
      }

      res.json({
        success: true,
        message: 'Security settings updated successfully',
        data: {
          settings: {
            enableLocationAlerts,
            enableNewDeviceAlerts,
            sessionTimeout,
            requireStrongAuth
          }
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
}

module.exports = { SessionController };
