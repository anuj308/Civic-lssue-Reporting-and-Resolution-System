# Civic Issue Reporting and Resolution System

## 🌟 Project Overview

A comprehensive mobile-first platform that empowers citizens to report civic issues and enables municipal authorities to efficiently track, prioritize, and resolve them. Built for the Government of Jharkhand's Clean & Green Technology initiative.

## 🚀 Features

### Citizen Features
- **Real-time Issue Reporting**: Photo capture, GPS location, voice/text descriptions
- **Issue Reels Interface**: TikTok-style browsing with map toggle and video playback
- **Progress Tracking**: Real-time status updates and notifications
- **Issue Categories**: Potholes, streetlights, waste management, infrastructure, etc.
- **Community Engagement**: Vote on issue priority, add comments, share issues
- **Interactive Maps**: Google Maps integration with issue markers and location filtering

### Administrative Features
- **Interactive Dashboard**: Live map with reported issues and analytics
- **Issue Management**: Comprehensive CRUD operations with status workflows
- **Automated Routing**: AI-powered department assignment
- **Priority Management**: Configurable urgency algorithms
- **Analytics & Reporting**: Performance metrics and insights
- **Multi-department Coordination**: Workflow management and notifications
- **User Management**: Role-based access control for admins and departments

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Dashboard  │    │   Admin Panel   │
│  (React Native)│    │     (React)      │    │     (React)     │
│     + Expo      │    │   + TypeScript   │    │   + Material-UI │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │              ┌───────▼───────┐               │
          └──────────────►│   API Gateway │◄──────────────┘
                         │   (Express)   │
                         └───────┬───────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Backend Services   │
                    │  ┌─────────────────────┐│
                    │  │  Issue Management   ││
                    │  │  User Management    ││
                    │  │  Notification       ││
                    │  │  Analytics          ││
                    │  │  File Storage       ││
                    │  │  Session Management ││
                    │  │  Security Services  ││
                    │  └─────────────────────┘│
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Data Layer         │
                    │  ┌─────────────────────┐│
                    │  │    MongoDB          ││
                    │  │    Redis Cache      ││
                    │  │    Cloudinary       ││
                    │  │    AWS S3           ││
                    │  └─────────────────────┘│
                    └─────────────────────────┘
