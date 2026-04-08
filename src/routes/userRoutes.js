const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// Protected routes (authenticated users)
router.get('/profile', protect, userController.getCurrentUser);
router.put('/profile', protect, userController.updateCurrentUser);
router.put('/profile/:id', protect, userController.updateUser);
router.put('/:id', protect, userController.updateUser);

// Admin only routes
router.get('/', protect, adminOnly, userController.getAllUsers);
router.get('/stats', protect, adminOnly, userController.getUserStats);
router.get('/export', protect, adminOnly, userController.exportUsers);
router.get('/:id', protect, adminOnly, userController.getUserById);
router.delete('/:id', protect, adminOnly, userController.deleteUser);

module.exports = router;