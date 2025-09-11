#!/bin/bash

# Civic Issue Reporting System - Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# Check prerequisites
print_status "Checking prerequisites..."

check_command "node"
check_command "npm"
check_command "git"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "All prerequisites met!"

# Create project structure
print_status "Setting up project structure..."

# Create environment files
print_status "Setting up environment files..."

# Backend environment
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_success "Created backend/.env from template"
    print_warning "Please configure environment variables in backend/.env"
else
    print_warning "backend/.env already exists"
fi

# Frontend environment
cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
EOF
print_success "Created frontend/.env"

# Mobile environment
cat > mobile/.env << EOF
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EXPO_PUBLIC_ENV=development
EOF
print_success "Created mobile/.env"

# Install dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
cd ..

print_status "Installing frontend dependencies..."
cd frontend
npm install
cd ..

print_status "Installing mobile dependencies..."
cd mobile
npm install
cd ..

# Setup database initialization
print_status "Setting up database initialization script..."
cat > deployment/init-mongo.js << 'EOF'
// MongoDB initialization script
db = db.getSiblingDB('civic_issue_db');

// Create application user
db.createUser({
  user: 'civic_user',
  pwd: 'civic_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'civic_issue_db'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.issues.createIndex({ status: 1, createdAt: -1 });
db.issues.createIndex({ "location.coordinates": "2dsphere" });
db.departments.createIndex({ code: 1 }, { unique: true });

// Insert default departments
db.departments.insertMany([
  {
    name: "Public Works Department",
    code: "PWD",
    description: "Handles road maintenance, streetlights, and infrastructure",
    contactEmail: "pwd@jharkhand.gov.in",
    categories: ["pothole", "road_maintenance", "streetlight"],
    responseTime: { acknowledge: 24, resolve: 72 },
    workingHours: { start: "09:00", end: "18:00", workingDays: [1,2,3,4,5] },
    stats: { totalAssigned: 0, totalResolved: 0, averageResponseTime: 0, averageResolutionTime: 0, currentBacklog: 0 },
    isActive: true
  },
  {
    name: "Sanitation Department", 
    code: "SAN",
    description: "Manages waste collection and disposal",
    contactEmail: "sanitation@jharkhand.gov.in",
    categories: ["garbage", "sewerage"],
    responseTime: { acknowledge: 12, resolve: 48 },
    workingHours: { start: "06:00", end: "20:00", workingDays: [1,2,3,4,5,6] },
    stats: { totalAssigned: 0, totalResolved: 0, averageResponseTime: 0, averageResolutionTime: 0, currentBacklog: 0 },
    isActive: true
  },
  {
    name: "Water Supply Department",
    code: "WSD", 
    description: "Manages water supply and distribution",
    contactEmail: "water@jharkhand.gov.in",
    categories: ["water_supply"],
    responseTime: { acknowledge: 6, resolve: 24 },
    workingHours: { start: "08:00", end: "17:00", workingDays: [1,2,3,4,5] },
    stats: { totalAssigned: 0, totalResolved: 0, averageResponseTime: 0, averageResolutionTime: 0, currentBacklog: 0 },
    isActive: true
  }
]);

// Insert default admin user
db.users.insertOne({
  name: "System Administrator",
  email: "admin@jharkhand.gov.in",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.y8fJ8LN9U5zGZMr5.",  // Admin@123
  role: "admin",
  isActive: true,
  isVerified: true,
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false
  },
  stats: {
    totalReports: 0,
    resolvedReports: 0,
    averageRating: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print("Database initialized successfully!");
EOF

print_success "Created database initialization script"

# Create Docker environment file
cat > deployment/.env << EOF
# MongoDB Configuration
MONGO_ROOT_PASSWORD=root_password_123
MONGO_USER_PASSWORD=civic_password_123

# Redis Configuration  
REDIS_PASSWORD=redis_password_123

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_for_production
JWT_REFRESH_SECRET=your_refresh_token_secret_for_production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EOF

print_success "Created Docker environment file"

# Create nginx configuration
mkdir -p deployment/nginx
cat > deployment/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }
    }
}
EOF

print_success "Created nginx configuration"

# Create VSCode settings
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.expo": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.expo": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  }
}
EOF

cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/server.ts",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "envFile": "${workspaceFolder}/backend/.env",
      "runtimeArgs": ["-r", "ts-node/register"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
EOF

print_success "Created VSCode configuration"

# Create development scripts
cat > dev.sh << 'EOF'
#!/bin/bash

# Development startup script

echo "🚀 Starting Civic Issue Reporting System Development Environment"

# Function to handle cleanup
cleanup() {
    echo "🛑 Shutting down services..."
    kill 0
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start services in background
echo "📊 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "🌐 Starting frontend server..." 
cd frontend && npm start &
FRONTEND_PID=$!

echo "📱 Starting mobile development server..."
cd mobile && npx expo start &
MOBILE_PID=$!

echo "✅ All services started!"
echo "📍 Backend:  http://localhost:5000"
echo "📍 Frontend: http://localhost:3000" 
echo "📍 Mobile:   Expo Dev Tools will open automatically"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait
EOF

chmod +x dev.sh

cat > setup-docker.sh << 'EOF'
#!/bin/bash

echo "🐳 Setting up Docker environment for Civic Issue System"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start services
echo "🔨 Building Docker images..."
cd deployment
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "✅ Services started successfully!"
echo "📍 Application: http://localhost"
echo "📍 API:        http://localhost/api"
echo "📍 MongoDB:    localhost:27017"
echo "📍 Redis:      localhost:6379"

echo ""
echo "🔍 Service status:"
docker-compose ps

echo ""
echo "📋 Useful commands:"
echo "  Stop services:     docker-compose down"
echo "  View logs:         docker-compose logs -f"
echo "  Restart services:  docker-compose restart"
EOF

chmod +x setup-docker.sh

print_success "Created development scripts"

# Final instructions
print_success "Setup completed successfully! 🎉"
echo ""
print_status "Next steps:"
echo "1. Configure environment variables in backend/.env"
echo "2. Add your Google Maps API key to frontend/.env and mobile/.env"
echo "3. Set up MongoDB and Redis (locally or using Docker)"
echo "4. Start development servers:"
echo "   - Option A: Run './dev.sh' for local development"
echo "   - Option B: Run './setup-docker.sh' for Docker environment"
echo ""
print_status "Important files to configure:"
echo "📄 backend/.env         - Backend environment variables"
echo "📄 frontend/.env        - Frontend environment variables" 
echo "📄 mobile/.env          - Mobile app environment variables"
echo "📄 deployment/.env      - Docker environment variables"
echo ""
print_status "Documentation:"
echo "📖 README.md            - Project overview and setup"
echo "📖 CONTRIBUTING.md      - Contribution guidelines"
echo "📖 docs/               - Detailed documentation"
echo ""
print_warning "Remember to:"
echo "• Never commit sensitive environment variables to git"
echo "• Update API keys and secrets for production deployment"
echo "• Test the application thoroughly before deployment"
echo ""
print_success "Happy coding! 🚀"
