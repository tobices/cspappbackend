const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyToken } = require('../utils/jwtHelper');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const crypto = require('crypto');
const { success } = require('zod/v4');

// Register new user with email verification
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      dateOfBirth,
      phoneNumber,
      permanentAddress,
      residentialAddress,
      graduationYear,
      courseOfStudy,
      unit
    } = req.body;

    console.log('=================================');
    console.log('Registration attempt for email:', email);
    console.log('Phone number:', phoneNumber);
    console.log('=================================');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    //Check if phone number exist
    const existingPhone = await User.findOne ({phoneNumber});

  if (existingPhone) {
    return res.status(400).json({
      success: false,
      message: 'This phone number is already registered, please use a different phone number or login to your existing account.'
    });
  }

   // Format phone number to standard format (optional but recommended)
    let formattedPhone = phoneNumber;
    // Remove any non-digit characters except '+'
    formattedPhone = formattedPhone.replace(/[^\d+]/g, '');
    // Ensure it starts with country code (add +234 if it starts with 0)
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+234' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    console.log('Generated token:', emailVerificationToken);
    console.log('Token expires:', new Date(emailVerificationExpires).toISOString());
    console.log('Formatted phone:', formattedPhone);

    // Create new user
    const user = await User.create({
      fullName,
      email,
      password,
      dateOfBirth,
      phoneNumber: formattedPhone,
      permanentAddress,
      residentialAddress,
      graduationYear,
      courseOfStudy,
      unit,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires
    });

    console.log('User created with ID:', user._id);
    console.log('Stored token in DB:', user.emailVerificationToken);

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    console.log('Verification URL:', verificationUrl);
    
    const emailResult = await emailService.sendVerificationEmail(user, verificationUrl);
    console.log('Email send result:', emailResult);

    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: { user }
    });
  } catch (error) {
    console.error('Registration error:', error);
// Handle duplicate key error for phone number
    if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered. Please use a different phone number.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user with email verification check
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact admin.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token
    const newToken = generateToken(user._id, user.role);
    
    res.status(200).json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Verify email - COMPLETE WORKING VERSION
// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('=================================');
    console.log('Email Verification Request');
    console.log('Token received:', token);
    console.log('=================================');
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No verification token provided'
      });
    }
    
    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token. Please request a new verification email.'
      });
    }
    
    console.log('Found user:', user.email);
    
    // Check if already verified
    if (user.emailVerified) {
      console.log('Email already verified');
      // Return 200 OK instead of 400
      return res.status(200).json({
        success: true,
        message: 'Email already verified. You can login now.'
      });
    }
    
    // Check if token is expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired. Please request a new verification email.',
        email: user.email
      });
    }
    
    // Verify the user
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    
    console.log(`✅ User ${user.email} verified successfully!`);
    
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
};
// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Resend verification requested for email:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }
    
    // Generate new token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();
    
    console.log('New token generated for user:', user.email);
    console.log('New token:', emailVerificationToken);
    
    // Send new verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await emailService.sendVerificationEmail(user, verificationUrl);
    
    res.status(200).json({
      success: true,
      message: 'Verification email resent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordResetEmail(user, resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed',
      error: error.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
};

// Change password (authenticated)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).select('+password');
    
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed',
      error: error.message
    });
  }
};

// DEBUG: Check all users and their tokens (REMOVE AFTER TESTING)
exports.debugUsers = async (req, res) => {
  try {
    const users = await User.find({}, {
      email: 1,
      emailVerified: 1,
      emailVerificationToken: 1,
      emailVerificationExpires: 1,
      createdAt: 1
    });
    
    console.log('=== All Users in Database ===');
    users.forEach(user => {
      console.log({
        email: user.email,
        verified: user.emailVerified,
        token: user.emailVerificationToken,
        expires: user.emailVerificationExpires
      });
    });
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Check token for specific user (for debugging)
exports.checkUserToken = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      email: user.email,
      emailVerified: user.emailVerified,
      token: user.emailVerificationToken,
      tokenExpires: user.emailVerificationExpires,
      tokenExists: !!user.emailVerificationToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};