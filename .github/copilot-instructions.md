# Civic Issue Reporting System - AI Development Guide

## Architecture Overview

This is a **full-stack government civic platform** with a React Native mobile app, React TypeScript web dashboard, and Node.js/Express backend. The system enables citizens to report municipal issues and administrators to manage resolution workflows.

### Core Components
- **Backend**: Express.js API with MongoDB/Redis (`backend/`)
- **Frontend**: React TypeScript web dashboard (`frontend/`)  
- **Mobile**: React Native Expo app (`mobile/`)
- **Deployment**: Docker Compose with Nginx (`deployment/`)

## Critical Development Patterns

### State Management
Both frontend and mobile use **Redux Toolkit** with specific persistence strategies:
- **Frontend**: Only `auth` and `ui` slices persist via localStorage
- **Mobile**: Uses AsyncStorage with `auth` blacklisting loading/error states
- **Typed Hooks**: Use `useAppDispatch()` and `useAppSelector()` in mobile, standard hooks in frontend

### API Architecture
The backend follows a **domain-driven** structure with consistent patterns:

#### Authentication & User Context
**CRITICAL**: Authentication middleware sets `req.user` object, always use `req.user._id` for user ID, NOT `req.user.userId`
```javascript
// Backend controllers - CORRECT usage
reportedBy: req.user._id,
userId: req.user._id.toString()
```

#### Route Validation Pattern
```javascript
// All routes use express-validator with comprehensive validation
const createIssueValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('category').isIn(['pothole', 'streetlight', /* ... */]),
  // Location coordinates and media validation
];
```

#### Issue Model Structure
Issues have complex nested schemas with:
- **Location**: Address + GPS coordinates (uses 2dsphere indexing)
- **Timeline**: Tracks status progression (`reported`, `acknowledged`, `started`, `resolved`)
- **Media**: Arrays for images/videos with cloud storage URLs
- **Votes**: Referenced arrays for upvotes/downvotes

### Mobile Development Conventions

#### Environment Configuration
Mobile API uses **dynamic IP detection** for development:
```typescript
const BASE_URL = __DEV__ 
  ? 'http://192.168.18.101:5000/api' // WiFi IP for Expo Go
  : 'https://production-api.com/api';
```

#### Navigation Structure
- **AuthNavigator**: Welcome, Login, Register, OTP verification
- **MainTabNavigator**: Bottom tabs with nested stack navigation
- **AppNavigator**: Root with auth state switching

#### File Upload Pattern
Mobile uses FormData with specific Expo image picker format:
```typescript
formData.append(key, {
  uri: item.uri,
  type: item.type || 'image/jpeg', 
  name: item.name || 'file.jpg',
} as any);
```

### Authentication Flow
Implements **JWT + Refresh Token** pattern with automatic retry:
- Access tokens stored in memory/AsyncStorage
- Refresh tokens for seamless re-authentication
- 401 responses trigger automatic token refresh before retrying requests

## Development Workflows

### Environment Setup
1. **Backend**: Copy `.env.example`, configure MongoDB/Redis, run `npm run dev`
2. **Frontend**: Proxy to backend on port 5000, uses Material-UI v5
3. **Mobile**: Uses Expo SDK, supports EAS Build for production

### Docker Development
```bash
cd deployment
docker-compose up -d  # MongoDB + Redis + App services
```

### Key Development Commands
- **Backend**: `npm run dev` (nodemon), `npm run lint`
- **Frontend**: `npm start` (proxy setup), `npm run type-check`
- **Mobile**: `npm start` (Expo), `npm run android/ios`, `npm run build:android`

## Database Design Patterns

### Issue Schema Conventions
- Uses **compound indexes** for common queries: `{status: 1, priority: -1, createdAt: -1}`
- **Geospatial indexing** on coordinates for nearby queries
- **Virtual fields** for computed values (voteScore, daysSinceReported)
- **Status enum** progression: `pending → acknowledged → in_progress → resolved`

### Reference Patterns
- Issues reference Users and Departments via ObjectId
- Comments embed user refs with `isOfficial` flag for authority distinction
- Location uses nested schema with both address strings and coordinates

## Integration Points

### External Services
- **Cloudinary** for media upload/storage
- **Nodemailer** for email notifications 
- **Redis** for caching and session management
- **Google Maps** API for location services

### Cross-Platform Data Flow
1. Mobile app creates issues with photos + GPS
2. Backend validates, stores in MongoDB, uploads media to Cloudinary
3. Web dashboard displays issues with real-time status updates
4. Socket.IO enables live notifications across platforms

## Security Implementation
- **Helmet.js** security headers
- **Rate limiting** per IP
- **CORS** configured for specific client origins
- **JWT tokens** with expiration and refresh cycles
- **Input validation** on all routes with express-validator

## Error Handling Conventions
- Backend uses consistent error response format with status codes
- Mobile API service has retry logic with exponential backoff
- Frontend shows user-friendly messages via toast notifications
- All async operations wrapped with try/catch and loading states

## Testing & Deployment
- Uses **Jest** for backend/mobile testing
- **EAS Build** for mobile app compilation and distribution  
- **Docker Compose** for staging/production deployment
- **Nginx** load balancer with SSL termination in production

When working on this codebase, always consider the multi-platform nature and maintain consistency across the backend API contract, mobile Redux patterns, and web dashboard state management.