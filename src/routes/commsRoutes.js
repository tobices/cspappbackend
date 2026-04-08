const express = require('express');
const router = express.Router();
const commsController = require('../controllers/commsController');
const { protect, adminOnly } = require('../middleware/auth');

// Debug: Check if controller functions exist
console.log('commsController functions:', Object.keys(commsController));

// Admin only routes
router.post('/email', protect, adminOnly, commsController.sendMassEmail);
router.post('/sms', protect, adminOnly, commsController.sendMassSMS);
router.post('/sms/single', protect, adminOnly, commsController.sendSingleSMS);
router.get('/sms/balance', protect, adminOnly, commsController.getSMSBalance);
router.post('/birthday', protect, adminOnly, commsController.sendBirthdayEmails);
router.get('/history', protect, adminOnly, commsController.getCommunicationHistory);
router.post('/birthday/trigger', protect, adminOnly, commsController.triggerBirthdayCheck);


// Test SMS endpoint
router.post('/sms/test', protect, adminOnly, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }
    
    const result = await smsService.sendSMS(phoneNumber, message);
    
    res.status(200).json({
      success: result.success,
      message: result.success ? 'SMS sent successfully' : 'SMS sending failed',
      data: result
    });
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SMS',
      error: error.message
    });
  }
});

module.exports = router;

