const { JWTUtils } = require('../utils/jwt');
const { User } = require('../models/User');

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
 * Middleware to authenticate user using JWT tokens from cookies
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    let accessToken, refreshToken;

    // Check for token in Authorization header first (for mobile apps)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
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
      if (authHeader) {
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
      if (authHeader) {
        // For mobile apps, just return error
        res.status(401).json({
          success: false,
          message: 'User not found.',
          error: { code: 'USER_NOT_FOUND' }
        });
      } else {
        // For web apps, clear cookies
        JWTUtils.clearTokenCookies(res);
        res.status(401).json({
          success: false,
          message: 'User not found.',
          error: { code: 'USER_NOT_FOUND' }
        });
      }
      return;
    }

    // Check if user account is active
    if (!user.isActive) {
      if (authHeader) {
        // For mobile apps, just return error
        res.status(401).json({
          success: false,
          message: 'User account is deactivated.',
          error: { code: 'ACCOUNT_DEACTIVATED' }
        });
      } else {
        // For web apps, clear cookies
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
      // For mobile apps, just return error
      res.status(500).json({
        success: false,
        message: 'Internal server error during authentication.',
        error: { code: 'AUTH_ERROR' }
      });
    } else {
      // For web apps, clear cookies
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