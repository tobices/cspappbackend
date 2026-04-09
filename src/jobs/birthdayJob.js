// Load environment variables FIRST
require('dotenv').config();

const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('../models/User');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Database connection function
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected for birthday job');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

/**
 * Send birthday wishes to all members whose birthday is today
 */
async function sendBirthdayWishes() {
  const startTime = Date.now();
  console.log('=================================');
  console.log('🎂 Birthday Job Started:', new Date().toISOString());
  console.log('=================================');
  
  // Ensure database is connected
  if (mongoose.connection.readyState !== 1) {
    console.log('⏳ Database not connected, attempting to connect...');
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Cannot run birthday job: Database connection failed');
      return;
    }
  }
  
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    console.log(`📅 Checking for birthdays on: ${currentMonth}/${currentDay}`);
    
    // Find all active members with birthday today
    const birthdayUsers = await User.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$dateOfBirth' }, currentMonth] },
          { $eq: [{ $dayOfMonth: '$dateOfBirth' }, currentDay] }
        ]
      },
      isActive: true
    });
    
    console.log(`👥 Found ${birthdayUsers.length} member(s) with birthdays today`);
    
    if (birthdayUsers.length === 0) {
      console.log('✨ No birthdays today. Job completed.');
      console.log('=================================\n');
      return;
    }
    
    let emailSuccess = 0;
    let emailFailed = 0;
    let smsSuccess = 0;
    let smsFailed = 0;
    
    // Process each birthday user
    for (let i = 0; i < birthdayUsers.length; i++) {
      const user = birthdayUsers[i];
      console.log(`\n📨 Processing (${i + 1}/${birthdayUsers.length}): ${user.fullName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phoneNumber}`);
      
      // Send birthday email
      try {
        const emailResult = await emailService.sendBirthdayEmail(user);
        if (emailResult && emailResult.success) {
          emailSuccess++;
          console.log(`   ✅ Email sent successfully`);
        } else {
          emailFailed++;
          console.log(`   ⚠️ Email failed: ${emailResult?.error || 'Unknown error'}`);
        }
      } catch (emailError) {
        emailFailed++;
        console.log(`   ❌ Email error: ${emailError.message}`);
      }
      
      // Send birthday SMS
      try {
        const smsResult = await smsService.sendBirthdaySMS(user);
        if (smsResult && smsResult.success) {
          smsSuccess++;
          console.log(`   ✅ SMS sent successfully`);
        } else {
          smsFailed++;
          console.log(`   ⚠️ SMS failed: ${smsResult?.error || 'Unknown error'}`);
        }
      } catch (smsError) {
        smsFailed++;
        console.log(`   ❌ SMS error: ${smsError.message}`);
      }
      
      // Small delay to avoid rate limiting
      if (i < birthdayUsers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Summary report
    console.log('\n=================================');
    console.log('📊 Birthday Job Summary');
    console.log('=================================');
    console.log(`📅 Date: ${today.toLocaleDateString()}`);
    console.log(`👥 Total Members: ${birthdayUsers.length}`);
    console.log(`📧 Emails - Sent: ${emailSuccess}, Failed: ${emailFailed}`);
    console.log(`📱 SMS - Sent: ${smsSuccess}, Failed: ${smsFailed}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('=================================\n');
    
  } catch (error) {
    console.error('❌ Birthday job error:', error);
    console.error('Error details:', error.message);
  }
}

// Only schedule if we're not in a test environment and not running as standalone
let isScheduled = false;

async function initializeJob() {
  // Connect to database first
  const connected = await connectDB();
  
  if (connected && !isScheduled) {
    // Initialize the birthday job scheduler
    // Runs every day at 8:00 AM
    cron.schedule('22 15 * * *', () => {
      console.log('⏰ Running scheduled birthday job...');
      sendBirthdayWishes();
    });
    
    isScheduled = true;
    
    console.log('=================================');
    console.log('📅 Birthday Automation Service');
    console.log('=================================');
    console.log('✅ Birthday job scheduler initialized');
    console.log('⏰ Schedule: Daily at 8:00 AM');
    console.log('📧 Service: Email + SMS');
    console.log('=================================\n');
    
    // Optional: Run once immediately on startup for testing
    // Uncomment the line below if you want to test immediately
    // setTimeout(() => sendBirthdayWishes(), 5000);
  }
}

// Run initialization
initializeJob();

// Export for use in other files
module.exports = { 
  sendBirthdayWishes 
};