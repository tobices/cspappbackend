const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    required: [true, 'Event time is required']
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  capacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1'],
    default: null
  },
  registeredAttendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['Sunday Service', 'Bible Study', 'Conference', 'Seminar', 'Outreach', 'Fellowship', 'Other'],
    default: 'Other'
  }
}, {
  timestamps: true
});

// Check if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return new Date(this.date) > new Date();
});

// Get attendee count
eventSchema.virtual('attendeeCount').get(function() {
  return this.registeredAttendees.length;
});

// Indexes
eventSchema.index({ date: -1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ category: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;