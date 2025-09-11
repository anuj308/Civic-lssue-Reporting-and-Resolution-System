# Database Schema Design

## Overview

The Civic Issue Reporting System uses MongoDB as the primary database due to its flexibility in handling geospatial data, document structure, and scalability requirements.

## Collections

### 1. Users Collection

```javascript
{
  _id: ObjectId,
  name: String,              // Full name
  email: String,             // Unique email address
  password: String,          // Hashed password (bcrypt)
  phone: String,             // Indian mobile number
  role: String,              // 'citizen', 'admin', 'department_head', 'field_worker'
  department: ObjectId,      // Reference to Department collection
  profileImage: String,      // Cloudinary URL
  isActive: Boolean,         // Account status
  isVerified: Boolean,       // Email verification status
  fcmToken: String,          // Firebase Cloud Messaging token
  
  address: {
    street: String,
    city: String,
    state: String,           // Default: 'Jharkhand'
    pincode: String,         // 6-digit pincode
    coordinates: {
      latitude: Number,      // GPS coordinates
      longitude: Number
    }
  },
  
  preferences: {
    emailNotifications: Boolean,
    pushNotifications: Boolean,
    smsNotifications: Boolean
  },
  
  stats: {
    totalReports: Number,    // Total issues reported
    resolvedReports: Number, // Successfully resolved issues
    averageRating: Number    // Average rating from resolved issues
  },
  
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ department: 1 })
db.users.createIndex({ "address.coordinates": "2dsphere" })
```

### 2. Issues Collection

```javascript
{
  _id: ObjectId,
  title: String,             // Brief issue title
  description: String,       // Detailed description
  category: String,          // Issue category (enum)
  subcategory: String,       // Optional subcategory
  priority: String,          // 'low', 'medium', 'high', 'critical'
  status: String,            // Current status (enum)
  
  reportedBy: ObjectId,      // Reference to Users collection
  assignedTo: ObjectId,      // Reference to Users collection
  assignedDepartment: ObjectId, // Reference to Departments collection
  
  location: {
    address: String,         // Full address
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,      // GPS coordinates
      longitude: Number
    },
    landmark: String         // Optional landmark
  },
  
  media: {
    images: [String],        // Array of Cloudinary URLs
    videos: [String],        // Array of video URLs
    audio: String            // Voice description URL
  },
  
  timeline: {
    reported: Date,          // When issue was reported
    acknowledged: Date,      // When department acknowledged
    started: Date,           // When work started
    resolved: Date,          // When issue was resolved
    closed: Date             // When issue was closed
  },
  
  estimatedResolution: Date, // Expected resolution date
  actualResolution: Date,    // Actual resolution date
  
  resolution: {
    description: String,     // Resolution details
    resolvedBy: ObjectId,    // Reference to Users collection
    images: [String],        // Before/after images
    cost: Number,            // Resolution cost
    resources: [String]      // Resources used
  },
  
  feedback: {
    rating: Number,          // 1-5 star rating
    comment: String,         // User feedback
    submittedAt: Date
  },
  
  votes: {
    upvotes: [ObjectId],     // Array of User IDs
    downvotes: [ObjectId]    // Array of User IDs
  },
  
  comments: [{
    user: ObjectId,          // Reference to Users collection
    message: String,
    timestamp: Date,
    isOfficial: Boolean     // From department/admin
  }],
  
  tags: [String],            // Searchable tags
  isPublic: Boolean,         // Visibility setting
  urgencyScore: Number,      // Calculated urgency (0-100)
  duplicateOf: ObjectId,     // Reference to original issue
  relatedIssues: [ObjectId], // Array of related issue IDs
  
  metadata: {
    deviceInfo: String,      // Device information
    appVersion: String,      // App version
    reportingMethod: String, // 'mobile', 'web', 'phone', 'email'
    weatherCondition: String,
    timeOfDay: String        // 'morning', 'afternoon', 'evening', 'night'
  },
  
  analytics: {
    views: Number,           // Number of views
    shares: Number,          // Number of shares
    reportCount: Number      // How many times reported
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.issues.createIndex({ status: 1, createdAt: -1 })
db.issues.createIndex({ category: 1, priority: 1 })
db.issues.createIndex({ reportedBy: 1 })
db.issues.createIndex({ assignedDepartment: 1 })
db.issues.createIndex({ assignedTo: 1 })
db.issues.createIndex({ "location.coordinates": "2dsphere" })
db.issues.createIndex({ "location.pincode": 1 })
db.issues.createIndex({ tags: 1 })
db.issues.createIndex({ urgencyScore: -1 })
db.issues.createIndex({ duplicateOf: 1 })

// Compound indexes for common queries
db.issues.createIndex({ status: 1, priority: -1, createdAt: -1 })
db.issues.createIndex({ assignedDepartment: 1, status: 1 })
db.issues.createIndex({ category: 1, "location.coordinates": "2dsphere" })
```

### 3. Departments Collection

```javascript
{
  _id: ObjectId,
  name: String,              // Department name
  code: String,              // Unique department code
  description: String,       // Department description
  head: ObjectId,            // Reference to Users collection
  contactEmail: String,      // Department contact email
  contactPhone: String,      // Department contact phone
  isActive: Boolean,         // Department status
  
  categories: [String],      // Issue categories handled
  priority: Number,          // Default priority level (1-5)
  
  responseTime: {
    acknowledge: Number,     // Hours to acknowledge
    resolve: Number          // Hours to resolve
  },
  
  workingHours: {
    start: String,           // Start time (HH:MM format)
    end: String,             // End time (HH:MM format)
    workingDays: [Number]    // 0=Sunday, 1=Monday, etc.
  },
  
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  stats: {
    totalAssigned: Number,   // Total issues assigned
    totalResolved: Number,   // Total issues resolved
    averageResponseTime: Number, // Average response time (hours)
    averageResolutionTime: Number, // Average resolution time (hours)
    currentBacklog: Number   // Current pending issues
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.departments.createIndex({ code: 1 }, { unique: true })
db.departments.createIndex({ isActive: 1 })
db.departments.createIndex({ categories: 1 })
db.departments.createIndex({ head: 1 })
```

