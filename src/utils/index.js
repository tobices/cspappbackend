const helpers = require('./helpers');
const jwtHelper = require('./jwtHelper');
const logger = require('./logger');
const passwordHelper = require('./passwordHelper');

module.exports = {
  // Helpers
  generateReference: helpers.generateReference,
  formatCurrency: helpers.formatCurrency,
  formatDate: helpers.formatDate,
  calculateAge: helpers.calculateAge,
  paginate: helpers.paginate,
  cleanPhoneNumber: helpers.cleanPhoneNumber,
  validateEmail: helpers.validateEmail,
  generateRandomPassword: helpers.generateRandomPassword,
  maskEmail: helpers.maskEmail,
  maskPhoneNumber: helpers.maskPhoneNumber,
  sleep: helpers.sleep,
  retry: helpers.retry,
  
  // JWT helpers
  generateToken: jwtHelper.generateToken,
  generateRefreshToken: jwtHelper.generateRefreshToken,
  verifyToken: jwtHelper.verifyToken,
  
  // Password helpers
  hashPassword: passwordHelper.hashPassword,
  comparePassword: passwordHelper.comparePassword,
  
  // Logger
  logger,
  
  // Combined utilities
  utils: {
    ...helpers,
    ...jwtHelper,
    ...passwordHelper
  }
};