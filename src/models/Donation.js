const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be at least 1']
  },
  purpose: {
    type: String,
    enum: ['Tithe', 'Offering', 'Project', 'Thanksgiving', 'Building Fund', 'Mission', 'Welfare', 'Other'],
    required: [true, 'Purpose is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'paystack', 'flutterwave'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  reference: {
    type: String,
    unique: true,
    required: true
  },
  paystackReference: String,
  paymentGateway: {
    type: String,
    enum: ['paystack', 'flutterwave', 'manual'],
    default: 'paystack'
  },
  receiptUrl: String,
  metadata: mongoose.Schema.Types.Mixed,
  paidAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
donationSchema.index({ user: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ reference: 1 }, { unique: true });
donationSchema.index({ purpose: 1 });
donationSchema.index({ amount: 1 });

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return `₦${this.amount.toLocaleString()}`;
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;