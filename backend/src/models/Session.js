const mongoose = require('mongoose');

/**
 * Session Schema for tracking user login sessions and devices
 */
const sessionSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Session identification
  refreshTokenFamily: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Device information
  deviceInfo: {
    type: {
      type: String, // 'mobile', 'web', 'desktop', 'tablet'
      enum: ['mobile', 'web', 'desktop', 'tablet', 'unknown'],
      default: 'unknown'
    },
    os: {
      type: String,
      default: 'Unknown'
    },
    browser: {
      type: String,
      default: 'Unknown'
    },
    app: {
      type: String,
      default: 'Unknown'
    },
    userAgent: {
      type: String,
      default: ''
    }
  },

  // Location information
  location: {
    ip: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Unknown'
    },
    countryCode: {
      type: String,
      default: 'XX'
    },
    region: {
      type: String,
      default: 'Unknown'
    },
    city: {
      type: String,
      default: 'Unknown'
    },
    timezone: {
      type: String,
      default: 'Unknown'
    },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    isp: {
      type: String,
      default: 'Unknown'
    }
  },

  // Security flags
  security: {
    isVPN: {
      type: Boolean,
      default: false
    },
    isProxy: {
      type: Boolean,
      default: false
    },
    isTor: {
      type: Boolean,
      default: false
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    requiresVerification: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },

  // Session status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: false, // Will be set by pre-save middleware if not provided
    index: true
  },

  // Metadata
  metadata: {
    loginMethod: {
      type: String,
      enum: ['password', 'otp', 'social', 'biometric'],
      default: 'password'
    },
    sessionDuration: {
      type: Number, // in seconds
      default: 0
    },
    refreshCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ refreshTokenFamily: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ 'location.ip': 1 });
sessionSchema.index({ 'location.country': 1 });

// Instance methods
sessionSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  this.metadata.sessionDuration = Math.floor((this.lastActiveAt - this.createdAt) / 1000);
  return this.save();
};

sessionSchema.methods.incrementRefreshCount = function() {
  this.metadata.refreshCount += 1;
  return this.updateLastActive();
};

sessionSchema.methods.markAsInactive = function() {
  this.isActive = false;
  return this.save();
};

// Check if session is still valid
sessionSchema.methods.isValid = function() {
  // Check if session is active
  if (!this.isActive) {
    return false;
  }
  
  // Check if session has expired
  if (this.expiresAt && this.expiresAt < new Date()) {
    return false;
  }
  
  // Check if session is too old (additional safety check)
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  if (Date.now() - this.createdAt.getTime() > maxAge) {
    return false;
  }
  
  return true;
};

// Revoke session with reason
sessionSchema.methods.revoke = function(reason = 'manual_revocation') {
  this.isActive = false;
  this.metadata = {
    ...this.metadata,
    revokedAt: new Date(),
    revokeReason: reason
  };
  return this.save();
};

sessionSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  // Device factors
  if (this.deviceInfo.type === 'unknown') score += 10;
  if (this.deviceInfo.userAgent === '') score += 5;
  
  // Location factors
  if (this.security.isVPN) score += 20;
  if (this.security.isProxy) score += 15;
  if (this.security.isTor) score += 30;
  if (this.location.country === 'Unknown') score += 10;
  
  // Time factors
  const hourOfDay = new Date().getHours();
  if (hourOfDay < 6 || hourOfDay > 23) score += 5; // Late night login
  
  this.security.riskScore = Math.min(score, 100);
  return this.security.riskScore;
};

// Static methods
sessionSchema.statics.findActiveSessions = function(userId) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActiveAt: -1 });
};

sessionSchema.statics.revokeAllUserSessions = function(userId) {
  return this.updateMany(
    { userId, isActive: true },
    { 
      isActive: false,
      lastActiveAt: new Date()
    }
  );
};

sessionSchema.statics.revokeSession = function(sessionId, userId) {
  return this.findOneAndUpdate(
    { _id: sessionId, userId, isActive: true },
    { 
      isActive: false,
      lastActiveAt: new Date()
    }
  );
};

sessionSchema.statics.cleanupExpiredSessions = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isActive: false, lastActiveAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days old
    ]
  });
};

sessionSchema.statics.getSecurityStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        activeSessions: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$isActive', true] }, { $gt: ['$expiresAt', new Date()] }] },
              1,
              0
            ]
          }
        },
        averageRiskScore: { $avg: '$security.riskScore' },
        countries: { $addToSet: '$location.country' },
        devices: { $addToSet: '$deviceInfo.type' },
        lastLogin: { $max: '$createdAt' }
      }
    }
  ]);
};

// Pre-save middleware
sessionSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set expiration time if not already set (7 days from creation)
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    
    // Ensure location.ip is set if not provided
    if (!this.location.ip && this.ipAddress) {
      this.location.ip = this.ipAddress;
    }
    
    // Calculate initial risk score if not already calculated
    if (this.security.riskScore === 0) {
      this.calculateRiskScore();
    }
  }
  next();
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = { Session };