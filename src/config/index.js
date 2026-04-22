const connectDB = require('./database');
const cloudinary = require('./cloudinary');
const redis = require('./redis');

module.exports = {
  connectDB,
  cloudinary,
  redis,
  
  // Database configuration
  dbConfig: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

   // Redis configuration
  redisConfig: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
  },
  
  // Server configuration
  serverConfig: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  
  // JWT configuration
  jwtConfig: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  },
  
  // Paystack configuration
  paystackConfig: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL
  },
  
  // Email configuration
  emailConfig: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromEmail: process.env.SMTP_FROM_EMAIL,
    fromName: process.env.SMTP_FROM_NAME
  },
  
  // SMS configuration
  smsConfig: {
    apiKey: process.env.HOLLATAGS_API_KEY,
    username: process.env.HOLLATAGS_USERNAME,
    senderId: process.env.HOLLATAGS_SENDER_ID,
    baseUrl: process.env.HOLLATAGS_BASE_URL
  },
  
  // Rate limiting configuration
  rateLimitConfig: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Cache configuration
  cacheConfig: {
    ttl: parseInt(process.env.CACHE_TTL) || 300,
    enabled: process.env.NODE_ENV === 'production',
  },
};