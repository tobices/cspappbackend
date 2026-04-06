const User = require('../models/User');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService'); // This line was missing!

// Send mass email (admin only)
exports.sendMassEmail = async (req, res) => {
  try {
    const { subject, message, recipientGroups, customRecipients } = req.body;
    
    let recipients = [];
    
    // Build recipient list based on groups
    if (recipientGroups && recipientGroups.includes('all')) {
      const users = await User.find({ isActive: true });
      recipients = users.map(u => u.email);
    } else {
      if (recipientGroups && recipientGroups.includes('birthdays')) {
        const today = new Date();
        const birthdayUsers = await User.find({
          $expr: {
            $and: [
              { $eq: [{ $month: '$dateOfBirth' }, today.getMonth() + 1] },
              { $eq: [{ $dayOfMonth: '$dateOfBirth' }, today.getDate()] }
            ]
          }
        });
        recipients.push(...birthdayUsers.map(u => u.email));
      }
      
      if (recipientGroups && recipientGroups.includes('choir')) {
        const choirUsers = await User.find({ unit: 'Choir', isActive: true });
        recipients.push(...choirUsers.map(u => u.email));
      }
      
      if (recipientGroups && recipientGroups.includes('ushering')) {
        const usheringUsers = await User.find({ unit: 'Ushering', isActive: true });
        recipients.push(...usheringUsers.map(u => u.email));
      }
      
      if (recipientGroups && recipientGroups.includes('media')) {
        const mediaUsers = await User.find({ unit: 'Media', isActive: true });
        recipients.push(...mediaUsers.map(u => u.email));
      }
      
      if (recipientGroups && recipientGroups.includes('youth')) {
        const youthUsers = await User.find({ unit: 'Youth', isActive: true });
        recipients.push(...youthUsers.map(u => u.email));
      }
      
      if (customRecipients && customRecipients.length > 0) {
        recipients.push(...customRecipients);
      }
    }
    
    // Remove duplicates
    recipients = [...new Set(recipients)];
    
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients selected'
      });
    }
    
    // Send emails
    const result = await emailService.sendMassEmail(recipients, subject, message);
    
    res.status(200).json({
      success: true,
      message: `Email sent to ${recipients.length} recipients`,
      data: {
        recipientsCount: recipients.length,
        result
      }
    });
  } catch (error) {
    console.error('Send mass email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emails',
      error: error.message
    });
  }
};

// Send mass SMS (admin only)
exports.sendMassSMS = async (req, res) => {
  try {
    const { message, recipientGroups, customRecipients } = req.body;
    
    let phoneNumbers = [];
    
    // Build recipient list based on groups
    if (recipientGroups && recipientGroups.includes('all')) {
      const users = await User.find({ isActive: true });
      phoneNumbers = users.map(u => u.phoneNumber);
    } else {
      if (recipientGroups && recipientGroups.includes('birthdays')) {
        const today = new Date();
        const birthdayUsers = await User.find({
          $expr: {
            $and: [
              { $eq: [{ $month: '$dateOfBirth' }, today.getMonth() + 1] },
              { $eq: [{ $dayOfMonth: '$dateOfBirth' }, today.getDate()] }
            ]
          }
        });
        phoneNumbers.push(...birthdayUsers.map(u => u.phoneNumber));
      }
      
      if (recipientGroups && recipientGroups.includes('choir')) {
        const choirUsers = await User.find({ unit: 'Choir', isActive: true });
        phoneNumbers.push(...choirUsers.map(u => u.phoneNumber));
      }
      
      if (recipientGroups && recipientGroups.includes('ushering')) {
        const usheringUsers = await User.find({ unit: 'Ushering', isActive: true });
        phoneNumbers.push(...usheringUsers.map(u => u.phoneNumber));
      }
      
      if (recipientGroups && recipientGroups.includes('media')) {
        const mediaUsers = await User.find({ unit: 'Media', isActive: true });
        phoneNumbers.push(...mediaUsers.map(u => u.phoneNumber));
      }
      
      if (customRecipients && customRecipients.length > 0) {
        phoneNumbers.push(...customRecipients);
      }
    }
    
    // Remove duplicates and invalid numbers
    phoneNumbers = [...new Set(phoneNumbers)];
    phoneNumbers = phoneNumbers.filter(num => num && num.length >= 10);
    
    if (phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipients selected'
      });
    }
    
    // Check message length (max 905 characters)
    if (message.length > 905) {
      return res.status(400).json({
        success: false,
        message: 'SMS message exceeds 905 character limit'
      });
    }
    
    // Send SMS in batches of 500 (API limit)
    const batchSize = 500;
    const batches = [];
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      batches.push(phoneNumbers.slice(i, i + batchSize));
    }
    
    let totalSent = 0;
    
    for (const batch of batches) {
      const result = await smsService.sendBulkSMS(batch, message);
      if (result.success) {
        totalSent += result.totalSent || batch.length;
      }
      
      // Small delay between batches to avoid rate limiting
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    res.status(200).json({
      success: true,
      message: `SMS sent to ${totalSent} of ${phoneNumbers.length} recipients`,
      data: {
        recipientsCount: phoneNumbers.length,
        sentCount: totalSent
      }
    });
  } catch (error) {
    console.error('Send mass SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SMS',
      error: error.message
    });
  }
};

// Send single SMS (for testing)
exports.sendSingleSMS = async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }
    
    if (message.length > 905) {
      return res.status(400).json({
        success: false,
        message: 'SMS message exceeds 905 character limit'
      });
    }
    
    const result = await smsService.sendSMS(phoneNumber, message);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send SMS',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Send single SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SMS',
      error: error.message
    });
  }
};

// Get SMS balance
exports.getSMSBalance = async (req, res) => {
  try {
    const balance = await smsService.checkBalance();
    
    res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SMS balance',
      error: error.message
    });
  }
};

// Send automated birthday emails and SMS
exports.sendBirthdayEmails = async (req, res) => {
  try {
    const today = new Date();
    const birthdayUsers = await User.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$dateOfBirth' }, today.getMonth() + 1] },
          { $eq: [{ $dayOfMonth: '$dateOfBirth' }, today.getDate()] }
        ]
      },
      isActive: true
    });
    
    let emailCount = 0;
    let smsCount = 0;
    
    for (const user of birthdayUsers) {
      // Send birthday email
      const emailResult = await emailService.sendBirthdayEmail(user);
      if (emailResult.success) emailCount++;
      
      // Send birthday SMS
      const smsResult = await smsService.sendBirthdaySMS(user);
      if (smsResult.success) smsCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    res.status(200).json({
      success: true,
      message: `Birthday wishes sent to ${birthdayUsers.length} members`,
      data: { 
        totalMembers: birthdayUsers.length,
        emailsSent: emailCount,
        smsSent: smsCount
      }
    });
  } catch (error) {
    console.error('Send birthday emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send birthday wishes',
      error: error.message
    });
  }
};

// Get communication history
exports.getCommunicationHistory = async (req, res) => {
  try {
    // This would typically come from a Communication model
    // For now, returning a placeholder
    res.status(200).json({
      success: true,
      data: {
        communications: []
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message
    });
  }
};