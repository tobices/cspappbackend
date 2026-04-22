const Redis = require('ioredis');

let redisClient = null;
let redisEnabled = true;

const initRedis = () => {
  // Check if we should enable Redis
  if (process.env.DISABLE_REDIS === 'true') {
    console.log('⚠️ Redis is disabled by configuration');
    redisEnabled = false;
    return null;
  }
  
  if (!redisClient) {
    // Use localhost for development, redis for Docker
    const redisHost = process.env.NODE_ENV === 'production' 
      ? (process.env.REDIS_HOST || 'redis')
      : (process.env.REDIS_HOST || 'localhost');
    
    const redisConfig = {
      host: redisHost,
      port: parseInt(process.env.REDIS_PORT) || 6379,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis reconnecting attempt ${times} in ${delay}ms...`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    };

    // Add password if provided
    if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD !== 'your_secure_redis_password_here') {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }

    try {
      redisClient = new Redis(redisConfig);
      
      let connectionAttempts = 0;
      const maxAttempts = 3;

      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
        redisEnabled = true;
      });

      redisClient.on('error', (err) => {
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
          if (connectionAttempts < maxAttempts) {
            connectionAttempts++;
            console.log(`⚠️ Redis not available (attempt ${connectionAttempts}/${maxAttempts}), will retry...`);
          } else {
            console.log('⚠️ Redis is not available, continuing without caching');
            redisEnabled = false;
          }
        } else {
          console.error('❌ Redis connection error:', err.message);
        }
      });

      redisClient.on('ready', () => {
        console.log('✅ Redis is ready');
        redisEnabled = true;
      });
      
    } catch (error) {
      console.log('⚠️ Failed to initialize Redis, continuing without caching');
      redisEnabled = false;
      redisClient = null;
    }
  }

  return redisClient;
};

const getRedisClient = () => {
  if (!redisEnabled) return null;
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

// Cache middleware (graceful fallback)
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Skip caching in development or if Redis is disabled
    if (process.env.NODE_ENV === 'development' || !redisEnabled) {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    
    try {
      const redis = getRedisClient();
      if (!redis) {
        return next();
      }
      
      const cachedData = await redis.get(key);
      
      if (cachedData) {
        console.log(`Cache hit for: ${key}`);
        return res.status(200).json(JSON.parse(cachedData));
      }
      
      // Store original send function
      const originalSend = res.json;
      res.json = function(data) {
        // Cache successful responses
        if (res.statusCode === 200 && redis) {
          redis.setex(key, duration, JSON.stringify(data));
        }
        originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Clear cache helper
const clearCache = async (pattern) => {
  if (!redisEnabled) return 0;
  
  try {
    const redis = getRedisClient();
    if (!redis) return 0;
    
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Cleared ${keys.length} cache entries for pattern: ${pattern}`);
    }
    return keys.length;
  } catch (error) {
    console.error('Clear cache error:', error);
    return 0;
  }
};

// Check if Redis is available
const isRedisAvailable = () => {
  return redisEnabled && redisClient && redisClient.status === 'ready';
};

module.exports = {
  initRedis,
  getRedisClient,
  cacheMiddleware,
  clearCache,
  isRedisAvailable,
};