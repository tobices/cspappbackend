const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Send email
  async sendEmail(to, subject, html, from = null) {
    try {
      const mailOptions = {
        from: from || `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1E3A8A; padding: 20px; text-align: center;">
          <h1 style="color: #D4AF77; margin: 0;">Welcome to CSPAPP!</h1>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h2>Hello ${user.fullName},</h2>
          <p>Thank you for registering with CSPAPP Church Management System. We're excited to have you as part of our church family!</p>
          <p>With your account, you can:</p>
          <ul>
            <li>Make donations and track your giving history</li>
            <li>Register for church events</li>
            <li>Update your profile information</li>
            <li>Stay connected with church communications</li>
          </ul>
          <p>To get started, please verify your email address by clicking the link below:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}" 
             style="background-color: #D4AF77; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
          <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
          <p>God bless you,<br>CSPAPP Church Team</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2024 CSPAPP Church. All rights reserved.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, 'Welcome to CSPAPP Church', html);
  }

  // Send donation receipt
  async sendDonationReceipt(user, donation) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1E3A8A; padding: 20px; text-align: center;">
          <h1 style="color: #D4AF77; margin: 0;">Donation Receipt</h1>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h2>Thank you for your donation!</h2>
          <p>Dear ${user.fullName},</p>
          <p>Thank you for your generous donation to CSPAPP Church. Your support helps us continue our mission and serve our community.</p>
          
          <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0; border-left: 4px solid #D4AF77;">
            <p><strong>Transaction Details:</strong></p>
            <p>Amount: ₦${donation.amount.toLocaleString()}</p>
            <p>Purpose: ${donation.purpose}</p>
            <p>Transaction ID: ${donation.transactionId}</p>
            <p>Date: ${new Date(donation.createdAt).toLocaleDateString()}</p>
            <p>Status: ${donation.status.toUpperCase()}</p>
          </div>
          
          <p>Your donation receipt is attached to this email. You can also view your donation history by logging into your account.</p>
          
          <a href="${process.env.FRONTEND_URL}/donation-history" 
             style="background-color: #D4AF77; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Donation History
          </a>
          
          <p style="margin-top: 20px;">May God richly bless you for your generosity.</p>
          <p>In His service,<br>CSPAPP Church Team</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an official receipt from CSPAPP Church.</p>
          <p>© 2024 CSPAPP Church. All rights reserved.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, `Donation Receipt - ${donation.purpose}`, html);
  }

  // Send mass email
  async sendMassEmail(recipients, subject, message, senderName = 'CSPAPP Church') {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1E3A8A; padding: 20px; text-align: center;">
          <h1 style="color: #D4AF77; margin: 0;">CSPAPP Church</h1>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          ${message}
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2024 CSPAPP Church. All rights reserved.</p>
          <p>You received this email because you're registered with CSPAPP Church.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(recipients, subject, html);
  }

  // Send birthday email
  async sendBirthdayEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1E3A8A; padding: 20px; text-align: center;">
          <h1 style="color: #D4AF77; margin: 0;">Happy Birthday! 🎉</h1>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h2>Dear ${user.fullName},</h2>
          <p>Happy Birthday! On this special day, we thank God for your life and celebrate you.</p>
          <p>May God continue to bless you with good health, joy, and prosperity. We're grateful to have you as part of our church family.</p>
          <p>Please join us this Sunday as we celebrate all our birthday celebrants.</p>
          <p>We pray that:</p>
          <ul>
            <li>This new year of your life brings unprecedented blessings</li>
            <li>God's favor will go before you</li>
            <li>Your heart's desires shall be granted</li>
          </ul>
          <p>Happy Birthday once again!</p>
          <p>With love,<br>CSPAPP Church Family</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2024 CSPAPP Church. All rights reserved.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, 'Happy Birthday from CSPAPP Church! 🎂', html);
  }
}

module.exports = new EmailService();