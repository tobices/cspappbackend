const { validationResult } = require('express-validator');

// Validate request
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
      message: 'Validation failed'
    });
  }
  next();
};

// Validate donation amount
exports.validateDonation = (req, res, next) => {
  const { amount, purpose, paymentMethod } = req.body;
  
  if (!amount || amount < 1) {
    return res.status(400).json({
      success: false,
      message: 'Valid donation amount is required'
    });
  }
  
  if (!purpose) {
    return res.status(400).json({
      success: false,
      message: 'Donation purpose is required'
    });
  }
  
  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required'
    });
  }
  
  next();
};

// Validate event
exports.validateEvent = (req, res, next) => {
  const { title, description, date, time, venue } = req.body;
  
  if (!title || title.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Valid event title is required'
    });
  }
  
  if (!description || description.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Event description must be at least 10 characters'
    });
  }
  
  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Event date is required'
    });
  }
  
  if (!time) {
    return res.status(400).json({
      success: false,
      message: 'Event time is required'
    });
  }
  
  if (!venue) {
    return res.status(400).json({
      success: false,
      message: 'Event venue is required'
    });
  }
  
  next();
};

// Validate communication
exports.validateCommunication = (req, res, next) => {
  const { subject, message, recipientGroups } = req.body;
  
  if (req.path.includes('/email') && (!subject || subject.length < 3)) {
    return res.status(400).json({
      success: false,
      message: 'Email subject is required'
    });
  }
  
  if (!message || message.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Message must be at least 10 characters'
    });
  }
  
  if (!recipientGroups || recipientGroups.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one recipient group is required'
    });
  }
  
  next();
};