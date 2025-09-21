const mongoose = require('mongoose');

/**
 * Security Alert Schema for tracking security events and notifications
 */
const securityAlertSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Alert information
  type: {
    type: String,
    enum: [
      'new_device',
      'new_location',
      'suspicious_location',
      'multiple_failed_attempts',
      'password_changed',
      'account_locked',
      'account_unlocked',
      'security_settings_changed',
      'data_export_requested',
      'account_deletion_requested',
      'unusual_activity'
    ],
    required: true,
    index: true
  },

  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true
  },

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  // Related session or event data
  metadata: {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null
    },
    ip: {
      type: String,
      default: null
    },
    location: {
      country: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    device: {
      type: String,
      os: String,
      browser: String
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    additionalData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },

  // Notification status
  notifications: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      error: { type: String, default: null }
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      error: { type: String, default: null }
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      error: { type: String, default: null }
    }
  },

  // Alert status
  status: {
    type: String,
    enum: ['unread', 'read', 'dismissed', 'resolved'],
    default: 'unread',
    index: true
  },

  // User actions
  userActions: [{
    action: {
      type: String,
      enum: ['dismissed', 'secured_account', 'ignored', 'false_positive']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
securityAlertSchema.index({ userId: 1, createdAt: -1 });
securityAlertSchema.index({ userId: 1, status: 1 });
securityAlertSchema.index({ type: 1, severity: 1 });
securityAlertSchema.index({ createdAt: -1 });

// Instance methods
securityAlertSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

securityAlertSchema.methods.markAsResolved = function(notes = '') {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  if (notes) {
    this.userActions.push({
      action: 'secured_account',
      notes,
      timestamp: new Date()
    });
  }
  return this.save();
};

securityAlertSchema.methods.dismiss = function(notes = '') {
  this.status = 'dismissed';
  this.userActions.push({
    action: 'dismissed',
    notes,
    timestamp: new Date()
  });
  return this.save();
};

securityAlertSchema.methods.markNotificationSent = function(type, error = null) {
  if (this.notifications[type]) {
    this.notifications[type].sent = !error;
    this.notifications[type].sentAt = new Date();
    if (error) {
      this.notifications[type].error = error;
    }
    return this.save();
  }
  return false;
};

// Static methods
securityAlertSchema.statics.createAlert = async function(alertData) {
  const alert = new this(alertData);
  await alert.save();
  
  // Schedule notifications based on severity
  if (alert.severity === 'critical') {
    // Send immediate notifications
    await alert.scheduleNotifications(['email', 'push', 'sms']);
  } else if (alert.severity === 'warning') {
    await alert.scheduleNotifications(['email', 'push']);
  } else {
    await alert.scheduleNotifications(['push']);
  }
  
  return alert;
};

securityAlertSchema.methods.scheduleNotifications = async function(types = ['email']) {
  // This would integrate with your notification service
  // For now, we'll just mark them as scheduled
  for (const type of types) {
    if (this.notifications[type]) {
      // In a real implementation, you'd queue these for sending
      console.log(`Scheduling ${type} notification for alert ${this._id}`);
    }
  }
};

securityAlertSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    userId,
    status: 'unread'
  });
};

securityAlertSchema.statics.getRecentAlerts = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('metadata.sessionId', 'deviceInfo location createdAt');
};

securityAlertSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, status: 'unread' },
    { 
      status: 'read',
      readAt: new Date()
    }
  );
};

securityAlertSchema.statics.cleanupOldAlerts = function(daysToKeep = 90) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['read', 'dismissed', 'resolved'] }
  });
};

securityAlertSchema.statics.getSecuritySummary = function(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          severity: '$severity'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$createdAt' }
      }
    },
    {
      $group: {
        _id: null,
        totalAlerts: { $sum: '$count' },
        criticalAlerts: {
          $sum: {
            $cond: [{ $eq: ['$_id.severity', 'critical'] }, '$count', 0]
          }
        },
        warningAlerts: {
          $sum: {
            $cond: [{ $eq: ['$_id.severity', 'warning'] }, '$count', 0]
          }
        },
        alertsByType: {
          $push: {
            type: '$_id.type',
            severity: '$_id.severity',
            count: '$count',
            lastOccurrence: '$lastOccurrence'
          }
        }
      }
    }
  ]);
};

const SecurityAlert = mongoose.model('SecurityAlert', securityAlertSchema);

module.exports = { SecurityAlert };