import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class JWTUtils {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your_access_token_secret';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload as any, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload as any, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Set HTTP-only cookies for tokens
   */
  static setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set access token cookie (15 minutes)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
      path: '/',
    });

    // Set refresh token cookie (7 days)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    });
  }

  /**
   * Clear authentication cookies
   */
  static clearTokenCookies(res: Response): void {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });
  }

  /**
   * Extract token from cookies
   */
  static extractTokenFromCookies(cookies: any): { accessToken?: string; refreshToken?: string } {
    return {
      accessToken: cookies?.accessToken,
      refreshToken: cookies?.refreshToken,
    };
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
  }

  /**
   * Decode token without verification (for expired tokens)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}
