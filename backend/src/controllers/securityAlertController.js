const { SecurityAlert } = require('../models/SecurityAlert');
const { Session } = require('../models/Session');

/**
 * Security Alert Management Controller
 * Handles security notifications, alerts, and user security actions
 */
class SecurityAlertController {

  /**
   * Get user's security alerts
   * @route GET /api/security/alerts
   */
  static async getAlerts(req, res) {
    try {
      const userId = req.user._id;
      const {
        page = 1,
        limit = 20,
        severity,
        status,
        type,
        unreadOnly = false
      } = req.query;

      // Build query filters
      const query = { userId };
      
      if (severity) query.severity = severity;
      if (status) query.status = status;
      if (type) query.type = type;
      if (unreadOnly === 'true') query.userAction = 'pending';

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [alerts, total, unreadCount] = await Promise.all([
        SecurityAlert.find(query)
          .select('-metadata.internalNotes') // Don't expose internal notes
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('sessionId', 'deviceInfo location'),

        SecurityAlert.countDocuments(query),

        SecurityAlert.countDocuments({ userId, userAction: 'pending' })
      ]);

      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          summary: {
            unreadCount,
            totalCount: total
          }
        }
      });

    } catch (error) {
      console.error('❌ Get alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security alerts'
      });
    }
  }

  /**
   * Get alert details
   * @route GET /api/security/alerts/:alertId
   */
  static async getAlertDetails(req, res) {
    try {
      const { alertId } = req.params;
      const userId = req.user._id;

      const alert = await SecurityAlert.findOne({
        _id: alertId,
        userId: userId
      }).populate('sessionId', 'deviceInfo location createdAt status');

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Security alert not found'
        });
      }

      res.json({
        success: true,
        data: { alert }
      });

    } catch (error) {
      console.error('❌ Get alert details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alert details'
      });
    }
  }

  /**
   * Mark alert as acknowledged
   * @route PATCH /api/security/alerts/:alertId/acknowledge
   */
  static async acknowledgeAlert(req, res) {
    try {
      const { alertId } = req.params;
      const userId = req.user._id;

      const alert = await SecurityAlert.findOne({
        _id: alertId,
        userId: userId
      });

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Security alert not found'
        });
      }

      await alert.markAsAcknowledged();

      res.json({
        success: true,
        message: 'Alert acknowledged successfully'
      });

    } catch (error) {
      console.error('❌ Acknowledge alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge alert'
      });
    }
  }

  /**
   * Mark alert as dismissed
   * @route PATCH /api/security/alerts/:alertId/dismiss
   */
  static async dismissAlert(req, res) {
    try {
      const { alertId } = req.params;
      const userId = req.user._id;

      const alert = await SecurityAlert.findOne({
        _id: alertId,
        userId: userId
      });

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Security alert not found'
        });
      }

      await alert.markAsDismissed();

      res.json({
        success: true,
        message: 'Alert dismissed successfully'
      });

    } catch (error) {
      console.error('❌ Dismiss alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to dismiss alert'
      });
    }
  }

  /**
   * Bulk mark alerts as read
   * @route PATCH /api/security/alerts/mark-all-read
   */
  static async markAllRead(req, res) {
    try {
      const userId = req.user._id;
      const { alertIds } = req.body;

      let query = { userId, userAction: 'pending' };
      
      // If specific alert IDs provided, update only those
      if (alertIds && Array.isArray(alertIds)) {
        query._id = { $in: alertIds };
      }

      const result = await SecurityAlert.updateMany(query, {
        userAction: 'acknowledged',
        actionTimestamp: new Date()
      });

      res.json({
        success: true,
        message: `${result.modifiedCount} alerts marked as read`,
        data: {
          updatedCount: result.modifiedCount
        }
      });

    } catch (error) {
      console.error('❌ Mark all read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark alerts as read'
      });
    }
  }

  /**
   * Get security alert statistics
   * @route GET /api/security/alerts/stats
   */
  static async getAlertStats(req, res) {
    try {
      const userId = req.user._id;
      const { days = 30 } = req.query;

      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [
        totalStats,
        severityStats,
        typeStats,
        recentTrends
      ] = await Promise.all([
        // Total counts
        SecurityAlert.aggregate([
          { $match: { userId: userId, createdAt: { $gte: fromDate } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              pending: { $sum: { $cond: [{ $eq: ['$userAction', 'pending'] }, 1, 0] } },
              acknowledged: { $sum: { $cond: [{ $eq: ['$userAction', 'acknowledged'] }, 1, 0] } },
              dismissed: { $sum: { $cond: [{ $eq: ['$userAction', 'dismissed'] }, 1, 0] } }
            }
          }
        ]),

        // By severity
        SecurityAlert.aggregate([
          { $match: { userId: userId, createdAt: { $gte: fromDate } } },
          {
            $group: {
              _id: '$severity',
              count: { $sum: 1 }
            }
          }
        ]),

        // By type
        SecurityAlert.aggregate([
          { $match: { userId: userId, createdAt: { $gte: fromDate } } },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          }
        ]),

        // Daily trends for the past week
        SecurityAlert.aggregate([
          {
            $match: {
              userId: userId,
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 },
              highSeverity: {
                $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
              }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          summary: totalStats[0] || { total: 0, pending: 0, acknowledged: 0, dismissed: 0 },
          bySeverity: severityStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byType: typeStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          dailyTrends: recentTrends
        }
      });

    } catch (error) {
      console.error('❌ Get alert stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alert statistics'
      });
    }
  }

  /**
   * Create a test security alert (for development/testing)
   * @route POST /api/security/alerts/test
   */
  static async createTestAlert(req, res) {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Test alerts are not allowed in production'
        });
      }

      const userId = req.user._id;
      const sessionId = req.sessionId;
      const { type = 'test_alert', severity = 'info' } = req.body;

      const alert = await SecurityAlert.create({
        userId,
        sessionId,
        type,
        severity,
        title: 'Test Security Alert',
        description: 'This is a test security alert for development purposes',
        metadata: {
          testAlert: true,
          createdBy: 'development',
          timestamp: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Test alert created successfully',
        data: { alert }
      });

    } catch (error) {
      console.error('❌ Create test alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test alert'
      });
    }
  }

  /**
   * Update alert preferences
   * @route PATCH /api/security/alert-preferences
   */
  static async updateAlertPreferences(req, res) {
    try {
      const userId = req.user._id;
      const {
        enableEmailNotifications = true,
        enablePushNotifications = true,
        alertTypes = [],
        severityThreshold = 'low'
      } = req.body;

      // Validate severity threshold
      const validSeverities = ['low', 'medium', 'high'];
      if (!validSeverities.includes(severityThreshold)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid severity threshold'
        });
      }

      // Store preferences (you might want to add this to User model)
      // For now, storing in session metadata as an example
      const currentSession = await Session.findById(req.sessionId);
      if (currentSession) {
        currentSession.metadata = {
          ...currentSession.metadata,
          alertPreferences: {
            enableEmailNotifications,
            enablePushNotifications,
            alertTypes,
            severityThreshold,
            updatedAt: new Date()
          }
        };
        await currentSession.save();
      }

      res.json({
        success: true,
        message: 'Alert preferences updated successfully',
        data: {
          preferences: {
            enableEmailNotifications,
            enablePushNotifications,
            alertTypes,
            severityThreshold
          }
        }
      });

    } catch (error) {
      console.error('❌ Update alert preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update alert preferences'
      });
    }
  }

  /**
   * Get alert preferences
   * @route GET /api/security/alert-preferences
   */
  static async getAlertPreferences(req, res) {
    try {
      const sessionId = req.sessionId;

      // Get preferences from session metadata (temporary implementation)
      const session = await Session.findById(sessionId);
      const preferences = session?.metadata?.alertPreferences || {
        enableEmailNotifications: true,
        enablePushNotifications: true,
        alertTypes: [],
        severityThreshold: 'low'
      };

      res.json({
        success: true,
        data: { preferences }
      });

    } catch (error) {
      console.error('❌ Get alert preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alert preferences'
      });
    }
  }

  /**
   * Clear all security alerts for user
   * @route DELETE /api/sessions/security/alerts
   */
  static async clearSecurityAlerts(req, res) {
    try {
      const userId = req.user._id;

      const result = await SecurityAlert.deleteMany({
        userId: userId
      });

      res.json({
        success: true,
        message: 'All security alerts cleared successfully',
        data: {
          deletedCount: result.deletedCount
        }
      });

    } catch (error) {
      console.error('❌ Clear security alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear security alerts'
      });
    }
  }

  /**
   * Export user security data
   * @route GET /api/sessions/security-export
   */
  static async exportSecurityData(req, res) {
    try {
      const userId = req.user._id;

      // Get user's sessions
      const sessions = await Session.find({
        userId: userId
      })
      .select('-refreshTokenFamily')
      .sort({ createdAt: -1 });

      // Get user's security alerts
      const alerts = await SecurityAlert.find({
        userId: userId
      })
      .sort({ createdAt: -1 });

      const exportData = {
        exportedAt: new Date(),
        userId: userId,
        sessions: sessions,
        securityAlerts: alerts,
        summary: {
          totalSessions: sessions.length,
          activeSessions: sessions.filter(s => s.isActive).length,
          totalAlerts: alerts.length,
          criticalAlerts: alerts.filter(a => a.severity === 'critical').length
        }
      };

      res.json({
        success: true,
        data: exportData
      });

    } catch (error) {
      console.error('❌ Export security data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export security data'
      });
    }
  }
}

module.exports = { SecurityAlertController };
