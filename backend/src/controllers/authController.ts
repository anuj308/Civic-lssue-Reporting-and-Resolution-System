import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { JWTUtils } from '../utils/jwt';
import { validationResult } from 'express-validator';
import { emailService } from '../utils/emailService';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
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

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        console.log('❌ User already exists with email:', email);
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          error: { code: 'USER_EXISTS' }
        });
        return;
      }

      // Check if phone number already exists (if provided)
      if (phone) {
        const existingPhone = await User.findOne({ phone });
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
      const userData: Partial<IUser> = {
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
        error: { code: 'REGISTRATION_ERROR' }
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
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

      // Find user by email and include password for comparison
      const user = await User.findOne({ 
        email: email.toLowerCase().trim() 
      }).select('+password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: { code: 'INVALID_CREDENTIALS' }
        });
        return;
      }

      // Check if account is active
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact administrator.',
          error: { code: 'ACCOUNT_DEACTIVATED' }
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

      // Generate tokens
      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      };

      const accessToken = JWTUtils.generateAccessToken(tokenPayload);
      const refreshToken = JWTUtils.generateRefreshToken(tokenPayload);

      // Set HTTP-only cookies
      JWTUtils.setTokenCookies(res, accessToken, refreshToken);

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Remove password from response
      const userResponse = user.toJSON();

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenExpiration: JWTUtils.getTokenExpiration(accessToken)
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
        error: { code: 'LOGIN_ERROR' }
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear authentication cookies
      JWTUtils.clearTokenCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during logout',
        error: { code: 'LOGOUT_ERROR' }
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = JWTUtils.extractTokenFromCookies(req.cookies);

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token not provided',
          error: { code: 'NO_REFRESH_TOKEN' }
        });
        return;
      }

      // Verify refresh token
      const payload = JWTUtils.verifyRefreshToken(refreshToken);

      // Check if user still exists and is active
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        JWTUtils.clearTokenCookies(res);
        res.status(401).json({
          success: false,
          message: 'User not found or account deactivated',
          error: { code: 'USER_NOT_FOUND' }
        });
        return;
      }

      // Generate new access token
      const newTokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      };

      const newAccessToken = JWTUtils.generateAccessToken(newTokenPayload);

      // Set new access token cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokenExpiration: JWTUtils.getTokenExpiration(newAccessToken)
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      JWTUtils.clearTokenCookies(res);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: { code: 'INVALID_REFRESH_TOKEN' }
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          error: { code: 'NOT_AUTHENTICATED' }
        });
        return;
      }

      // Get fresh user data from database
      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          error: { code: 'USER_NOT_FOUND' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'PROFILE_ERROR' }
      });
    }
  }

  /**
   * Verify authentication status
   */
  static async verifyAuth(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
          error: { code: 'NOT_AUTHENTICATED' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User is authenticated',
        data: {
          user: req.user.toJSON(),
          isAuthenticated: true
        }
      });

    } catch (error) {
      console.error('Verify auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'VERIFY_ERROR' }
      });
    }
  }

  /**
   * Verify OTP and activate user account
   */
  static async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 OTP verification request received:', {
        body: req.body,
        timestamp: new Date().toISOString()
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

      const { email, otpCode } = req.body;

      // Find user with OTP fields
      const user = await User.findOne({ email }).select('+otpCode +password');
      if (!user) {
        console.log('❌ User not found for OTP verification:', email);
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if user is already verified
      if (user.isVerified) {
        console.log('ℹ️ User already verified:', email);
        res.status(400).json({
          success: false,
          message: 'Account is already verified'
        });
        return;
      }

      // Check if OTP exists and hasn't expired
      if (!user.otpCode || !user.otpExpiry) {
        console.log('❌ No OTP found for user:', email);
        res.status(400).json({
          success: false,
          message: 'No OTP found. Please request a new OTP.'
        });
        return;
      }

      // Check if OTP has expired
      if (new Date() > user.otpExpiry) {
        console.log('❌ OTP expired for user:', email);
        res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        });
        return;
      }

      // Check if too many attempts
      if (user.otpAttempts && user.otpAttempts >= 5) {
        console.log('❌ Too many OTP attempts for user:', email);
        res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.'
        });
        return;
      }

      // Verify OTP
      if (user.otpCode !== otpCode) {
        console.log('❌ Invalid OTP for user:', email);
        
        // Increment attempt count
        await User.findByIdAndUpdate(user._id, {
          $inc: { otpAttempts: 1 }
        });

        res.status(400).json({
          success: false,
          message: 'Invalid OTP code',
          attemptsRemaining: 5 - (user.otpAttempts || 0) - 1
        });
        return;
      }

      // OTP is valid - verify user and clear OTP data
      await User.findByIdAndUpdate(user._id, {
        $set: {
          isVerified: true,
          otpCode: null,
          otpExpiry: null,
          otpAttempts: 0
        }
      });

      console.log('✅ User verified successfully:', email);

      // Generate tokens
      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      };

      const accessToken = JWTUtils.generateAccessToken(tokenPayload);
      const refreshToken = JWTUtils.generateRefreshToken(tokenPayload);

      // Set cookies
      JWTUtils.setTokenCookies(res, accessToken, refreshToken);

      res.status(200).json({
        success: true,
        message: 'Account verified successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: true
          },
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      });

    } catch (error) {
      console.error('❌ OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'OTP_VERIFY_ERROR' }
      });
    }
  }

  /**
   * Resend OTP for user verification
   */
  static async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      console.log('📧 OTP resend request received:', {
        body: req.body,
        timestamp: new Date().toISOString()
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

      const { email } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        console.log('❌ User not found for OTP resend:', email);
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if user is already verified
      if (user.isVerified) {
        console.log('ℹ️ User already verified, cannot resend OTP:', email);
        res.status(400).json({
          success: false,
          message: 'Account is already verified'
        });
        return;
      }

      // Generate new OTP
      const otpCode = emailService.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user with new OTP
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
        console.log('❌ Failed to send OTP email to:', email);
        res.status(500).json({
          success: false,
          message: 'Failed to send OTP email. Please try again.'
        });
        return;
      }

      console.log('✅ OTP resent successfully to:', email);

      res.status(200).json({
        success: true,
        message: 'OTP has been sent to your email address',
        data: {
          email: user.email,
          expiresIn: '10 minutes'
        }
      });

    } catch (error) {
      console.error('❌ OTP resend error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'OTP_RESEND_ERROR' }
      });
    }
  }
}
