const mongoose = require('mongoose');

/**
 * Issue Schema for the Civic Issue Reporting System
 * @typedef {Object} Issue
 * @property {string} _id - Unique identifier
 * @property {string} title - Issue title
 * @property {string} description - Detailed description
 * @property {string} category - Issue category
 * @property {string} [subcategory] - Optional subcategory
 * @property {string} priority - Priority level: 'low', 'medium', 'high', 'critical'
 * @property {string} status - Current status
 * @property {ObjectId} reportedBy - User who reported the issue
 * @property {ObjectId} [assignedTo] - User assigned to handle the issue
 * @property {ObjectId} [assignedDepartment] - Department assigned
 * @property {Object} location - Location information
 * @property {Object} media - Media files (images, videos, audio)
 * @property {Object} timeline - Timeline of status changes
 * @property {Date} [estimatedResolution] - Estimated resolution date
 * @property {Date} [actualResolution] - Actual resolution date
 * @property {Object} [resolution] - Resolution details
 * @property {Object} [feedback] - User feedback
 * @property {Object} votes - Upvotes and downvotes
 * @property {Array} comments - Comments on the issue
 * @property {Array} tags - Issue tags
 * @property {boolean} isPublic - Whether issue is public
 * @property {number} urgencyScore - Calculated urgency score
 * @property {string} [duplicateOf] - Reference to original issue if duplicate
 * @property {Array} relatedIssues - Related issues
 * @property {Object} metadata - Additional metadata
 * @property {Object} analytics - Analytics data
 */

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'pothole',
      'streetlight',
      'garbage',
      'water_supply',
      'sewerage',
      'traffic',
      'park_maintenance',
      'road_maintenance',
      'electrical',
      'construction',
      'noise_pollution',
      'air_pollution',
      'water_pollution',
      'stray_animals',
      'illegal_parking',
      'illegal_construction',
      'public_transport',
      'healthcare',
      'education',
      'other'
    ]
  },
  subcategory: {
    type: String,
    maxLength: [100, 'Subcategory cannot exceed 100 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'],
    default: 'pending'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxLength: [300, 'Address cannot exceed 300 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      default: 'Jharkhand'
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    landmark: {
      type: String,
      maxLength: [100, 'Landmark cannot exceed 100 characters']
    }
  },
  media: {
    images: [{
      type: String,
      required: true
    }],
    videos: [{
      type: String
    }],
    audio: {
      type: String,
      default: null
    }
  },
  timeline: {
    reported: {
      type: Date,
      default: Date.now,
      required: true
    },
    acknowledged: {
      type: Date,
      default: null
    },
    started: {
      type: Date,
      default: null
    },
    resolved: {
      type: Date,
      default: null
    },
    closed: {
      type: Date,
      default: null
    }
  },
  estimatedResolution: {
    type: Date,
    default: null
  },
  actualResolution: {
    type: Date,
    default: null
  },
  resolution: {
    description: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    images: [String],
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative']
    },
    resources: [String]
  },
  feedback: {
    rating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    comment: {
      type: String,
      maxLength: [500, 'Feedback comment cannot exceed 500 characters']
    },
    submittedAt: Date
  },
  votes: {
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxLength: [500, 'Comment cannot exceed 500 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isOfficial: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  urgencyScore: {
    type: Number,
    default: 0,
    min: [0, 'Urgency score cannot be negative'],
    max: [100, 'Urgency score cannot exceed 100']
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    default: null
  },
  relatedIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  }],
  metadata: {
    deviceInfo: String,
    appVersion: String,
    reportingMethod: {
      type: String,
      enum: ['mobile', 'web', 'phone', 'email'],
      default: 'mobile'
    },
    weatherCondition: String,
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: function() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
      }
    }
  },
  analytics: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    reportCount: { type: Number, default: 1 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ category: 1, priority: 1 });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ assignedDepartment: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ 'location.coordinates': '2dsphere' });
issueSchema.index({ 'location.pincode': 1 });
issueSchema.index({ tags: 1 });
issueSchema.index({ urgencyScore: -1 });
issueSchema.index({ duplicateOf: 1 });

// Compound indexes for common queries
issueSchema.index({ status: 1, priority: -1, createdAt: -1 });
issueSchema.index({ assignedDepartment: 1, status: 1 });
issueSchema.index({ category: 1, 'location.coordinates': '2dsphere' });

// Virtual for vote score
issueSchema.virtual('voteScore').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for days since reported
issueSchema.virtual('daysSinceReported').get(function() {
  return Math.floor((Date.now() - this.timeline.reported.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for resolution time in hours
issueSchema.virtual('resolutionTimeHours').get(function() {
  if (!this.timeline.resolved) return null;
  return Math.round((this.timeline.resolved.getTime() - this.timeline.reported.getTime()) / (1000 * 60 * 60));
});

// Virtual for status display
issueSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Reported',
    'acknowledged': 'Acknowledged',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
    'rejected': 'Rejected'
  };
  return statusMap[this.status] || this.status;
});

const Issue = mongoose.model('Issue', issueSchema);

module.exports = { Issue };