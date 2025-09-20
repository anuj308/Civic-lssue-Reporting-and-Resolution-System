const jwt = require('jsonwebtoken');

/**
 * JWT Utility class for handling JSON Web Tokens
 */
class JWTUtils {
  static ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your_access_token_secret';
  static REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret';
  static ACCESS_TOKEN_EXPIRES_IN = '15m';
  static REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * Generate access token
   * @param {Object} payload - Token payload containing userId, email, role
   * @returns {string} Generated access token
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Token payload containing userId, email, role
   * @returns {string} Generated refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * Verify access token
   * @param {string} token - Access token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - Refresh token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} payload - Token payload containing userId, email, role
   * @returns {Object} Object containing both tokens
   */
  static generateTokens(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Extract tokens from cookies
   * @param {Object} cookies - Request cookies object
   * @returns {Object} Object containing extracted tokens
   */
  static extractTokenFromCookies(cookies) {
    return {
      accessToken: cookies?.accessToken || null,
      refreshToken: cookies?.refreshToken || null,
    };
  }

  /**
   * Set authentication cookies
   * @param {Response} res - Express response object
   * @param {string} accessToken - Access token to set
   * @param {string} refreshToken - Refresh token to set
   */
  static setTokenCookies(res, accessToken, refreshToken) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set access token cookie (short-lived)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Set refresh token cookie (long-lived)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  /**
   * Clear authentication cookies
   * @param {Response} res - Express response object
   */
  static clearTokenCookies(res) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - Token to decode
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - Token to check
   * @returns {boolean} True if token is expired
   */
  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - Token to check
   * @returns {Date|null} Expiration date or null if invalid
   */
  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
        return null;
      }
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate token structure and basic properties
   * @param {string} token - Token to validate
   * @returns {boolean} True if token structure is valid
   */
  static isValidTokenStructure(token) {
    try {
      if (!token || typeof token !== 'string') {
        return false;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Try to decode the payload
      const payload = jwt.decode(token);
      return payload !== null && typeof payload === 'object';
    } catch (error) {
      return false;
    }
  }
}

module.exports = { JWTUtils };