```

## 📱 Technology Stack

### Frontend (Web Dashboard)
- **Framework**: React 18, TypeScript, Vite
- **UI Library**: Material-UI (MUI) v5, Emotion
- **State Management**: Redux Toolkit, Redux Persist
- **Maps**: Google Maps API, React-Google-Maps
- **Charts**: Chart.js, React-ChartJS-2
- **Forms**: React Hook Form, Yup validation
- **HTTP Client**: Axios with interceptors
- **Real-time**: Socket.IO client
- **File Upload**: React Dropzone

### Mobile App
- **Framework**: React Native, Expo SDK 54
- **Navigation**: React Navigation v6 (Stack, Tab, Drawer)
- **State Management**: Redux Toolkit, Redux Persist
- **UI Library**: React Native Paper, Material Design 3
- **Maps**: React Native Maps
- **Camera**: Expo Camera, Image Picker
- **Storage**: AsyncStorage
- **Notifications**: Expo Notifications
- **Location**: Expo Location

### Backend
- **Runtime**: Node.js 18+, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for sessions and caching
- **Authentication**: JWT with refresh tokens
- **File Storage**: Cloudinary (images), AWS S3 (documents)
- **Email**: Nodemailer with SMTP
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: Express Validator, Joi
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI

### Infrastructure & DevOps
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (EC2, S3, CloudFront, SES)
- **Monitoring**: Winston logging, Morgan HTTP logging
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint, Prettier, TypeScript

## 🎨 Design System

### Color Palette
```css
:root {
  --primary-green: #2E7D32;      /* Primary Green */
  --primary-light: #4CAF50;      /* Light Green */
  --primary-dark: #1B5E20;       /* Dark Green */
  --secondary-blue: #1976D2;     /* Government Blue */
  --warning-orange: #FF9800;     /* Warning/Pending */
  --error-red: #D32F2F;          /* Critical Issues */
  --success-green: #388E3C;      /* Resolved */
  --background-light: #F8F9FA;   /* Light Background */
  --text-primary: #212121;       /* Primary Text */
  --text-secondary: #757575;     /* Secondary Text */
}
```

### Typography
- **Primary Font**: Inter (Web), San Francisco (iOS), Roboto (Android)
- **Heading Scale**: 32px, 24px, 20px, 18px, 16px
- **Body Text**: 16px, 14px, 12px

## 🗂️ Project Structure

```
civic-issue-system/
├── backend/                    # Node.js/Express Backend API
│   ├── Dockerfile             # Backend containerization
│   ├── package.json           # Backend dependencies
│   └── src/
│       ├── server.js          # Main server entry point
│       ├── config/
│       │   ├── database.js    # MongoDB connection config
│       │   └── redis.js       # Redis cache config
│       ├── controllers/       # Route controllers
│       │   ├── authController.js      # Authentication logic
│       │   ├── issueController.js     # Issue management
│       │   ├── securityAlertController.js # Security monitoring
│       │   └── sessionController.js   # Session management
│       ├── middleware/        # Custom middleware
│       │   ├── auth.js        # JWT authentication
│       │   ├── errorHandler.js # Error handling
│       │   ├── notFound.js    # 404 handler
│       │   └── upload.js      # File upload middleware
│       ├── models/           # Mongoose database models
│       │   ├── Department.js  # Department schema
│       │   ├── Issue.js       # Issue schema with geospatial
│       │   ├── Notification.js # Notification schema
│       │   ├── SecurityAlert.js # Security alert schema
│       │   ├── Session.js     # User session schema
│       │   └── User.js        # User schema
│       ├── routes/           # API route definitions
│       │   ├── auth.js        # Authentication routes
│       │   ├── issues.js      # Issue CRUD routes
│       │   ├── sessions.js    # Session management routes
│       │   └── users.js       # User management routes
│       └── utils/            # Utility functions
│           ├── cloudinaryService.js # Cloudinary integration
│           ├── emailService.js      # Email notifications
│           ├── jwt.js              # JWT token utilities
│           └── locationService.js  # Location/geocoding services
├── frontend/                  # React TypeScript Web Dashboard
│   ├── Dockerfile             # Frontend containerization
│   ├── package.json           # Frontend dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── vite.config.ts         # Vite build configuration
│   ├── index.html             # Main HTML template
│   ├── public/                # Static assets
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   └── manifest.json      # PWA manifest
│   ├── src/
│   │   ├── App.tsx            # Main React app component
│   │   ├── index.tsx          # React entry point
│   │   ├── vite-env.d.ts      # Vite environment types
│   │   ├── components/        # Reusable React components
│   │   │   └── Auth/          # Authentication components
│   │   │   └── Layout/        # Layout components
│   │   ├── pages/             # Page-level components
│   │   │   ├── Auth/          # Authentication pages
│   │   │   ├── Dashboard/     # Dashboard pages
│   │   │   ├── Issues/        # Issue management pages
│   │   │   ├── User/          # User profile pages
│   │   │   └── Users/         # User management pages
│   │   ├── services/          # API service layer
│   │   │   └── api.ts         # Axios API client
│   │   ├── store/             # Redux state management
│   │   │   ├── store.ts       # Redux store configuration
│   │   │   └── slices/        # Redux slices
│   │   ├── theme/             # Material-UI theme
│   │   │   └── theme.ts       # Theme configuration
│   │   └── utils/             # Frontend utilities
│   │       ├── mapUtils.ts    # Map utility functions
│   │       └── toast.ts       # Toast notification utilities
│   └── build/                 # Built assets (generated)
├── mobile/                    # React Native Expo App
│   ├── app.json               # Expo app configuration
│   ├── App.tsx                # Main React Native app
│   ├── babel.config.js        # Babel configuration
│   ├── eas.json               # EAS Build configuration
│   ├── index.js               # Metro bundler entry
│   ├── metro.config.js        # Metro bundler config
│   ├── package.json           # Mobile dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── README.md              # Mobile-specific docs
│   ├── assets/                # Static assets
│   └── src/
│       ├── components/        # Reusable mobile components
│       │   └── LoadingScreen.tsx # Loading screen component
│       ├── navigation/        # Navigation configuration
│       │   ├── AppNavigator.tsx     # Root navigator
│       │   ├── AuthNavigator.tsx    # Auth flow navigator
│       │   ├── MainTabNavigator.tsx # Main app tabs
│       │   └── types.ts             # Navigation types
│       ├── screens/           # Screen components
│       │   ├── auth/          # Authentication screens
│       │   └── main/          # Main app screens
│       ├── services/          # Mobile API services
│       │   ├── api.ts               # API client
│       │   └── notificationService.ts # Push notifications
│       ├── store/             # Redux state management
│       │   ├── store.ts       # Store configuration
│       │   └── slices/        # Redux slices
│       ├── theme/             # Theme configuration
│       │   └── index.ts       # Theme exports
│       └── utils/             # Mobile utilities
│           └── theme.ts       # Theme utilities
├── deployment/               # Infrastructure & Deployment
│   └── docker-compose.yml    # Local development stack
├── docs/                     # Documentation
│   ├── api/
│   │   └── API_DOCUMENTATION.md # API reference
│   └── architecture/
│       ├── DATABASE_SCHEMA.md    # Database design
│       └── SYSTEM_ARCHITECTURE.md # System design
├── .github/                  # GitHub configuration
│   └── copilot-instructions.md # AI development guide
├── CONTRIBUTING.md           # Contribution guidelines
├── LICENSE                   # MIT License
├── README.md                 # This file
└── setup.sh                  # Development setup script
```

## � Key Components Status

### Backend API (Node.js/Express)
- ✅ **Authentication System**: JWT + Refresh tokens, OTP verification
- ✅ **Issue Management**: Full CRUD with geospatial queries
- ✅ **User Management**: Multi-role system (Citizen, Admin, Department)
- ✅ **File Upload**: Cloudinary integration for images/videos
- ✅ **Email Service**: Nodemailer with SMTP for notifications
- ✅ **Session Management**: Redis-based session tracking
- ✅ **Security**: Helmet, CORS, rate limiting, audit logs
- ✅ **Real-time**: Socket.IO for live notifications

### Frontend Dashboard (React/TypeScript)
- ✅ **Issue Reels Interface**: TikTok-style browsing with video playback
- ✅ **Interactive Maps**: Google Maps with issue markers and clustering
- ✅ **Admin Dashboard**: Analytics, user management, issue tracking
- ✅ **Authentication**: Login/register with OTP verification
- ✅ **File Upload**: Drag-and-drop with progress indicators
- ✅ **Real-time Updates**: WebSocket integration for live status
- ✅ **Responsive Design**: Material-UI with mobile-first approach

### Mobile App (React Native/Expo)
- ✅ **Navigation Setup**: Stack, Tab, and Drawer navigation
- ✅ **Authentication Flow**: Login/register with OTP
- ✅ **State Management**: Redux Toolkit with persistence
- ✅ **UI Components**: Material Design 3 with React Native Paper
- ✅ **Camera Integration**: Photo capture for issue reporting
- ✅ **Location Services**: GPS coordinates for issue location
- ✅ **Push Notifications**: Expo Notifications setup
- 🚧 **Issue Reporting**: Basic form implementation (in progress)
- 🚧 **Issue Browsing**: Reels interface (in progress)

### Database & Infrastructure
- ✅ **MongoDB**: Geospatial indexing, compound indexes
- ✅ **Redis**: Caching, session storage, pub/sub
- ✅ **Docker**: Containerized development environment
- ✅ **Cloudinary**: Image/video storage and optimization
- ✅ **AWS S3**: Document storage backup
- ✅ **Google Maps API**: Location services and mapping

## �🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (v5+)
- Redis (v6+)
- React Native CLI
- Android Studio / Xcode

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/anuj308/Civic-lssue-Reporting-and-Resolution-System.git
cd Civic-lssue-Reporting-and-Resolution-System
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install
npm start
```