### 4. Notifications Collection

```javascript
{
  _id: ObjectId,
  recipient: ObjectId,       // Reference to Users collection
  title: String,             // Notification title
  message: String,           // Notification message
  type: String,              // 'issue_update', 'assignment', 'reminder', etc.
  priority: String,          // 'low', 'medium', 'high'
  
  data: {
    issueId: ObjectId,       // Related issue ID
    departmentId: ObjectId,  // Related department ID
    actionUrl: String        // Deep link URL
  },
  
  channels: {
    push: {
      sent: Boolean,
      sentAt: Date,
      status: String         // 'sent', 'delivered', 'failed'
    },
    email: {
      sent: Boolean,
      sentAt: Date,
      status: String
    },
    sms: {
      sent: Boolean,
      sentAt: Date,
      status: String
    }
  },
  
  isRead: Boolean,
  readAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.notifications.createIndex({ recipient: 1, createdAt: -1 })
db.notifications.createIndex({ type: 1 })
db.notifications.createIndex({ isRead: 1 })
```

### 5. Analytics Collection

```javascript
{
  _id: ObjectId,
  date: Date,                // Date for the analytics data
  type: String,              // 'daily', 'weekly', 'monthly'
  
  issueStats: {
    total: Number,           // Total issues
    byCategory: [{
      category: String,
      count: Number
    }],
    byStatus: [{
      status: String,
      count: Number
    }],
    byPriority: [{
      priority: String,
      count: Number
    }]
  },
  
  departmentStats: [{
    departmentId: ObjectId,
    departmentName: String,
    assigned: Number,        // Issues assigned
    resolved: Number,        // Issues resolved
    avgResponseTime: Number, // Average response time
    avgResolutionTime: Number, // Average resolution time
    efficiency: Number       // Resolution rate percentage
  }],
  
  userStats: {
    totalUsers: Number,
    activeUsers: Number,     // Users active in period
    newRegistrations: Number
  },
  
  locationStats: [{
    pincode: String,
    city: String,
    issueCount: Number,
    resolvedCount: Number
  }],
  
  performanceMetrics: {
    avgResponseTime: Number, // Overall average response time
    avgResolutionTime: Number, // Overall average resolution time
    satisfactionRating: Number, // Average satisfaction rating
    duplicateRate: Number    // Percentage of duplicate issues
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.analytics.createIndex({ date: -1, type: 1 })
db.analytics.createIndex({ type: 1 })
```

### 6. Audit Logs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // User performing the action
  action: String,            // Action performed
  resource: String,          // Resource affected (issue, user, etc.)
  resourceId: ObjectId,      // ID of the affected resource
  
  changes: {
    before: Object,          // State before change
    after: Object            // State after change
  },
  
  metadata: {
    ipAddress: String,       // User's IP address
    userAgent: String,       // User's browser/app info
    requestId: String        // Request tracking ID
  },
  
  timestamp: Date
}
```

**Indexes:**
```javascript
db.audit_logs.createIndex({ userId: 1, timestamp: -1 })
db.audit_logs.createIndex({ resource: 1, resourceId: 1 })
db.audit_logs.createIndex({ timestamp: -1 })
```

## Data Relationships

### Entity Relationship Diagram

```
┌─────────────┐    reports    ┌─────────────┐
│    Users    │──────────────▶│   Issues    │
└─────────────┘               └─────────────┘
       │                             │
       │ assigned_to                 │ assigned_to
       │                             │
       ▼                             ▼
┌─────────────┐               ┌─────────────┐
│ Departments │               │    Users    │
└─────────────┘               │(field_worker)│
       │                      └─────────────┘
       │ manages                      │
       │                             │
       ▼                             ▼
┌─────────────┐    receives    ┌─────────────┐
│ Departments │◄──────────────│Notifications│
│(head/admin) │               └─────────────┘
└─────────────┘
```

## Data Validation Rules

### User Data
- Email must be unique and valid format
- Phone must be valid Indian mobile number (10 digits starting with 6-9)
- Password must be at least 8 characters with complexity requirements
- Role must be one of the defined enum values

### Issue Data
- Title and description are required
- Category must be from predefined list
- Location coordinates must be valid GPS coordinates
- Status transitions must follow defined workflow
- Priority can only be set by authorized users

### Department Data
- Department code must be unique and alphanumeric
- Response time must be positive numbers
- Working hours must be in valid time format
- Contact email must be valid format

## Data Migration Strategy

### Version 1.0 to 1.1
```javascript
// Add new fields to existing documents
db.issues.updateMany(
  { analytics: { $exists: false } },
  { $set: { 
    analytics: { views: 0, shares: 0, reportCount: 1 },
    urgencyScore: 50
  }}
)
```

### Indexing Strategy
- Create indexes after bulk data operations
- Use background index creation for production
- Monitor index usage and performance
- Drop unused indexes to improve write performance

## Backup and Recovery

### Backup Strategy
- Daily automated backups at 2 AM IST
- Weekly full backups with 30-day retention
- Monthly archived backups for compliance

### Recovery Procedures
- Point-in-time recovery for last 7 days
- Automated failover to secondary replica
- Cross-region backup for disaster recovery

This database design ensures data integrity, performance, and scalability while supporting all the features required by the Civic Issue Reporting System.
