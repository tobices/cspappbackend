const User = require('../models/User');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Send mass email (admin only)
exports.sendMassEmail = async (req, res) => {
  try {
    const { subject, message, recipientGroups, customRecipients } = req.body;
    
    let recipients = [];
    
    // Build recipient list based on groups
    if (recipientGroups.includes('all')) {
      const users = await User.find({ isActive: true });
      recipients = users.map(u => u.email);
    } else {
      if (recipientGroups.includes('birthdays')) {
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
      
      if (recipientGroups.includes('choir')) {
        const choirUsers = await User.find({ unit: 'Choir', isActive: true });
        recipients.push(...choirUsers.map(u => u.email));
      }
      
      if (recipientGroups.includes('ushering')) {
        const usheringUsers = await User.find({ unit: 'Ushering', isActive: true });
        recipients.push(...usheringUsers.map(u => u.email));
      }
      
      if (recipientGroups.includes('media')) {
        const mediaUsers = await User.find({ unit: 'Media', isActive: true });
        recipients.push(...mediaUsers.map(u => u.email));
      }
      
      if (recipientGroups.includes('youth')) {
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
    
    // Log communication (you could save to database here)
    
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
    if (recipientGroups.includes('all')) {
      const users = await User.find({ isActive: true });
      phoneNumbers = users.map(u => u.phoneNumber);
    } else {
      if (recipientGroups.includes('birthdays')) {
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
      
      if (recipientGroups.includes('choir')) {
        const choirUsers = await User.find({ unit: 'Choir', isActive: true });
        phoneNumbers.push(...choirUsers.map(u => u.phoneNumber));
      }
      
      if (recipientGroups.includes('ushering')) {
        const usheringUsers = await User.find({ unit: 'Ushering', isActive: true });
        phoneNumbers.push(...usheringUsers.map(u => u.phoneNumber));
      }
      
      if (recipientGroups.includes('media')) {
        const mediaUsers = await User.find({ unit: 'Media', isActive: true });
        phoneNumbers.push(...mediaUsers.map(u => u.phoneNumber));
      }
      
      if (customRecipients && customRecipients.length > 0) {
        phoneNumbers.push(...customRecipients);
      }
    }
    
    // Remove duplicates
    phoneNumbers = [...new Set(phoneNumbers)];
    
    if (phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients selected'
      });
    }
    
    // Send SMS
    const result = await smsService.sendBulkSMS(phoneNumbers, message);
    
    res.status(200).json({
      success: true,
      message: `SMS sent to ${result.totalSent} recipients`,
      data: {
        recipientsCount: phoneNumbers.length,
        result
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

// Send automated birthday emails
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
    
    let sentCount = 0;
    
    for (const user of birthdayUsers) {
      await emailService.sendBirthdayEmail(user);
      await smsService.sendBirthdaySMS(user);
      sentCount++;
    }
    
    res.status(200).json({
      success: true,
      message: `Birthday wishes sent to ${sentCount} members`,
      data: { sentCount }
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