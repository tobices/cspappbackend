const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);

// DEBUG routes (remove in production)
router.get('/debug-users', authController.debugUsers);
router.get('/check-token/:email', authController.checkUserToken);

module.exports = router;