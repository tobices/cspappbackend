const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify SMTP connection
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP Email service is ready to send emails');
    } catch (error) {
      console.error('❌ SMTP Email service error:', error.message);
    }
  }

  async sendEmail(to, subject, html, from = null) {
    try {
      const mailOptions = {
        from: from || `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: html.replace(/<[^>]*>/g, '')
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send verification email - CLEAN URL VERSION
  async sendVerificationEmail(user, verificationUrl) {
    // CRITICAL FIX: Remove any quotes, spaces, or special characters from URL
    const cleanUrl = verificationUrl.replace(/["']/g, '').trim();
    
    console.log('📧 Sending verification email to:', user.email);
    console.log('🔗 Clean URL:', cleanUrl);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Email - CSPAPP Church</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E3A8A; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #D4AF77; margin: 0; font-size: 28px; }
          .content { background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background-color: #D4AF77; color: #000; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .button:hover { background-color: #c4a060; }
          .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .link-box { word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ CSPAPP Church</h1>
          </div>
          <div class="content">
            <h2>Welcome to CSPAPP Church, ${user.fullName}! 🙏</h2>
            <p>Thank you for registering. Please verify your email address to complete your registration.</p>
            
            <div style="text-align: center;">
              <a href="${cleanUrl}" class="button">✓ Verify Email Address</a>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="link-box">${cleanUrl}</div>
            
            <p>After verification, you'll be able to:</p>
            <ul>
              <li>💝 Make donations and track your giving</li>
              <li>📅 Register for church events</li>
              <li>👤 Manage your profile information</li>
              <li>📧 Receive church communications</li>
            </ul>
            
            <p>God bless you,<br><strong>CSPAPP Church Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CSPAPP Church. All rights reserved.</p>
            <p>You received this email because you registered with CSPAPP Church.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, 'Verify Your Email - CSPAPP Church', html);
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to CSPAPP Church</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E3A8A; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #D4AF77; margin: 0; }
          .content { background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background-color: #D4AF77; color: #000; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ CSPAPP Church</h1>
          </div>
          <div class="content">
            <h2>Welcome to Our Church Family, ${user.fullName}! 🙏</h2>
            <p>Thank you for registering with CSPAPP Church Management System. We're excited to have you as part of our church family!</p>
            
            <h3>What you can do with your account:</h3>
            <ul>
              <li>💰 Make donations and track your giving history</li>
              <li>📅 Register for church events and activities</li>
              <li>👤 Update your profile information</li>
              <li>📧 Stay connected with church communications</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Your Account</a>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>God bless you,<br><strong>CSPAPP Church Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CSPAPP Church. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, 'Welcome to CSPAPP Church! 🏛️', html);
  }

  // Send donation receipt email
  async sendDonationReceipt(user, donation) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Donation Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E3A8A; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #D4AF77; margin: 0; }
          .content { background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .receipt-box { background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #D4AF77; }
          .amount { font-size: 24px; font-weight: bold; color: #1E3A8A; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ CSPAPP Church</h1>
          </div>
          <div class="content">
            <h2>Thank You for Your Donation, ${user.fullName}! 🙏</h2>
            <p>Your generosity helps us serve God's purpose and bless our community.</p>
            
            <div class="receipt-box">
              <h3>Donation Receipt</h3>
              <p><strong>Transaction ID:</strong> ${donation.transactionId}</p>
              <p><strong>Date:</strong> ${new Date(donation.createdAt).toLocaleDateString()}</p>
              <p><strong>Purpose:</strong> ${donation.purpose}</p>
              <p><strong>Amount:</strong> <span class="amount">₦${donation.amount.toLocaleString()}</span></p>
              <p><strong>Status:</strong> <span style="color: green;">✓ Completed</span></p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/donation-history" class="button">View Donation History</a>
            </div>
            
            <p>May God richly bless you for your generosity.</p>
            <p>In His service,<br><strong>CSPAPP Church Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an official receipt from CSPAPP Church.</p>
            <p>© ${new Date().getFullYear()} CSPAPP Church. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, `Donation Receipt - ${donation.purpose}`, html);
  }

  // Send birthday email
  async sendBirthdayEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Happy Birthday!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #D4AF77; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #1E3A8A; margin: 0; }
          .content { background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .birthday-box { background-color: #f0f0f0; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Happy Birthday! 🎂</h1>
          </div>
          <div class="content">
            <div class="birthday-box">
              <h2>Dear ${user.fullName},</h2>
              <p style="font-size: 18px;">On this special day, we thank God for your life and celebrate you!</p>
            </div>
            
            <p>May God continue to bless you with:</p>
            <ul>
              <li>✨ Good health and vitality</li>
              <li>💝 Joy and happiness</li>
              <li>💰 Prosperity and success</li>
              <li>🙏 Peace that surpasses all understanding</li>
            </ul>
            
            <p>We're grateful to have you as part of our church family.</p>
            
            <p><strong>May this new year of your life bring unprecedented blessings!</strong></p>
            
            <p>With love,<br><strong>CSPAPP Church Family</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CSPAPP Church. All rights reserved.</p>
            <p>We celebrate you today and always!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, '🎂 Happy Birthday from CSPAPP Church! 🎉', html);
  }

  // Send mass email
  async sendMassEmail(recipients, subject, message) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E3A8A; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #D4AF77; margin: 0; }
          .content { background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ CSPAPP Church</h1>
          </div>
          <div class="content">
            ${message}
            <hr>
            <p style="font-style: italic;">God bless you,<br><strong>CSPAPP Church Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CSPAPP Church. All rights reserved.</p>
            <p>You received this email because you're registered with CSPAPP Church.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(recipients, subject, html);
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetUrl) {
    const cleanUrl = resetUrl.replace(/["']/g, '').trim();
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E3A8A; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #D4AF77; margin: 0; }
          .content { background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background-color: #D4AF77; color: #000; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${user.fullName},</p>
            <p>We received a request to reset your password for your CSPAPP Church account.</p>
            
            <div style="text-align: center;">
              <a href="${cleanUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            </div>
            
            <p>For security reasons, never share this link with anyone.</p>
            <p>God bless you,<br><strong>CSPAPP Church Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CSPAPP Church. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, 'Password Reset Request - CSPAPP Church', html);
  }
}

module.exports = new EmailService();