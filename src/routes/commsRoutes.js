const express = require('express');
const router = express.Router();
const commsController = require('../controllers/commsController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin only routes
router.post('/email', protect, adminOnly, commsController.sendMassEmail);
router.post('/sms', protect, adminOnly, commsController.sendMassSMS);
router.post('/birthday', protect, adminOnly, commsController.sendBirthdayEmails);
router.get('/history', protect, adminOnly, commsController.getCommunicationHistory);

module.exports = router;