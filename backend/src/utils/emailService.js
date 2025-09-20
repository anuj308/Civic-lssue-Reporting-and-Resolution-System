const nodemailer = require('nodemailer');

/**
 * Email service for sending notifications and verification emails
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Configuration for verification method
    // Set EMAIL_VERIFICATION_METHOD=link in production, otp for localhost
    this.verificationMethod = process.env.EMAIL_VERIFICATION_METHOD || 'otp';
  }

  /**
   * Send verification email (automatically chooses OTP or Link based on config)
   * @param {string} email - User email address
   * @param {string} codeOrToken - Either OTP code or verification token
   */
  async sendVerificationEmail(email, codeOrToken) {
    console.log(`📧 Email verification method: ${this.verificationMethod}`);
    
    if (this.verificationMethod === 'link') {
      console.log('🔗 Sending verification LINK email');
      return this.sendVerificationLink(email, codeOrToken);
    } else {
      console.log('🔢 Sending verification OTP email');
      return this.sendVerificationOTP(email, codeOrToken);
    }
  }

  /**
   * Send verification email with OTP code (for localhost development)
   * @param {string} email - User email address
   * @param {string} otpCode - 6-digit OTP code
   */
  async sendVerificationOTP(email, otpCode) {
    const isProduction = process.env.NODE_ENV === 'production';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // For production, you could use verification links instead:
    // const verificationUrl = `${frontendUrl}/verify-email?token=${otpCode}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@civicissues.com',
      to: email,
      subject: 'Verify Your Email Address - Civic Issues',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2196F3; margin-bottom: 10px;">Civic Issues</h1>
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px; color: #333;">
              Thank you for registering with Civic Issues! Please use the verification code below to verify your email address:
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #2196F3; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
              ${otpCode}
            </div>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404;">
              <strong>Security Note:</strong> This code will expire in 10 minutes. Never share this code with anyone.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
            <p>If you didn't create an account with Civic Issues, please ignore this email.</p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p style="margin-top: 20px;">
              <strong>Civic Issues Team</strong><br>
              Making communities better, one report at a time.
            </p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email (OTP) sent successfully to:', email);
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      throw error;
    }
  }

  /**
   * Send verification link email (for production use)
   * @param {string} email - User email address
   * @param {string} token - Verification token
   */
  async sendVerificationLink(email, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@civicissues.com',
      to: email,
      subject: 'Verify Your Email Address - Civic Issues',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2196F3; margin-bottom: 10px;">Civic Issues</h1>
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 16px; color: #333;">
              Thank you for registering with Civic Issues! Please click the button below to verify your email address:
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background-color: #2196F3; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404;">
              <strong>Security Note:</strong> This link will expire in 24 hours. If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin: 10px 0 0 0; word-break: break-all; font-family: monospace; background: white; padding: 10px; border-radius: 4px;">
              ${verificationUrl}
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
            <p>If you didn't create an account with Civic Issues, please ignore this email.</p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p style="margin-top: 20px;">
              <strong>Civic Issues Team</strong><br>
              Making communities better, one report at a time.
            </p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification link email sent successfully to:', email);
    } catch (error) {
      console.error('❌ Error sending verification link email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email address
   * @param {string} token - Reset token
   */
  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@civicissues.com',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send notification email
   * @param {string} email - User email address
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   */
  async sendNotificationEmail(email, subject, message) {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@civicissues.com',
      to: email,
      subject: subject,
      html: `
        <h1>${subject}</h1>
        <p>${message}</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Notification email sent successfully');
    } catch (error) {
      console.error('Error sending notification email:', error);
      throw error;
    }
  }

  /**
   * Generate a 6-digit OTP code
   * @returns {string} 6-digit OTP code
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP email (alias for sendVerificationEmail for backward compatibility)
   * @param {string} email - User email address
   * @param {string} otpCode - 6-digit OTP code
   * @param {string} userName - User's name
   */
  async sendOTPEmail(email, otpCode, userName) {
    return this.sendVerificationEmail(email, otpCode);
  }
}

const emailService = new EmailService();

module.exports = { emailService };