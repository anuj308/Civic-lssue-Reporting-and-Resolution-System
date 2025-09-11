# API Documentation

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.civic-issue.jharkhand.gov.in/api`

## Authentication

All API endpoints require authentication unless specified otherwise. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  },
  "pagination": {  // Only for paginated responses
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error description"
  }
}
```

## Endpoints

### 1. Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "9876543210",
  "role": "citizen",
  "address": {
    "street": "123 Main Street",
    "city": "Ranchi",
    "state": "Jharkhand",
    "pincode": "834001",
    "coordinates": {
      "latitude": 23.3441,
      "longitude": 85.3096
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "citizen",
      "isVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "citizen"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

### 2. Issues

#### GET /issues
Get list of issues with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status
- `category` (string): Filter by category
- `priority` (string): Filter by priority
- `assignedDepartment` (string): Filter by department ID
- `search` (string): Search in title and description
- `lat` (number): Latitude for location-based search
- `lng` (number): Longitude for location-based search
- `radius` (number): Search radius in kilometers
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): Sort order - asc/desc (default: desc)

**Response:**
```json
{
  "success": true,
  "message": "Issues retrieved successfully",
  "data": {
    "issues": [
      {
        "_id": "64a1b2c3d4e5f6789",
        "title": "Pothole on Main Street",
        "description": "Large pothole causing traffic issues",
        "category": "pothole",
        "priority": "high",
        "status": "pending",
        "location": {
          "address": "Main Street, Ranchi",
          "coordinates": {
            "latitude": 23.3441,
            "longitude": 85.3096
          }
        },
        "media": {
          "images": ["https://cloudinary.com/image1.jpg"]
        },
        "reportedBy": {
          "_id": "64a1b2c3d4e5f6788",
          "name": "John Doe"
        },
        "timeline": {
          "reported": "2023-07-01T10:30:00Z"
        },
        "votes": {
          "upvotes": [],
          "downvotes": []
        },
        "createdAt": "2023-07-01T10:30:00Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### GET /issues/:id
Get specific issue details.

**Response:**
```json
{
  "success": true,
  "message": "Issue retrieved successfully",
  "data": {
    "issue": {
      "_id": "64a1b2c3d4e5f6789",
      "title": "Pothole on Main Street",
      "description": "Large pothole causing traffic issues",
      "category": "pothole",
      "priority": "high",
      "status": "pending",
      "location": {
        "address": "Main Street, Ranchi",
        "coordinates": {
          "latitude": 23.3441,
          "longitude": 85.3096
        }
      },
      "media": {
        "images": ["https://cloudinary.com/image1.jpg"],
        "videos": [],
        "audio": null
      },
      "reportedBy": {
        "_id": "64a1b2c3d4e5f6788",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "assignedTo": null,
      "assignedDepartment": null,
      "timeline": {
        "reported": "2023-07-01T10:30:00Z",
        "acknowledged": null,
        "started": null,
        "resolved": null
      },
      "comments": [],
      "votes": {
        "upvotes": [],
        "downvotes": []
      },
      "tags": ["urgent", "traffic"],
      "analytics": {
        "views": 15,
        "shares": 2
      },
      "createdAt": "2023-07-01T10:30:00Z",
      "updatedAt": "2023-07-01T10:30:00Z"
    }
  }
}
```

#### POST /issues
Create a new issue report.

**Request Body:**
```json
{
  "title": "Broken streetlight",
  "description": "Streetlight not working for 3 days",
  "category": "streetlight",
  "location": {
    "address": "Park Avenue, Ranchi",
    "city": "Ranchi",
    "state": "Jharkhand",
    "pincode": "834001",
    "coordinates": {
      "latitude": 23.3441,
      "longitude": 85.3096
    },
    "landmark": "Near City Park"
  },
  "media": {
    "images": ["base64_encoded_image_data"]
  },
  "tags": ["urgent", "safety"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Issue reported successfully",
  "data": {
    "issue": {
      "_id": "64a1b2c3d4e5f6790",
      "title": "Broken streetlight",
      "description": "Streetlight not working for 3 days",
      "category": "streetlight",
      "priority": "medium",
      "status": "pending",
      "reportedBy": "64a1b2c3d4e5f6788",
      "location": {
        "address": "Park Avenue, Ranchi",
        "coordinates": {
          "latitude": 23.3441,
          "longitude": 85.3096
        }
      },
      "media": {
        "images": ["https://cloudinary.com/image2.jpg"]
      },
      "timeline": {
        "reported": "2023-07-01T11:00:00Z"
      },
      "createdAt": "2023-07-01T11:00:00Z"
    }
  }
}
```

#### PUT /issues/:id/status
Update issue status (Admin/Department only).

**Request Body:**
```json
{
  "status": "acknowledged",
  "assignedTo": "64a1b2c3d4e5f6791",
  "estimatedResolution": "2023-07-05T10:00:00Z",
  "comment": "Issue acknowledged, work will start tomorrow"
}
```

#### POST /issues/:id/comments
Add a comment to an issue.

**Request Body:**
```json
{
  "message": "I've also noticed this issue",
  "isOfficial": false
}
```

#### POST /issues/:id/vote
Vote on an issue (upvote/downvote).

**Request Body:**
```json
{
  "voteType": "upvote"  // or "downvote"
}
```

### 3. Users

#### GET /users/profile
Get current user's profile.

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6788",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "citizen",
      "profileImage": "https://cloudinary.com/profile.jpg",
      "address": {
        "street": "123 Main Street",
        "city": "Ranchi",
        "state": "Jharkhand",
        "pincode": "834001"
      },
      "preferences": {
        "emailNotifications": true,
        "pushNotifications": true,
        "smsNotifications": false
      },
      "stats": {
        "totalReports": 5,
        "resolvedReports": 3,
        "averageRating": 4.2
      }
    }
  }
}
```

#### PUT /users/profile
Update user profile.

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "9876543211",
  "address": {
    "street": "456 New Street",
    "city": "Ranchi",
    "pincode": "834002"
  },
  "preferences": {
    "emailNotifications": false,
    "pushNotifications": true
  }
}
```

#### GET /users (Admin only)
Get list of users with filtering.

**Query Parameters:**
- `page`, `limit`, `search`, `role`, `department`, `isActive`

### 4. Departments

#### GET /departments
Get list of departments.

**Response:**
```json
{
  "success": true,
  "message": "Departments retrieved successfully",
  "data": {
    "departments": [
      {
        "_id": "64a1b2c3d4e5f6792",
        "name": "Public Works Department",
        "code": "PWD",
        "description": "Handles road maintenance and infrastructure",
        "categories": ["pothole", "road_maintenance", "streetlight"],
        "contactEmail": "pwd@jharkhand.gov.in",
        "contactPhone": "9876543200",
        "responseTime": {
          "acknowledge": 24,
          "resolve": 72
        },
        "stats": {
          "currentBacklog": 15,
          "averageResponseTime": 18,
          "efficiencyRate": 85
        }
      }
    ]
  }
}
```

### 5. Analytics

#### GET /analytics/dashboard
Get dashboard analytics data.

**Query Parameters:**
- `period` (string): time period - day/week/month/year
- `startDate` (date): start date for custom period
- `endDate` (date): end date for custom period

**Response:**
```json
{
  "success": true,
  "message": "Analytics data retrieved successfully",
  "data": {
    "summary": {
      "totalIssues": 1250,
      "pendingIssues": 45,
      "resolvedIssues": 1100,
      "averageResolutionTime": 48.5,
      "citizenSatisfaction": 4.2
    },
    "issuesByCategory": [
      { "category": "pothole", "count": 350 },
      { "category": "streetlight", "count": 200 },
      { "category": "garbage", "count": 150 }
    ],
    "issuesByStatus": [
      { "status": "resolved", "count": 1100 },
      { "status": "pending", "count": 45 },
      { "status": "in_progress", "count": 105 }
    ],
    "departmentPerformance": [
      {
        "department": "Public Works Department",
        "assigned": 500,
        "resolved": 450,
        "efficiency": 90
      }
    ],
    "issuesTrend": [
      { "date": "2023-07-01", "count": 15 },
      { "date": "2023-07-02", "count": 22 }
    ]
  }
}
```

### 6. Notifications

#### GET /notifications
Get user notifications.

**Query Parameters:**
- `page`, `limit`, `isRead`, `type`

#### PUT /notifications/:id/read
Mark notification as read.

#### POST /notifications/register-device
Register device for push notifications.

**Request Body:**
```json
{
  "fcmToken": "firebase_cloud_messaging_token",
  "deviceType": "android"  // or "ios"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `SERVER_ERROR` | Internal server error |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `FILE_UPLOAD_ERROR` | File upload failed |
| `EXTERNAL_SERVICE_ERROR` | External service unavailable |

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **File upload endpoints**: 10 requests per 15 minutes per user
- **Search endpoints**: 50 requests per 15 minutes per user

## File Upload

### Image Upload
- **Formats**: JPEG, PNG, WebP
- **Max size**: 10MB per file
- **Max files**: 5 per issue
- **Processing**: Automatic compression and optimization

### Video Upload
- **Formats**: MP4, MOV, AVI
- **Max size**: 50MB per file
- **Max duration**: 2 minutes

### Audio Upload
- **Formats**: MP3, WAV, AAC
- **Max size**: 10MB per file
- **Max duration**: 5 minutes

## Webhooks

### Issue Status Change
Webhook endpoint will be called when issue status changes.

**Payload:**
```json
{
  "event": "issue.status_changed",
  "timestamp": "2023-07-01T12:00:00Z",
  "data": {
    "issueId": "64a1b2c3d4e5f6789",
    "previousStatus": "pending",
    "currentStatus": "acknowledged",
    "changedBy": "64a1b2c3d4e5f6791"
  }
}
```

## SDK and Libraries

### JavaScript/Node.js
```bash
npm install civic-issue-sdk
```

### React Native
```bash
npm install civic-issue-react-native
```

### Python
```bash
pip install civic-issue-python
```

This API documentation provides comprehensive information for integrating with the Civic Issue Reporting System.