4. **Setup Mobile App**
```bash
cd mobile
npm install
npx expo start
```

### Development Workflow

1. **Backend Development**
```bash
cd backend
npm install
cp .env.example .env  # Configure MongoDB, Redis, JWT secrets
npm run dev          # Starts with nodemon for hot reload
```

2. **Frontend Development**
```bash
cd frontend
npm install
npm start            # Vite dev server with hot reload
# Access at http://localhost:3000 (proxies to backend:5000)
```

3. **Mobile Development**
```bash
cd mobile
npm install
npx expo start       # Expo development server
# Scan QR code with Expo Go app or use simulator
```

4. **Full Stack Development**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm start

# Terminal 3: Mobile (optional)
cd mobile && npx expo start
```

### Environment Configuration

**Required Environment Variables:**
```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/civic-issues
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
GOOGLE_MAPS_API_KEY=your-google-maps-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Mobile (app.json or .env)
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

## 🛠️ Development Best Practices

### Code Quality
- **TypeScript**: Strict type checking enabled across all projects
- **ESLint + Prettier**: Automated code formatting and linting
- **Pre-commit Hooks**: Husky for quality gates
- **Testing**: Jest for unit tests, React Testing Library for components

### State Management Patterns
- **Redux Toolkit**: Standardized slice structure with async thunks
- **Persistence**: Selective state persistence (auth/ui slices only)
- **Typed Hooks**: Use `useAppDispatch()` and `useAppSelector()` consistently

