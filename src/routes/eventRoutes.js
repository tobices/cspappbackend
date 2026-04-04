const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes (view events)
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// Protected routes
router.post('/:id/register', protect, eventController.registerForEvent);

// Admin only routes
router.post('/', protect, adminOnly, eventController.createEvent);
router.put('/:id', protect, adminOnly, eventController.updateEvent);
router.delete('/:id', protect, adminOnly, eventController.deleteEvent);
router.get('/:id/attendees', protect, adminOnly, eventController.getEventAttendees);

module.exports = router;