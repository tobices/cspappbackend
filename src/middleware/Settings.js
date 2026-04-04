const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  churchName: {
    type: String,
    default: 'CSPAPP Church'
  },
  churchEmail: {
    type: String,
    default: 'info@cspapp.com'
  },
  churchPhone: {
    type: String,
    default: '+2348012345678'
  },
  churchAddress: {
    type: String,
    default: '123 Church Street, Lagos, Nigeria'
  },
  churchLogo: {
    type: String,
    default: null
  },
  timezone: {
    type: String,
    default: 'Africa/Lagos'
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  enableBirthdayEmails: {
    type: Boolean,
    default: true
  },
  enableBirthdaySMS: {
    type: Boolean,
    default: false
  },
  enableDonationReceipts: {
    type: Boolean,
    default: true
  },
  donationReceiptFooter: {
    type: String,
    default: 'Thank you for your generosity. God bless you!'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Singleton - only one settings document
settingsSchema.statics.getInstance = async function() {
  const settings = await this.findOne();
  if (settings) return settings;
  return await this.create({});
};

module.exports = mongoose.model('Settings', settingsSchema);