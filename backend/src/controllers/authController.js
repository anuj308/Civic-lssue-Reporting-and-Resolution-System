const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const { Session } = require('../models/Session');
const { SecurityAlert } = require('../models/SecurityAlert');
const { JWTUtils } = require('../utils/jwt');
const { LocationService } = require('../utils/locationService');
const { validationResult } = require('express-validator');
const { emailService } = require('../utils/emailService');

/**
 * Authentication Controller for user registration, login, and verification
 */
class AuthController {
  /**
   * Register a new user
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async register(req, res) {
    try {
      console.log('🔥 Registration request received:', {
        body: req.body,
        headers: req.headers,
        url: req.url,
        method: req.method
      });

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { name, email, password, phone, role = 'citizen', address } = req.body;

      // Check if user already exists (only check active users)
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      });
      if (existingUser) {
        console.log('❌ Active user already exists with email:', email);
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          error: { code: 'USER_EXISTS' }
        });
        return;
      }

      // Check if phone number already exists (if provided) - only check active users
      if (phone) {
        const existingPhone = await User.findOne({ 
          phone,
          isActive: true 
        });
        if (existingPhone) {
          console.log('❌ User already exists with phone:', phone);
          res.status(409).json({
            success: false,
            message: 'User with this phone number already exists',
            error: { code: 'PHONE_EXISTS' }
          });
          return;
        }
      }

      console.log('✅ Creating new user with data:', { name, email, phone, role });

      // Create new user
      const userData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password, // Will be hashed by the User model pre-save middleware
        phone: phone?.trim(),
        role,
        address,
        isActive: true,
        isVerified: false,
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false
        },
        stats: {
          totalReports: 0,
          resolvedReports: 0,
          averageRating: 0
        }
      };

      const user = new User(userData);
      await user.save();
      console.log('✅ User created successfully:', user._id);

      // Generate and send OTP for verification
      const otpCode = emailService.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user with OTP
      await User.findByIdAndUpdate(user._id, {
        $set: {
          otpCode,
          otpExpiry,
          otpAttempts: 0
        }
      });

      // Send OTP email
      const emailSent = await emailService.sendOTPEmail(user.email, otpCode, user.name);

      if (!emailSent) {
        console.log('❌ Failed to send OTP email to:', user.email);
        console.log('⚠️ For development: OTP Code is:', otpCode);
        
        // In development, don't delete user if email fails - just log the OTP
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Development Mode: User created but email failed');
          console.log('🔑 Manual OTP for testing:', otpCode);
          res.status(201).json({
            success: true,
            message: 'Registration successful! Email service unavailable - check server logs for OTP.',
            data: {
              email: user.email,
              message: 'Please verify your email with the OTP (check server logs for development)',
              expiresIn: '10 minutes',
              developmentOTP: process.env.NODE_ENV === 'development' ? otpCode : undefined
            }
          });
          return;
        } else {
          // In production, delete the user if email fails
          await User.findByIdAndDelete(user._id);
          res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.'
          });
          return;
        }
      }

      console.log('✅ Registration successful, OTP sent to:', user.email);
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email for verification code.',
        data: {
          email: user.email,
          message: 'Please verify your email with the OTP sent to complete registration',
          expiresIn: '10 minutes'
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown'
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
        error: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        } : undefined
      });
    }
  }

  /**
   * Verify OTP for user registration
   * @param {Request} req - Express request object  
   * @param {Response} res - Express response object
   */
  static async verifyOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, otpCode } = req.body;

      // Find user with OTP
      const user = await User.findOne({
        email: email.toLowerCase(),
        otpCode,
        otpExpiry: { $gt: new Date() }
      }).select('+otpCode +otpAttempts');

      if (!user) {
        // Check if user exists but OTP is invalid/expired
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
          // Increment failed attempts
          await User.findByIdAndUpdate(userExists._id, {
            $inc: { otpAttempts: 1 }
          });

          res.status(400).json({
            success: false,
            message: 'Invalid or expired OTP code',
            error: { code: 'INVALID_OTP' }
          });
          return;
        }

        res.status(404).json({
          success: false,
          message: 'User not found or OTP expired',
          error: { code: 'USER_NOT_FOUND' }
        });
        return;
      }

      // Check attempt limits
      if (user.otpAttempts >= 5) {
        res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.',
          error: { code: 'TOO_MANY_ATTEMPTS' }
        });
        return;
      }

      // Verify user and clear OTP
      await User.findByIdAndUpdate(user._id, {
        $set: {
          isVerified: true,
          otpCode: null,
          otpExpiry: null,
          otpAttempts: 0
        }
      });

      // Generate tokens
      const tokens = JWTUtils.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Set HTTP-only cookie for refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
      });

      console.log('✅ User verified successfully:', user.email);
      res.status(200).json({
        success: true,
        message: 'Account verified successfully!',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: true
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken, // Add refreshToken for mobile apps
          expiresIn: '1h'
        }
      });

    } catch (error) {
      console.error('❌ OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during verification'
      });
    }
  }

  /**
   * Verify email and login (for mobile app login flow)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async verifyAndLogin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, otpCode, password } = req.body;

      console.log('🔍 verifyAndLogin Debug Info:');
      console.log('  - Email:', email);
      console.log('  - OTP Code:', otpCode);
      console.log('  - Password provided:', !!password);

      // First, let's check what's in the database for this user
      const userCheck = await User.findOne({ email: email.toLowerCase() })
        .select('+otpCode +otpExpiry +otpAttempts');
      
      if (userCheck) {
        console.log('  - User found in DB');
        console.log('  - DB OTP Code:', userCheck.otpCode);
        console.log('  - DB OTP Expiry:', userCheck.otpExpiry);
        console.log('  - Current time:', new Date());
        console.log('  - OTP expired?', userCheck.otpExpiry < new Date());
        console.log('  - OTP match?', userCheck.otpCode === otpCode);
      } else {
        console.log('  - User NOT found in DB');
      }

      // Find user with OTP
      const user = await User.findOne({
        email: email.toLowerCase(),
        otpCode,
        otpExpiry: { $gt: new Date() }
      }).select('+otpCode +otpAttempts +password');

      if (!user) {
        // Check if user exists but OTP is invalid/expired
        const userExists = await User.findOne({ email: email.toLowerCase() })
          .select('+otpCode +otpExpiry +otpAttempts');
        
        if (userExists) {
          console.log('❌ User exists but OTP verification failed:');
          console.log('  - Stored OTP:', userExists.otpCode);
          console.log('  - Provided OTP:', otpCode);
          console.log('  - OTP Expiry:', userExists.otpExpiry);
          console.log('  - Current Time:', new Date());
          console.log('  - Is Expired?', userExists.otpExpiry < new Date());
          
          // Increment failed attempts
          await User.findByIdAndUpdate(userExists._id, {
            $inc: { otpAttempts: 1 }
          });

          res.status(400).json({
            success: false,
            message: 'Invalid or expired verification code',
            error: { code: 'INVALID_OTP' }
          });
          return;
        }

        console.log('❌ User not found for email:', email);
        res.status(404).json({
          success: false,
          message: 'User not found or verification code expired',
          error: { code: 'USER_NOT_FOUND' }
        });
        return;
      }

      // Check attempt limits
      if (user.otpAttempts >= 5) {
        res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please request a new verification code.',
          error: { code: 'TOO_MANY_ATTEMPTS' }
        });
        return;
      }

      // Verify password if provided (for login flow)
      if (password) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          res.status(401).json({
            success: false,
            message: 'Invalid password',
            error: { code: 'INVALID_CREDENTIALS' }
          });
          return;
        }
      }

      // Verify user and clear OTP
      await User.findByIdAndUpdate(user._id, {
        $set: {
          isVerified: true,
          otpCode: null,
          otpExpiry: null,
          otpAttempts: 0,
          lastLoginAt: new Date()
        }
      });

      // Generate tokens
      const tokens = JWTUtils.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Set HTTP-only cookie for refresh token
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax', // Use 'lax' in development for cross-origin requests
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.log('✅ User verified and logged in successfully:', user.email);
      res.status(200).json({
        success: true,
        message: 'Email verified and login successful!',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            preferences: user.preferences,
            isVerified: true
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken, // Add refreshToken for mobile apps
          expiresIn: '1h'
        }
      });

    } catch (error) {
      console.error('❌ Verify and login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during verification and login'
      });
    }
  }

  /**
   * User login with enhanced security tracking
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      // Find user and include password for comparison
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      }).select('+password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: { code: 'INVALID_CREDENTIALS' }
        });
        return;
      }

      // Check if user is verified
      if (!user.isVerified) {
        // Generate new OTP for verification
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log('🔍 Login - Generating OTP for unverified user:');
        console.log('  - Email:', user.email);
        console.log('  - Generated OTP:', otpCode);
        console.log('  - OTP Expiry:', otpExpiry);

        // Update user with new OTP
        user.otpCode = otpCode;
        user.otpExpiry = otpExpiry;
        user.otpAttempts = 0; // Reset attempts
        await user.save();

        console.log('  - OTP saved to database successfully');

        // Send verification email
        try {
          await emailService.sendVerificationEmail(user.email, otpCode);
          console.log('✅ Verification email sent to unverified user:', user.email);
        } catch (emailError) {
          console.error('❌ Error sending verification email:', emailError);
        }

        res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in. A verification code has been sent to your email.',
          error: { 
            code: 'EMAIL_NOT_VERIFIED',
            email: user.email,
            needsVerification: true
          }
        });
        return;
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: { code: 'INVALID_CREDENTIALS' }
        });
        return;
      }

      // ================================
      // ENHANCED SECURITY TRACKING
      // ================================

      // Get client information
      const clientIP = LocationService.getClientIP(req);
      const userAgent = req.get('User-Agent') || '';
      
      // Get location and device information
      const [locationData, deviceInfo] = await Promise.all([
        LocationService.getLocationFromIP(clientIP),
        Promise.resolve(LocationService.parseUserAgent(userAgent))
      ]);

      // Get user's recent sessions for risk analysis
      const recentSessions = await Session.find({
        userId: user._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).sort({ createdAt: -1 }).limit(10);

      // Generate tokens with session family
      const refreshTokenFamily = JWTUtils.generateTokenFamily();
      const tokens = JWTUtils.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      }, refreshTokenFamily);

      // Create session record with user's timeout preference
      const userTimeoutMs = user.preferences?.sessionTimeoutMs || (7 * 24 * 60 * 60 * 1000); // Default 7 days in milliseconds
      
      const sessionData = {
        userId: user._id,
        refreshTokenFamily,
        deviceInfo,
        location: {
          ...locationData,
          ip: clientIP // Ensure IP is set in the correct location
        },
        security: {
          isVPN: locationData.isVPN || false,
          isProxy: locationData.isProxy || false,
          isTor: locationData.isTor || false,
          riskScore: 0, // Will be calculated by pre-save middleware
          requiresVerification: false
        },
        metadata: {
          loginMethod: 'password',
          sessionDuration: 0,
          refreshCount: 0
        },
        isActive: true,
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + userTimeoutMs) // Use user's timeout preference in milliseconds
        // expiresAt explicitly set to avoid validation error
      };

      // Analyze security risk
      const riskAnalysis = LocationService.analyzeSecurityRisk(sessionData, recentSessions);
      sessionData.security.riskScore = riskAnalysis.riskScore;

      // ================================
      // HANDLE EXISTING DEVICE SESSIONS
      // ================================
      
      // Check for existing active sessions from the same device
      const existingDeviceSessions = await Session.find({
        userId: user._id,
        isActive: true,
        'deviceInfo.type': deviceInfo.type,
        'deviceInfo.os': deviceInfo.os,
        'location.ip': clientIP
      });

      console.log(`🔍 Found ${existingDeviceSessions.length} existing sessions from this device`);

      // If there are existing sessions from the same device/IP, revoke them
      // This prevents multiple active sessions from the same device
      if (existingDeviceSessions.length > 0) {
        console.log('🔄 Revoking existing sessions from same device to prevent duplicates');
        
        for (const existingSession of existingDeviceSessions) {
          await existingSession.revoke('replaced_by_new_login');
          console.log(`📝 Revoked session ${existingSession._id}`);
        }
      }

      // Create session
      const session = await Session.create(sessionData);

      // Create security alerts based on risk analysis
      const alertPromises = [];

      // High risk login alert
      if (session.security.riskScore > 50) {
        alertPromises.push(
          SecurityAlert.create({
            userId: user._id,
            sessionId: session._id,
            type: 'high_risk_login',
            severity: session.security.riskScore > 70 ? 'high' : 'medium',
            title: 'High Risk Login Detected',
            description: `Login from ${locationData.city}, ${locationData.country} with elevated risk factors`,
            metadata: {
              riskScore: session.security.riskScore,
              riskFactors: riskAnalysis.riskFactors,
              deviceInfo,
              locationData
            }
          })
        );
      }

      // New device alert
      const isNewDevice = !recentSessions.some(s => 
        s.deviceInfo.type === deviceInfo.type && 
        s.deviceInfo.os === deviceInfo.os
      );

      if (isNewDevice) {
        alertPromises.push(
          SecurityAlert.create({
            userId: user._id,
            sessionId: session._id,
            type: 'new_device_login',
            severity: 'info',
            title: 'New Device Login',
            description: `Login from new ${deviceInfo.type} device (${deviceInfo.os})`,
            metadata: {
              deviceInfo,
              locationData,
              isFirstTimeDevice: true
            }
          })
        );
      }

      // New location alert (if user has previous sessions)
      if (recentSessions.length > 0) {
        const isNewCountry = !recentSessions.some(s => 
          s.location.country === locationData.country
        );

        if (isNewCountry) {
          alertPromises.push(
            SecurityAlert.create({
              userId: user._id,
              sessionId: session._id,
              type: 'new_location_login',
              severity: 'medium',
              title: 'Login from New Location',
              description: `Login from new country: ${locationData.country}`,
              metadata: {
                newLocation: locationData,
                previousLocations: recentSessions.map(s => ({
                  country: s.location.country,
                  city: s.location.city
                })).slice(0, 3)
              }
            })
          );
        }
      }

      // VPN/Proxy alerts
      if (locationData.isVPN) {
        alertPromises.push(
          SecurityAlert.create({
            userId: user._id,
            sessionId: session._id,
            type: 'vpn_detected',
            severity: 'medium',
            title: 'VPN Connection Detected',
            description: `Login detected through VPN service: ${locationData.isp}`,
            metadata: { locationData, securityRecommendation: 'Monitor for suspicious activity' }
          })
        );
      }

      if (locationData.isTor) {
        alertPromises.push(
          SecurityAlert.create({
            userId: user._id,
            sessionId: session._id,
            type: 'tor_detected',
            severity: 'high',
            title: 'Tor Network Detected',
            description: 'Login detected through Tor network',
            metadata: { locationData, securityRecommendation: 'Consider blocking Tor access' }
          })
        );
      }

      // Execute all alert creations in parallel
      if (alertPromises.length > 0) {
        try {
          await Promise.all(alertPromises);
        } catch (alertError) {
          console.error('❌ Error creating security alerts:', alertError);
          // Continue with login even if alerts fail
        }
      }

      // Update last login
      await User.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date()
      });

      // Set HTTP-only cookie for refresh token
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax', // Use 'lax' in development for cross-origin requests
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.log('✅ User logged in successfully:', user.email);
      console.log('📊 Security Analysis:', {
        riskScore: session.security.riskScore,
        riskLevel: riskAnalysis.riskLevel,
        location: `${locationData.city}, ${locationData.country}`,
        device: `${deviceInfo.type} - ${deviceInfo.os}`,
        isNewDevice,
        alertsCreated: alertPromises.length
      });

      res.status(200).json({
        success: true,
        message: 'Login successful!',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            preferences: user.preferences
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken, // Add refreshToken for mobile apps
          expiresIn: '1h',
          session: {
            id: session._id,
            device: `${deviceInfo.type} - ${deviceInfo.os}`,
            location: `${locationData.city}, ${locationData.country}`,
            riskLevel: riskAnalysis.riskLevel,
            isNewDevice,
            securityAlerts: alertPromises.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  /**
   * Logout user with session cleanup
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async logout(req, res) {
    try {
      // Get session info if available
      const sessionId = req.sessionId; // This would be set by auth middleware
      const userId = req.userId;

      // Revoke current session if exists
      if (sessionId) {
        try {
          const session = await Session.findById(sessionId);
          if (session) {
            await session.revoke('user_logout');
            
            // Create logout security alert
            await SecurityAlert.create({
              userId: userId,
              sessionId: sessionId,
              type: 'user_logout',
              severity: 'info',
              title: 'User Logout',
              description: `User logged out from ${session.deviceInfo.type} device`,
              metadata: {
                deviceInfo: session.deviceInfo,
                location: session.location,
                sessionDuration: new Date() - session.createdAt
              }
            });
          }
        } catch (sessionError) {
          console.error('❌ Session cleanup error during logout:', sessionError);
          // Continue with logout even if session cleanup fails
        }
      }

      // Clear the refresh token cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie('refreshToken', {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax', // Use 'lax' in development for cross-origin requests
  path: '/'
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during logout'
      });
    }
  }

  /**
   * Refresh access token with session validation
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async refreshToken(req, res) {
    try {
      // Support both cookies (web) and request body (mobile)
      const { refreshToken } = req.cookies || {};
      const bodyRefreshToken = req.body?.refreshToken;
      
      const token = refreshToken || bodyRefreshToken;

      console.log('🔄 Refresh Token Debug:');
      console.log('  - Cookie refreshToken:', refreshToken ? 'Present' : 'Not present');
      console.log('  - Body refreshToken:', bodyRefreshToken ? 'Present' : 'Not present');
      console.log('  - Using token from:', refreshToken ? 'cookie' : 'body');

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Refresh token not provided',
          error: { code: 'NO_REFRESH_TOKEN' }
        });
        return;
      }

      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(token);
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          error: { code: 'INVALID_REFRESH_TOKEN' }
        });
        return;
      }

      console.log('  - Decoded token payload:', {
        userId: decoded.userId,
        email: decoded.email,
        tokenFamily: decoded.tokenFamily,
        iat: decoded.iat,
        exp: decoded.exp
      });

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive',
          error: { code: 'USER_NOT_FOUND' }
        });
        return;
      }

      // ================================
      // SESSION VALIDATION & SECURITY
      // ================================

      // Find the session associated with this refresh token
      const sessionLookupValue = decoded.tokenFamily || token;
      console.log('  - Session lookup value:', sessionLookupValue);
      console.log('  - Using tokenFamily from decoded?', !!decoded.tokenFamily);

      const session = await Session.findOne({
        refreshTokenFamily: sessionLookupValue,
        userId: decoded.userId,
        isActive: true
      });

      console.log('  - Session found:', !!session);
      if (session) {
        console.log('  - Session details:', {
          id: session._id,
          refreshTokenFamily: session.refreshTokenFamily,
          isActive: session.isActive,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt
        });
      }

      // Check if session is still valid
      if (!session.isValid()) {
        await session.revoke('session_expired');
        res.status(401).json({
          success: false,
          message: 'Session has expired',
          error: { code: 'SESSION_EXPIRED' }
        });
        return;
      }

      // Update session activity
      session.lastActiveAt = new Date();
      session.metadata = {
        ...session.metadata,
        lastTokenRefresh: new Date(),
        refreshCount: (session.metadata.refreshCount || 0) + 1
      };
      await session.save();

      // Check for suspicious refresh patterns
      const refreshCount = session.metadata.refreshCount || 0;
      if (refreshCount > 100) { // Too many refreshes might indicate token theft
        await SecurityAlert.create({
          userId: user._id,
          sessionId: session._id,
          type: 'suspicious_token_usage',
          severity: 'medium',
          title: 'Unusual Token Refresh Pattern',
          description: `Session has refreshed tokens ${refreshCount} times`,
          metadata: {
            refreshCount,
            sessionInfo: {
              device: session.deviceInfo.type,
              location: session.location.city,
              createdAt: session.createdAt
            }
          }
        });
      }

      // Generate new tokens (keeping the same family)
      const tokens = JWTUtils.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      }, session.refreshTokenFamily);

      // Don't update refreshTokenFamily - keep it consistent for the session
      // The tokens.refreshToken is the new refresh token, but the family ID stays the same
      // Don't update refreshTokenFamily - keep it consistent for the session
      // The tokens.refreshToken is the new refresh token, but the family ID stays the same
      await session.save();

      // Set new refresh token cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax', // Use 'lax' in development for cross-origin requests
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken, // Add refreshToken for mobile apps
          expiresIn: '15m',
          session: {
            id: session._id,
            device: `${session.deviceInfo.type} - ${session.deviceInfo.os}`,
            location: `${session.location.city}, ${session.location.country}`,
            lastActivity: session.lastActiveAt
          }
        }
      });

    } catch (error) {
      console.error('❌ Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during token refresh'
      });
    }
  }

  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal whether user exists or not for security
        return res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate reset token (6-digit OTP)
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = resetTokenExpiry;
      await user.save();

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error('❌ Password reset email error:', emailError);
        // Continue even if email fails
      }

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

    } catch (error) {
      console.error('❌ Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset request'
      });
    }
  }

  /**
   * Reset password with token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, token, newPassword } = req.body;

      // Find user with valid reset token
      const user = await User.findOne({
        email: email.toLowerCase(),
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully'
      });

    } catch (error) {
      console.error('❌ Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset'
      });
    }
  }

  /**
   * Change password for authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Find user with password field
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedNewPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password change'
      });
    }
  }

  /**
   * Resend OTP for verification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async resendOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'User is already verified'
        });
      }

      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.otpCode = otpCode;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = 0; // Reset attempts
      await user.save();

      // Send verification email
      try {
        await emailService.sendVerificationEmail(email, otpCode);
      } catch (emailError) {
        console.error('❌ Resend OTP email error:', emailError);
      }

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully'
      });

    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during OTP resend'
      });
    }
  }

  /**
   * Resend OTP for login verification (specific for login flow)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async resendLoginOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Find user
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'User is already verified'
        });
      }

      // Check if too many recent attempts (rate limiting)
      if (user.otpAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please wait before requesting a new code.',
          error: { code: 'TOO_MANY_ATTEMPTS' }
        });
      }

      // Generate new OTP for login verification
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      console.log('🔄 Resending OTP for login verification:');
      console.log('  - Email:', user.email);
      console.log('  - New OTP:', otpCode);
      console.log('  - New Expiry:', otpExpiry);

      // Update user with new OTP
      user.otpCode = otpCode;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = 0; // Reset attempts for new OTP
      await user.save();

      console.log('  - New OTP saved to database successfully');

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, otpCode);
        console.log('✅ Login verification OTP resent successfully to:', user.email);
      } catch (emailError) {
        console.error('❌ Error sending resend OTP email:', emailError);
        // Continue even if email fails
      }

      res.status(200).json({
        success: true,
        message: 'Verification code sent successfully to your email'
      });

    } catch (error) {
      console.error('❌ Resend login OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during OTP resend'
      });
    }
  }

  /**
   * Get user statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      const { Issue } = require('../models/Issue');

      // Get total issues reported by user
      const totalIssues = await Issue.countDocuments({ reportedBy: userId });

      // Get resolved issues reported by user
      const resolvedIssues = await Issue.countDocuments({
        reportedBy: userId,
        status: 'resolved'
      });

      // Get total upvotes received on user's issues
      const userIssues = await Issue.find({ reportedBy: userId }, 'votes.upvotes');
      const upvotesReceived = userIssues.reduce((total, issue) => {
        return total + (issue.votes?.upvotes?.length || 0);
      }, 0);

      // Calculate contribution level based on activity
      let contributionLevel = 'Bronze';
      if (totalIssues >= 50 || resolvedIssues >= 25) {
        contributionLevel = 'Platinum';
      } else if (totalIssues >= 25 || resolvedIssues >= 10) {
        contributionLevel = 'Gold';
      } else if (totalIssues >= 10 || resolvedIssues >= 5) {
        contributionLevel = 'Silver';
      }

      // Generate badges based on achievements
      const badgesEarned = [];
      if (totalIssues >= 1) badgesEarned.push('First Reporter');
      if (resolvedIssues >= 1) badgesEarned.push('Problem Solver');
      if (upvotesReceived >= 10) badgesEarned.push('Community Helper');
      if (totalIssues >= 10) badgesEarned.push('Active Citizen');
      if (resolvedIssues >= 5) badgesEarned.push('Impact Maker');

      res.status(200).json({
        success: true,
        data: {
          totalIssues,
          resolvedIssues,
          upvotesReceived,
          contributionLevel,
          badgesEarned
        }
      });

    } catch (error) {
      console.error('❌ Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching user statistics'
      });
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMe(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId)
        .select('-password -otpCode -resetPasswordToken')
        .populate('department', 'name description');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('❌ Get user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching user profile'
      });
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.email;
      delete updateData.role;
      delete updateData.isVerified;
      delete updateData.otpCode;
      delete updateData.otpExpiry;
      delete updateData.resetPasswordToken;
      delete updateData.resetPasswordExpiry;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -otpCode -resetPasswordToken');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });

    } catch (error) {
      console.error('❌ Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during profile update'
      });
    }
  }

  /**
   * Deactivate user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  /**
   * Delete (permanently remove) user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deactivateAccount(req, res) {
    try {
      const userId = req.user.id;
      console.log('🗑️ Permanently deleting account for user ID:', userId);

      const user = await User.findById(userId);
      if (!user) {
        console.log('❌ User not found for deletion:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        console.log('⚠️ User account already deactivated:', user.email);
        return res.status(400).json({
          success: false,
          message: 'Account is already deactivated'
        });
      }

      // Permanently delete the user from database
      await User.findByIdAndDelete(userId);

      console.log('✅ Account permanently deleted for user:', user.email);
      
      // Clear cookies
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie('refreshToken', {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax', // Use 'lax' in development for cross-origin requests
  path: '/'
      });

      res.status(200).json({
        success: true,
        message: 'Account deleted permanently. You can now register with the same email again.'
      });

    } catch (error) {
      console.error('❌ Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during account deletion'
      });
    }
  }

  /**
   * Deactivate user account (soft delete - keeps data but marks as inactive)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async softDeactivateAccount(req, res) {
    try {
      const userId = req.user.id;
      console.log('⏸️ Soft deactivating account for user ID:', userId);

      const user = await User.findById(userId);
      if (!user) {
        console.log('❌ User not found for deactivation:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        console.log('⚠️ User account already deactivated:', user.email);
        return res.status(400).json({
          success: false,
          message: 'Account is already deactivated'
        });
      }

      user.isActive = false;
      await user.save();

      console.log('✅ Account soft deactivated for user:', user.email);
      
      // Clear cookies
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax' // Use 'lax' in development for cross-origin requests
      });

      res.status(200).json({
        success: true,
        message: 'Account deactivated successfully'
      });

    } catch (error) {
      console.error('❌ Soft deactivate account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during account deactivation'
      });
    }
  }

  /**
   * Request email verification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async requestEmailVerification(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Generate verification token
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      
      try {
        await emailService.sendVerificationEmail(user.email, verificationToken);
      } catch (emailError) {
        console.error('❌ Email verification send error:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (error) {
      console.error('❌ Request email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during email verification request'
      });
    }
  }

  /**
   * Get authentication status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAuthStatus(req, res) {
    try {
      // This is a simple endpoint to check if the server is running
      res.status(200).json({
        success: true,
        message: 'Authentication service is running',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Get auth status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Debug endpoint to check OTP status for a user (development only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async debugOTPStatus(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Not found' });
      }

      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+otpCode +otpExpiry +otpAttempts');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const now = new Date();
      const isExpired = user.otpExpiry < now;

      res.status(200).json({
        success: true,
        data: {
          email: user.email,
          otpCode: user.otpCode,
          otpExpiry: user.otpExpiry,
          currentTime: now,
          isExpired: isExpired,
          otpAttempts: user.otpAttempts,
          isVerified: user.isVerified
        }
      });

    } catch (error) {
      console.error('❌ Debug OTP status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = { AuthController };