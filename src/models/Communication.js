const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'sms'],
    required: true
  },
  subject: {
    type: String,
    required: function() {
      return this.type === 'email';
    }
  },
  message: {
    type: String,
    required: true
  },
  recipients: [{
    type: String,
    required: true
  }],
  recipientGroups: [{
    type: String,
    enum: ['all', 'birthdays', 'choir', 'ushering', 'media', 'youth', 'prayer', 'evangelism']
  }],
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'partial'],
    default: 'sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
communicationSchema.index({ sentBy: 1 });
communicationSchema.index({ sentAt: -1 });
communicationSchema.index({ type: 1 });
communicationSchema.index({ status: 1 });

const Communication = mongoose.model('Communication', communicationSchema);

module.exports = Communication;