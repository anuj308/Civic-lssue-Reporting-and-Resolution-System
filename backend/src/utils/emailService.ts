import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    console.log('🔧 Initializing Email Service...');
    console.log('📧 SMTP User:', process.env.SMTP_USER ? 'Set' : 'Not Set');
    console.log('🔑 SMTP Pass:', process.env.SMTP_PASS ? 'Set' : 'Not Set');
    
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email configuration error:', error);
      } else {
        console.log('📧 Email service ready');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Civic Issue Reporter" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otpCode: string, name: string): Promise<boolean> {
    const subject = 'Verify Your Account - Civic Issue Reporter';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1>🏛️ Civic Issue Reporter</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8fafc;">
          <h2 style="color: #1e293b;">Hello ${name}!</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Thank you for registering with Civic Issue Reporter. To complete your account verification, 
            please use the following OTP code:
          </p>
          
          <div style="background-color: #white; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 8px;">${otpCode}</h1>
          </div>
          
          <p style="color: #ef4444; font-size: 14px;">
            ⚠️ This OTP will expire in 10 minutes. Please verify your account before it expires.
          </p>
          
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            If you didn't create an account with us, please ignore this email.
          </p>
        </div>
        
        <div style="background-color: #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
          <p>© 2024 Civic Issue Reporter. Helping build better communities.</p>
        </div>
      </div>
    `;

    const text = `
Hello ${name}!

Thank you for registering with Civic Issue Reporter. 

Your verification OTP code is: ${otpCode}

This OTP will expire in 10 minutes. Please verify your account before it expires.

If you didn't create an account with us, please ignore this email.

© 2024 Civic Issue Reporter
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const emailService = new EmailService();