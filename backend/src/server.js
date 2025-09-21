// Load environment variables FIRST - before any other imports
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');
const sessionRoutes = require('./routes/sessions');
// const userRoutes = require('./routes/users');
// const departmentRoutes = require('./routes/departments');
// const analyticsRoutes = require('./routes/analytics');
// const notificationRoutes = require('./routes/notifications');
// const adminRoutes = require('./routes/admin');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { authenticateToken } = require('./middleware/auth');

// Import models to register them with Mongoose
const { User } = require('./models/User');
const { Issue } = require('./models/Issue');
const { Department } = require('./models/Department');
const { Session } = require('./models/Session');
const { SecurityAlert } = require('./models/SecurityAlert');
const { Notification } = require('./models/Notification');

// Import services
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug environment loading
console.log('🔧 Environment Debug:');
console.log('📁 Current working directory:', process.cwd());
console.log('📁 __dirname:', __dirname);
console.log('📁 .env path attempted:', path.resolve(__dirname, '../.env'));
console.log('📁 Alternative .env path:', path.resolve(process.cwd(), '.env'));
console.log('🔑 Total env variables loaded:', Object.keys(process.env).length);
console.log('🔍 SMTP variables:', {
  SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Not Set',
  SMTP_PASS: process.env.SMTP_PASS ? 'Set' : 'Not Set',
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT
});

// Try loading from current working directory if first attempt failed
if (!process.env.SMTP_USER) {
  console.log('🔄 Retrying with current working directory...');
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  console.log('🔍 After retry - SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not Set');
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://192.168.18.101:3000", // Your computer's IP
    "http://192.168.18.101:5000", // Backend IP (for testing)
    "http://localhost:8081", // Expo dev server
    "http://192.168.18.101:8081", // Expo dev server on your IP
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Add cookie parser middleware
app.use(limiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Test endpoint for mobile connectivity
app.get('/api/test', (req, res) => {
  console.log('🔍 Test endpoint hit from:', req.ip);
  res.json({
    success: true,
    message: 'Backend server is reachable',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/sessions', sessionRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/departments', departmentRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/admin', adminRoutes);

// Socket.IO setup
// setupSocketIO(io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database and server startup
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log('✅ MongoDB connected successfully');

    // Connect to Redis
    await connectRedis();
    console.log('✅ Redis connected successfully');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

module.exports = { io };