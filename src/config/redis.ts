import Redis from 'ioredis';
import { config } from './env';
import logger from '../utils/logger';

// Create Redis mock for development and testing
const createRedisMock = () => {
  const store = new Map<string, string>();
  return {
    ping: async () => 'PONG',
    get: async (key: string) => store.get(key) || null,
    set: async (key: string, value: any, mode?: string, duration?: number) => {
      store.set(key, JSON.stringify(value));
      if (duration) {
        setTimeout(() => store.delete(key), duration * 1000);
      }
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    expire: async (key: string, seconds: number) => {
      if (store.has(key)) {
        setTimeout(() => store.delete(key), seconds * 1000);
        return 1;
      }
      return 0;
    },
    disconnect: () => {},
    on: (event: string, callback: () => void) => {}
  };
};

// Initialize Redis client
let redis: Redis | ReturnType<typeof createRedisMock>;

try {
  if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test' || config.REDIS_MOCK) {
    logger.info('Using Redis mock');
    redis = createRedisMock();
  } else {
    redis = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (error) => {
      logger.error('Redis error:', error);
      if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test' || config.REDIS_MOCK) {
        logger.warn('Falling back to Redis mock');
        redis = createRedisMock();
      }
    });
  }
} catch (error) {
  logger.error('Redis initialization error:', error);
  if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test' || config.REDIS_MOCK) {
    logger.warn('Using Redis mock due to initialization error');
    redis = createRedisMock();
  } else {
    throw error;
  }
}

export default redis; 