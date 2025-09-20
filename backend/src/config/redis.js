const { createClient } = require('redis');

let redisClient;

/**
 * Redis connection configuration
 * @returns {Promise<void>}
 */
const connectRedis = async () => {
  try {
    const redisURL = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisURL,
      password: process.env.REDIS_PASSWORD,
      socket: {
        connectTimeout: 5000,
      },
    });

    // Handle Redis events
    redisClient.on('connect', () => {
      console.log('📡 Redis connection established');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis client ready');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    redisClient.on('end', () => {
      console.log('📴 Redis connection closed');
    });

    // Connect to Redis
    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    console.log('✅ Redis Connected Successfully');

  } catch (error) {
    console.error('❌ Error connecting to Redis:', error);
    
    // Log connection details (without credentials) for debugging
    const redisURL = process.env.REDIS_URL || 'redis://localhost:6379';
    const sanitizedURL = redisURL.replace(/\/\/([^:]+):([^@]+)@/, '//<credentials>@');
    console.error(`🔗 Attempted connection to: ${sanitizedURL}`);
    
    // Don't exit process for Redis connection failure in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

/**
 * Get Redis client instance
 * @returns {Object} Redis client
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

/**
 * Close Redis connection
 * @returns {Promise<void>}
 */
const closeRedisConnection = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      console.log('📴 Redis connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
    throw error;
  }
};

/**
 * Check Redis connection status
 * @returns {Promise<Object>} Redis status information
 */
const getRedisStatus = async () => {
  try {
    if (!redisClient) {
      return { status: 'disconnected', message: 'Redis client not initialized' };
    }

    const isReady = redisClient.isReady;
    const isOpen = redisClient.isOpen;

    if (isReady && isOpen) {
      const ping = await redisClient.ping();
      return { 
        status: 'connected', 
        ready: isReady, 
        open: isOpen, 
        ping,
        message: 'Redis is connected and ready'
      };
    } else {
      return { 
        status: 'disconnected', 
        ready: isReady, 
        open: isOpen,
        message: 'Redis is not ready or connection is closed'
      };
    }
  } catch (error) {
    return { 
      status: 'error', 
      message: `Redis error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Redis utility functions
 */
class RedisUtils {
  /**
   * Set a key-value pair with optional expiration
   * @param {string} key 
   * @param {string} value 
   * @param {number} [expirationInSeconds] 
   */
  static async set(key, value, expirationInSeconds) {
    try {
      const client = getRedisClient();
      if (expirationInSeconds) {
        await client.setEx(key, expirationInSeconds, value);
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get value by key
   * @param {string} key 
   * @returns {Promise<string|null>}
   */
  static async get(key) {
    try {
      const client = getRedisClient();
      return await client.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a key
   * @param {string} key 
   * @returns {Promise<number>}
   */
  static async del(key) {
    try {
      const client = getRedisClient();
      return await client.del(key);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists
   * @param {string} key 
   * @returns {Promise<boolean>}
   */
  static async exists(key) {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set expiration for a key
   * @param {string} key 
   * @param {number} seconds 
   * @returns {Promise<boolean>}
   */
  static async expire(key, seconds) {
    try {
      const client = getRedisClient();
      const result = await client.expire(key, seconds);
      return Boolean(result);
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Increment a numeric value
   * @param {string} key 
   * @returns {Promise<number>}
   */
  static async incr(key) {
    try {
      const client = getRedisClient();
      return await client.incr(key);
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set JSON object
   * @param {string} key 
   * @param {Object} value 
   * @param {number} [expirationInSeconds] 
   */
  static async setJSON(key, value, expirationInSeconds) {
    try {
      const jsonString = JSON.stringify(value);
      await this.set(key, jsonString, expirationInSeconds);
    } catch (error) {
      console.error(`Redis SET JSON error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get JSON object
   * @param {string} key 
   * @returns {Promise<Object|null>}
   */
  static async getJSON(key) {
    try {
      const jsonString = await this.get(key);
      if (!jsonString) return null;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error(`Redis GET JSON error for key ${key}:`, error);
      throw error;
    }
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedisConnection,
  getRedisStatus,
  RedisUtils
};