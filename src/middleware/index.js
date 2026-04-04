const auth = require('./auth');
const errorHandler = require('./errorHandler');
const notFound = require('./notFound');
const rateLimiter = require('./rateLimiter');
const upload = require('./upload');
const validation = require('./validation');

module.exports = {
  // Auth middleware
  protect: auth.protect,
  adminOnly: auth.adminOnly,
  
  // Error handling
  errorHandler: errorHandler.errorHandler,
  notFound: notFound.notFound,
  
  // Rate limiting
  apiLimiter: rateLimiter.apiLimiter,
  authLimiter: rateLimiter.authLimiter,
  donationLimiter: rateLimiter.donationLimiter,
  commsLimiter: rateLimiter.commsLimiter,
  
  // Upload middleware
  upload: upload.upload,
  uploadToCloudinary: upload.uploadToCloudinary,
  
  // Validation middleware
  validateRequest: validation.validateRequest,
  validateDonation: validation.validateDonation,
  validateEvent: validation.validateEvent,
  validateCommunication: validation.validateCommunication
};