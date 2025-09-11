import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { JWTUtils } from '../utils/jwt';
import { validationResult } from 'express-validator';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
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

      const { name, email, password, phone, role = 'citizen', address } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
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
          res.status(409).json({
            success: false,
            message: 'User with this phone number already exists',
            error: { code: 'PHONE_EXISTS' }
          });
          return;
        }
      }

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

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          tokenExpiration: JWTUtils.getTokenExpiration(accessToken)
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
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
}
