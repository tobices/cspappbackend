const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { protect, adminOnly } = require('../middleware/auth');

// Webhook (public, no auth needed)
router.post('/webhook/paystack', donationController.paystackWebhook);

// Protected routes (require authentication)
router.post('/initialize', protect, donationController.initializeDonation);
router.get('/verify/:reference', protect, donationController.verifyDonation);
router.get('/my-donations', protect, donationController.getMyDonations);
router.get('/my-donations/export', protect, donationController.exportMyDonations); // Add this line

// Admin only routes
router.get('/', protect, adminOnly, donationController.getAllDonations);
router.get('/stats', protect, adminOnly, donationController.getDonationStats);
router.get('/export', protect, adminOnly, donationController.exportDonations);

module.exports = router;