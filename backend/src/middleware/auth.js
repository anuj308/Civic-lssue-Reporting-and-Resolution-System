const { JWTUtils } = require('../utils/jwt');
const User = require('../models/User');
const { Session } = require('../models/Session');
const { Department } = require('../models/Department');

/**
 * Type guard to check if request is authenticated
 * @param {Object} req - Express request object
 * @returns {boolean}
 */
function isAuthenticatedRequest(req) {
  return req.user !== undefined && req.userId !== undefined;
}

/**
 * Helper to create properly typed authenticated handlers
 * @param {Function} handler - The route handler function
 * @returns {Function} Express middleware function
 */
function withAuth(handler) {
  return async (req, res, next) => {
    if (!isAuthenticatedRequest(req)) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: { code: 'NOT_AUTHENTICATED' }
      });
      return;
    }
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to authenticate user using JWT tokens with session validation
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    let accessToken, refreshToken;
    let isMobileRequest = false;

    // Check for token in Authorization header first (for mobile apps)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
      isMobileRequest = true;
      console.log('🔑 Found token in Authorization header for mobile app');
    } else {
      // Fall back to cookies (for web apps)
      const tokens = JWTUtils.extractTokenFromCookies(req.cookies);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      console.log('🍪 Checking for tokens in cookies for web app');
    }

    // If no access token found
    if (!accessToken) {
      console.log('❌ No access token found in header or cookies');
      res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
        error: { code: 'NO_TOKEN' }
      });
      return;
    }

    // Verify access token
    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(accessToken);
      console.log('✅ Access token verified successfully for user:', payload.userId);
    } catch (tokenError) {
      console.log('❌ Access token verification failed:', tokenError.message);
      
      // For mobile apps, we don't have refresh token in cookies, so just reject
      if (isMobileRequest) {
        res.status(401).json({
          success: false,
          message: 'Access token expired or invalid. Please login again.',
          error: { code: 'TOKEN_EXPIRED' }
        });
        return;
      }

      // For web apps, try to use refresh token from cookies
      if (!refreshToken) {
        JWTUtils.clearTokenCookies(res);
        res.status(401).json({
          success: false,
          message: 'Access token expired and no refresh token provided.',
          error: { code: 'TOKEN_EXPIRED' }
        });
        return;
      }

      // Try to refresh token for web apps
      try {
        const refreshPayload = JWTUtils.verifyRefreshToken(refreshToken);
        
        // Validate session for refresh token
        const session = await Session.findOne({
          refreshTokenFamily: refreshPayload.tokenFamily,
          userId: refreshPayload.userId,
          isActive: true
        });

        if (!session || session.expiresAt < new Date()) {
          JWTUtils.clearTokenCookies(res);
          res.status(401).json({
            success: false,
            message: 'Session expired. Please login again.',
            error: { code: 'SESSION_EXPIRED' }
          });
          return;
        }

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

  // Update session activity only
  session.lastActiveAt = new Date();
  await session.save();

        req.user = user;
        req.userId = user._id.toString();
        req.sessionId = session._id.toString();
        
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

    // ================================
    // SESSION VALIDATION FOR ACTIVE TOKEN
    // ================================

    // For mobile apps, we need to find the session differently
    // since we don't have refresh token in header
    let session = null;
    
    if (isMobileRequest) {
      // For mobile, find the most recent active session for this user
      // In production, you might want to include session ID in JWT payload
      session = await Session.findOne({
        userId: payload.userId,
        isActive: true
      }).sort({ lastActiveAt: -1 });
    } else {
      // For web apps, find session by refresh token family
      if (refreshToken) {
        try {
          const refreshPayload = JWTUtils.verifyRefreshToken(refreshToken);
          session = await Session.findOne({
            refreshTokenFamily: refreshPayload.tokenFamily,
            userId: payload.userId,
            isActive: true
          });
        } catch (error) {
          console.log('⚠️ Could not verify refresh token for session lookup');
        }
      }
    }

    // Find user by ID from token first (needed for session timeout preference)
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      if (isMobileRequest) {
        res.status(401).json({
          success: false,
          message: 'User not found.',
          error: { code: 'USER_NOT_FOUND' }
        });
      } else {
        JWTUtils.clearTokenCookies(res);
        res.status(401).json({
          success: false,
          message: 'User not found.',
          error: { code: 'USER_NOT_FOUND' }
        });
      }
      return;
    }

    // Validate session if found
    if (session) {
      if (session.expiresAt < new Date()) {
        await session.markAsInactive();
        
        if (isMobileRequest) {
          res.status(401).json({
            success: false,
            message: 'Session expired. Please login again.',
            error: { code: 'SESSION_EXPIRED' }
          });
        } else {
          JWTUtils.clearTokenCookies(res);
          res.status(401).json({
            success: false,
            message: 'Session expired. Please login again.',
            error: { code: 'SESSION_EXPIRED' }
          });
        }
        return;
      }

  // Update session activity only
  session.lastActiveAt = new Date();
  await session.save();
      
      // Add session ID to request
      req.sessionId = session._id.toString();
    }

    // Check if user account is active
    if (!user.isActive) {
      if (isMobileRequest) {
        res.status(401).json({
          success: false,
          message: 'User account is deactivated.',
          error: { code: 'ACCOUNT_DEACTIVATED' }
        });
      } else {
        JWTUtils.clearTokenCookies(res);
        res.status(401).json({
          success: false,
          message: 'User account is deactivated.',
          error: { code: 'ACCOUNT_DEACTIVATED' }
        });
      }
      return;
    }

    // Add user info to request
    req.user = user;
    req.userId = user._id.toString();
    console.log('✅ User authenticated successfully:', user.email);
    
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    if (req.headers.authorization) {
      res.status(500).json({
        success: false,
        message: 'Internal server error during authentication.',
        error: { code: 'AUTH_ERROR' }
      });
    } else {
      JWTUtils.clearTokenCookies(res);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authentication.',
        error: { code: 'AUTH_ERROR' }
      });
    }
  }
};

/**
 * Middleware to authorize user based on roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
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
 * @param {string} resourceUserIdField - Field name to check for user ID
 * @returns {Function} Express middleware function
 */
const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
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
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    let accessToken;

    // Check for token in Authorization header first (for mobile apps)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    } else {
      // Fall back to cookies (for web apps)
      const tokens = JWTUtils.extractTokenFromCookies(req.cookies);
      accessToken = tokens.accessToken;
    }

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

// Export aliases for backwards compatibility
const auth = authenticateToken;
const authorize = authorizeRoles;

module.exports = {
  isAuthenticatedRequest,
  withAuth,
  authenticateToken,
  authorizeRoles,
  authorizeOwnerOrAdmin,
  optionalAuth,
  auth,
  authorize
};