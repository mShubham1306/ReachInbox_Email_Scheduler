import Redis from 'ioredis';
import config from '../config';
import logger from './logger';

let redisClient: Redis | null = null;
let lastErrorLoggedAt = 0;

export function createRedisClient(): Redis {
  const client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    enableOfflineQueue: false,  // Fail fast when Redis is down
    lazyConnect: false,
    connectTimeout: 10000,
    retryStrategy(times) {
      return Math.min(times * 1000, 5000);
    },
  });

  client.on('connect', () => {
    logger.info({ url: config.redisUrl }, 'Redis connected');
  });

  client.on('error', (err) => {
    const now = Date.now();
    if (now - lastErrorLoggedAt > 15000) {
      lastErrorLoggedAt = now;
      logger.warn({ message: err.message }, 'Redis connection unavailable; retrying periodically in background');
    }
  });

  client.on('close', () => {
    // Graceful close
  });

  return client;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore disconnect errors
    }
    redisClient = null;
  }
}
