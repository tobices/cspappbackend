const Donation = require('../models/Donation');
const User = require('../models/User');
const paystackService = require('../services/paystackService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const crypto = require('crypto');

// Initialize donation
exports.initializeDonation = async (req, res) => {
  try {
    const { amount, purpose, paymentMethod } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate unique reference
    const reference = `CSPAPP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create donation record
    const donation = await Donation.create({
      user: userId,
      amount,
      purpose,
      paymentMethod,
      reference,
      status: 'pending',
      paymentGateway: 'paystack'
    });

    // Initialize Paystack transaction
    const payment = await paystackService.initializeTransaction(
      user.email,
      amount,
      {
        donationId: donation._id.toString(),
        userId: userId,
        purpose
      }
    );

    if (!payment.success) {
      donation.status = 'failed';
      await donation.save();
      return res.status(400).json({
        success: false,
        message: payment.error
      });
    }

    donation.paystackReference = payment.data.reference;
    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Donation initialized',
      data: {
        donation,
        authorizationUrl: payment.authorizationUrl,
        reference: payment.reference
      }
    });
  } catch (error) {
    console.error('Initialize donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize donation',
      error: error.message
    });
  }
};

// Verify donation payment
exports.verifyDonation = async (req, res) => {
  try {
    const { reference } = req.params;
    
    const donation = await Donation.findOne({ reference });
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Verify with Paystack
    const verification = await paystackService.verifyTransaction(reference);
    
    if (!verification.success) {
      donation.status = 'failed';
      await donation.save();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update donation
    donation.status = 'completed';
    donation.transactionId = verification.data.reference;
    donation.paidAt = new Date();
    await donation.save();

    // Get user
    const user = await User.findById(donation.user);
    
    // Send email receipt
    await emailService.sendDonationReceipt(user, donation);
    
    // Send SMS confirmation
    await smsService.sendDonationConfirmation(user, donation);

    res.status(200).json({
      success: true,
      message: 'Donation verified successfully',
      data: { donation }
    });
  } catch (error) {
    console.error('Verify donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Paystack webhook
exports.paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    // Verify webhook signature
    if (!paystackService.verifyWebhook(signature, req.body)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const event = req.body;
    
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      
      const donation = await Donation.findOne({ paystackReference: reference });
      if (donation && donation.status === 'pending') {
        donation.status = 'completed';
        donation.transactionId = reference;
        donation.paidAt = new Date();
        await donation.save();

        const user = await User.findById(donation.user);
        await emailService.sendDonationReceipt(user, donation);
        await smsService.sendDonationConfirmation(user, donation);
      }
    }

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// Get user's donations
exports.getMyDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const donations = await Donation.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        donations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations',
      error: error.message
    });
  }
};

// Get all donations (admin only)
exports.getAllDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, purpose, startDate, endDate } = req.query;

    let query = {};
    if (status) query.status = status;
    if (purpose) query.purpose = purpose;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const donations = await Donation.find(query)
      .populate('user', 'fullName email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments(query);
    
    // Calculate totals
    const totalAmount = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        donations,
        summary: {
          totalAmount: totalAmount[0]?.total || 0,
          totalDonations: total
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations',
      error: error.message
    });
  }
};

// Get donation statistics
exports.getDonationStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Monthly donations for current year
    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Donations by purpose
    const byPurpose = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$purpose',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent donations
    const recentDonations = await Donation.find({ status: 'completed' })
      .populate('user', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        monthlyDonations,
        byPurpose,
        recentDonations,
        totalDonations: await Donation.countDocuments({ status: 'completed' }),
        totalAmount: (await Donation.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]))[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Export donations to CSV (admin only)
exports.exportDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'completed' })
      .populate('user', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });

    const csvData = donations.map(donation => ({
      'Date': donation.createdAt.toISOString().split('T')[0],
      'Donor Name': donation.user.fullName,
      'Donor Email': donation.user.email,
      'Donor Phone': donation.user.phoneNumber,
      'Amount': donation.amount,
      'Purpose': donation.purpose,
      'Transaction ID': donation.transactionId,
      'Payment Method': donation.paymentMethod
    }));

    const headers = Object.keys(csvData[0]);
    const csv = [headers.join(','), ...csvData.map(row => headers.map(h => row[h]).join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=donations_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export donations',
      error: error.message
    });
  }
};