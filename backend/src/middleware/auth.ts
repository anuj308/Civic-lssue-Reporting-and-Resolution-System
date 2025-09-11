import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/jwt';
import { User, IUser } from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: IUser;
  userId: string;
}

/**
 * Middleware to authenticate user using JWT tokens from cookies
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract tokens from cookies
    const { accessToken, refreshToken } = JWTUtils.extractTokenFromCookies(req.cookies);

    // If no access token, check for refresh token
    if (!accessToken) {
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Access denied. No authentication token provided.',
          error: { code: 'NO_TOKEN' }
        });
        return;
      }

      // Try to refresh the access token
      try {
        const refreshPayload = JWTUtils.verifyRefreshToken(refreshToken);
        
        // Check if user still exists
        const user = await User.findById(refreshPayload.userId).select('-password');
        if (!user || !user.isActive) {
          JWTUtils.clearTokenCookies(res);
          res.status(401).json({
            success: false,
            message: 'User not found or account deactivated.',
            error: { code: 'USER_NOT_FOUND' }
          });
          return;
        }

        // Generate new access token
        const newAccessToken = JWTUtils.generateAccessToken({
          userId: user._id.toString(),
          email: user.email,
          role: user.role
        });

        // Set new access token cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'strict' : 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });

        // Add user to request
        req.user = user;
        req.userId = user._id.toString();
        
        return next();
      } catch (refreshError) {
        JWTUtils.clearTokenCookies(res);
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token. Please login again.',
          error: { code: 'INVALID_REFRESH_TOKEN' }
        });
        return;
      }
    }

    // Verify access token
    let payload: JWTPayload;
    try {
      payload = JWTUtils.verifyAccessToken(accessToken);
    } catch (error) {
      // If access token is expired, try refresh token
      if (!refreshToken) {
        JWTUtils.clearTokenCookies(res);
        res.status(401).json({
          success: false,
          message: 'Access token expired and no refresh token provided.',
          error: { code: 'TOKEN_EXPIRED' }
        });
        return;
      }

      // Try to refresh
      try {
        const refreshPayload = JWTUtils.verifyRefreshToken(refreshToken);
        
        const user = await User.findById(refreshPayload.userId).select('-password');
        if (!user || !user.isActive) {
          JWTUtils.clearTokenCookies(res);
          res.status(401).json({
            success: false,
            message: 'User not found or account deactivated.',
            error: { code: 'USER_NOT_FOUND' }
          });
          return;
        }

        // Generate new access token
        const newAccessToken = JWTUtils.generateAccessToken({
          userId: user._id.toString(),
          email: user.email,
          role: user.role
        });

        // Set new access token cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'strict' : 'lax',
          maxAge: 15 * 60 * 1000,
          path: '/',
        });

        req.user = user;
        req.userId = user._id.toString();
        
        return next();
      } catch (refreshError) {
        JWTUtils.clearTokenCookies(res);
        res.status(401).json({
          success: false,
          message: 'Both access and refresh tokens are invalid. Please login again.',
          error: { code: 'ALL_TOKENS_INVALID' }
        });
        return;
      }
    }

    // Find user by ID from token
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      JWTUtils.clearTokenCookies(res);
      res.status(401).json({
        success: false,
        message: 'User not found.',
        error: { code: 'USER_NOT_FOUND' }
      });
      return;
    }

    // Check if user account is active
    if (!user.isActive) {
      JWTUtils.clearTokenCookies(res);
      res.status(401).json({
        success: false,
        message: 'User account is deactivated.',
        error: { code: 'ACCOUNT_DEACTIVATED' }
      });
      return;
    }

    // Add user info to request
    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    JWTUtils.clearTokenCookies(res);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: { code: 'AUTH_ERROR' }
    });
  }
};

/**
 * Middleware to authorize user based on roles
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated.',
        error: { code: 'NOT_AUTHENTICATED' }
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
        error: { code: 'INSUFFICIENT_PERMISSIONS' }
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or has admin privileges
 */
export const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated.',
        error: { code: 'NOT_AUTHENTICATED' }
      });
      return;
    }

    const isAdmin = req.user.role === 'admin';
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const isOwner = req.user._id.toString() === resourceUserId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        error: { code: 'RESOURCE_ACCESS_DENIED' }
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken } = JWTUtils.extractTokenFromCookies(req.cookies);

    if (!accessToken) {
      return next();
    }

    const payload = JWTUtils.verifyAccessToken(accessToken);
    const user = await User.findById(payload.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id.toString();
    }

    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};
