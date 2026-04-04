const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const donationRoutes = require('./donationRoutes');
const eventRoutes = require('./eventRoutes');
const commsRoutes = require('./commsRoutes');

// IMPORTANT: Mount routes WITHOUT version prefix here
// Version prefix will be added in app.js
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/donations', donationRoutes);
router.use('/events', eventRoutes);
router.use('/comms', commsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;