const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [3, 'Full name must be at least 3 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique:true,
    sparse:true,
    trim:true,
    match: [/^[0-9+\-\s()]+$/, 'Please provide a valid phone number']
   
  },
  permanentAddress: {
    type: String,
    required: [true, 'Permanent address is required'],
    trim: true
  },
  residentialAddress: {
    type: String,
    required: [true, 'Residential address is required'],
    trim: true
  },
  graduationYear: {
    type: String,
    required: [true, 'Graduation year is required']
  },
  courseOfStudy: {
    type: String,
    required: [true, 'Course of study is required']
  },
  unit: {
    type: String,
    enum: ['Choir', 'Ushering', 'Media', 'Prayer', 'Youth', 'Evangelism', 'Children', 'Technical', 'Pastoral'],
    required: [true, 'Unit is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default:null
  },
  emailVerificationExpires: {
    type:Date,
    default:null
  },
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  profilePicture: String
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name for display
userSchema.virtual('displayName').get(function() {
  return this.fullName.split(' ')[0];
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({phoneNumber: 1}, {unique: true, sparse: true});
userSchema.index({ role: 1 });
userSchema.index({ unit: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;