### API Design Principles
- **RESTful Routes**: Consistent endpoint naming and HTTP methods
- **Validation**: Express-validator with comprehensive error messages
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Authentication**: JWT middleware for protected routes

### Database Best Practices
- **Geospatial Queries**: 2dsphere indexing for location-based searches
- **Compound Indexes**: Optimized for common query patterns
- **Data Validation**: Mongoose schema validation with custom validators
- **Connection Pooling**: Efficient MongoDB connection management

### Security Standards
- **Input Sanitization**: All user inputs validated and sanitized
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Session Management**: Secure session handling with Redis

## 📊 Key Metrics & KPIs

- **Response Time**: Average time from report to acknowledgment
- **Resolution Rate**: Percentage of issues resolved within SLA
- **Citizen Satisfaction**: User ratings and feedback
- **Department Efficiency**: Issues resolved per department
- **System Performance**: API response times, uptime

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Data encryption in transit and at rest
- Image sanitization and virus scanning
- Rate limiting and DDoS protection
- GDPR compliance for user data

## 📈 Scalability Features

- Horizontal scaling with load balancers
- Database sharding for high volume
- CDN for global image delivery
- Microservices architecture
- Auto-scaling based on traffic

## 📈 Recent Updates

### v1.1.0 - Issue Reels & Enhanced UX
- ✅ **Issue Reels Interface**: TikTok-style browsing with video playback
- ✅ **Interactive Maps**: Google Maps integration with issue markers
- ✅ **Deduplication Logic**: Prevents duplicate issues in feeds
- ✅ **Enhanced Authentication**: OTP verification and session management
- ✅ **Real-time Notifications**: WebSocket-based status updates
- ✅ **Mobile App Foundation**: Complete React Native setup with Expo
- ✅ **Security Enhancements**: Advanced session tracking and audit logs
- ✅ **Performance Optimization**: Redis caching and query optimization

### v1.0.0 - Core Platform
- ✅ Complete issue lifecycle management
- ✅ Multi-role user system (Citizen, Admin, Department)
- ✅ File upload and cloud storage integration
- ✅ Email notifications and communication
- ✅ Basic analytics and reporting
- ✅ RESTful API with comprehensive documentation

## 🚀 Deployment & Production

### Docker Deployment
```bash
# Build and run with Docker Compose
cd deployment
docker-compose up -d

# Scale services as needed
docker-compose up -d --scale backend=3
```

### Environment Setup for Production
```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/civic-prod
REDIS_URL=redis://prod-redis-server:6379
JWT_SECRET=your-production-jwt-secret
CLOUDINARY_CLOUD_NAME=your-prod-cloud-name
GOOGLE_MAPS_API_KEY=your-prod-maps-key
```

### Performance Optimization
- **Database Indexing**: Optimized compound indexes for query performance
- **Caching Strategy**: Redis caching for frequently accessed data
- **CDN Integration**: CloudFront for global static asset delivery
- **Load Balancing**: Nginx reverse proxy with upstream configuration
- **Monitoring**: Application performance monitoring and alerting

### Backup & Recovery
- **Database Backups**: Automated MongoDB backups with retention policies
- **File Storage**: Multi-region replication for Cloudinary/AWS S3
- **Disaster Recovery**: Cross-region failover capabilities
- **Data Export**: Scheduled data exports for compliance and analytics

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and queries, contact:
- **Email**: support@jharkhand.gov.in
- **Documentation**: [API Docs](docs/api/README.md)
- **Issues**: GitHub Issues tab

---

*Built with ❤️ for the Government of Jharkhand*