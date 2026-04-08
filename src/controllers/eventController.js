const Event = require('../models/Event');
const User = require('../models/User');

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const { category, upcoming } = req.query;

    let query = { isActive: true };
    if (category) query.category = category;
    if (upcoming === 'true') query.date = { $gte: new Date() };

    const events = await Event.find(query)
      .populate('createdBy', 'fullName')
      .populate('registeredAttendees', 'fullName email')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

// Get single event
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'fullName')
      .populate('registeredAttendees', 'fullName email phoneNumber');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
};

// Create event (admin only)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, capacity, category } = req.body;
    
    const event = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      capacity,
      category,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
};

// Update event (admin only)
exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log('Updating event ID:', eventId);
    console.log('Update data:', req.body);
    
    const event = await Event.findByIdAndUpdate(
      eventId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

// Delete event (admin only)
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log('Deleting event ID:', eventId);
    
    const event = await Event.findByIdAndDelete(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
};

// Register for event
exports.registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.registeredAttendees.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    if (event.capacity && event.registeredAttendees.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    event.registeredAttendees.push(userId);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered for event',
      data: { event }
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: error.message
    });
  }
};

// Get event attendees (admin only)
exports.getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registeredAttendees', 'fullName email phoneNumber unit');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        attendees: event.registeredAttendees,
        count: event.registeredAttendees.length
      }
    });
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendees',
      error: error.message
    });
  }
};