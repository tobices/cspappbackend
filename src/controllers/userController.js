const User = require('../models/User');
const { formatPhoneNumber, isPhoneNumberExists } = require('../utils/phoneHelper');

let cacheService;

// Try to load cache service, but don't fail if not available
try {
  cacheService = require('../services/cacheService');
} catch (error) {
  console.log('⚠️ Cache service not available, continuing without caching');
  cacheService = {
    get: async () => null,
    set: async () => {},
    del: async () => {},
    delPattern: async () => {}
  };
}

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const { role, unit, search } = req.query;

    let query = {};
    if (role) query.role = role;
    if (unit) query.unit = unit;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check authorization (users can only view themselves, admins can view anyone)
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update current user (own profile)
exports.updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    console.log('Updating current user:', userId);
    console.log('Update data:', updates);
    
    // Check if phone number is being updated and if it already exists
    if (updates.phoneNumber) {
      const formattedPhone = formatPhoneNumber(updates.phoneNumber);
      const phoneExists = await isPhoneNumberExists(User, formattedPhone, userId);
      
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered to another user'
        });
      }
      updates.phoneNumber = formattedPhone;
    }

    // Remove sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.email;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update current user error:', error);

       // Handle duplicate key error for phone number
    if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered to another user'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Update user (admin or self)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('Updating user ID:', id);
    console.log('Update data:', updates);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    // Check if phone number is being updated and if it already exists
    if (updates.phoneNumber) {
      const formattedPhone = formatPhoneNumber(updates.phoneNumber);
      const phoneExists = await isPhoneNumberExists(User, formattedPhone, id);
      
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered to another user'
        });
      }
      updates.phoneNumber = formattedPhone;
    }
    
    // Remove sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.email;

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);

     // Handle duplicate key error for phone number
    if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered to another user'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Deleting user ID:', userId);
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Export users to CSV (admin only)
exports.exportUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'member' }).select('-password');
    
    const csvData = users.map(user => ({
      'Full Name': user.fullName,
      'Email': user.email,
      'Phone': user.phoneNumber,
      'Date of Birth': user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '',
      'Unit': user.unit,
      'Graduation Year': user.graduationYear,
      'Course of Study': user.courseOfStudy,
      'Member Since': user.createdAt ? user.createdAt.toISOString().split('T')[0] : ''
    }));

    const headers = Object.keys(csvData[0]);
    const csv = [headers.join(','), ...csvData.map(row => headers.map(h => row[h]).join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=members_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users',
      error: error.message
    });
  }
};

// Get user statistics (admin only)
exports.getUserStats = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ role: 'member' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeMembers = await User.countDocuments({ role: 'member', isActive: true });
    
    const units = await User.aggregate([
      { $match: { role: 'member' } },
      { $group: { _id: '$unit', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMembers,
        totalAdmins,
        activeMembers,
        units
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};