const { getRedisClient } = require('../config/redis');

class CacheService {
  constructor() {
    this.redis = getRedisClient();
    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 300;
  }

  async get(key) {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  async flushAll() {
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Cache user data
  async cacheUser(userId, userData) {
    return this.set(`user:${userId}`, userData, 600); // 10 minutes
  }

  async getUser(userId) {
    return this.get(`user:${userId}`);
  }

  async clearUserCache(userId) {
    return this.del(`user:${userId}`);
  }

  // Cache donation stats
  async cacheDonationStats(stats) {
    return this.set('donation:stats', stats, 300); // 5 minutes
  }

  async getDonationStats() {
    return this.get('donation:stats');
  }

  async clearDonationStatsCache() {
    return this.del('donation:stats');
  }

  // Cache events
  async cacheEvents(events) {
    return this.set('events:upcoming', events, 600); // 10 minutes
  }

  async getEvents() {
    return this.get('events:upcoming');
  }

  async clearEventsCache() {
    return this.del('events:upcoming');
  }

  // Rate limiting with Redis
  async rateLimit(key, limit, windowSeconds) {
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, windowSeconds);
      }
      return current <= limit;
    } catch (error) {
      console.error('Rate limit error:', error);
      return true; // Allow on error
    }
  }

  async getRateLimitRemaining(key, limit) {
    try {
      const current = await this.redis.get(key);
      const used = parseInt(current) || 0;
      return Math.max(0, limit - used);
    } catch (error) {
      console.error('Get rate limit error:', error);
      return limit;
    }
  }
}

module.exports = new CacheService();