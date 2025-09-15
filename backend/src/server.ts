// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
import path from 'path';
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

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import issueRoutes from './routes/issues';
import departmentRoutes from './routes/departments';
import analyticsRoutes from './routes/analytics';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authenticateToken } from './middleware/auth';

// Import services
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug environment loading
console.log('🔧 Environment Debug:');
console.log('📁 Current working directory:', process.cwd());
console.log('📁 __dirname:', __dirname);
console.log('📁 .env path attempted:', path.resolve(__dirname, '../.env'));
console.log('� Alternative .env path:', path.resolve(process.cwd(), '.env'));
console.log('�🔑 Total env variables loaded:', Object.keys(process.env).length);
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
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

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
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
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

export { io };
