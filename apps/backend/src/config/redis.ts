import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: RedisClientType | null = null;
let connecting = false;

export const getRedisClient = async (): Promise<RedisClientType> => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (connecting) {
    // Wait for connection to finish
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }
  }

  connecting = true;

  redisClient = createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          logger.error('Redis connection failed after 3 retries');
          return false;
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis ready');
  });

  try {
    await redisClient.connect();
    connecting = false;
    return redisClient;
  } catch (err: any) {
    logger.warn('Failed to connect to Redis - some features may be limited:', err.message);
    connecting = false;
    throw err;
  }
};

// Lazy-initialized client for synchronous access (may not be connected)
export const redis = {
  get: async (...args: Parameters<RedisClientType['get']>) => {
    const client = await getRedisClient();
    return client.get(...args);
  },
  set: async (...args: Parameters<RedisClientType['set']>) => {
    const client = await getRedisClient();
    return client.set(...args);
  },
  setEx: async (...args: Parameters<RedisClientType['setEx']>) => {
    const client = await getRedisClient();
    return client.setEx(...args);
  },
  del: async (...args: Parameters<RedisClientType['del']>) => {
    const client = await getRedisClient();
    return client.del(...args);
  },
};

export default redis;
