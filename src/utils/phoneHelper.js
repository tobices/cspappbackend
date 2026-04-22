/**
 * Format phone number to international format
 * @param {string} phoneNumber - Raw phone number input
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except '+'
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it starts with 0 (local format), add +234
  if (cleaned.startsWith('0')) {
    cleaned = '+234' + cleaned.substring(1);
  }
  // If it starts with 234 without +, add +
  else if (cleaned.startsWith('234') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  // If it doesn't start with +, add + (assuming it's a local number)
  else if (!cleaned.startsWith('+')) {
    cleaned = '+234' + cleaned;
  }
  
  return cleaned;
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidPhoneNumber = (phoneNumber) => {
  const formatted = formatPhoneNumber(phoneNumber);
  // Nigerian phone numbers are +234XXXXXXXXXX (13 digits total including +)
  // or +234XXX-XXX-XXXX format
  const phoneRegex = /^\+234[0-9]{10}$/;
  return phoneRegex.test(formatted);
};

/**
 * Check if phone number exists in database
 * @param {Object} User - Mongoose User model
 * @param {string} phoneNumber - Phone number to check
 * @param {string} excludeUserId - User ID to exclude (for updates)
 * @returns {Promise<boolean>} True if exists
 */
const isPhoneNumberExists = async (User, phoneNumber, excludeUserId = null) => {
  const formatted = formatPhoneNumber(phoneNumber);
  const query = { phoneNumber: formatted };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const user = await User.findOne(query);
  return !!user;
};

module.exports = {
  formatPhoneNumber,
  isValidPhoneNumber,
  isPhoneNumberExists,
};