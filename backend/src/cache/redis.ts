import { createClient } from 'redis';
import { logger } from '../utils/logger';

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
}

export class CacheService {
  private static readonly YIELD_CACHE_TTL = 30; // 30 seconds

  static async setYieldData(assetSymbol: string, data: any): Promise<void> {
    const key = `yield:${assetSymbol}`;
    await redisClient.setEx(key, this.YIELD_CACHE_TTL, JSON.stringify(data));
  }

  static async getYieldData(assetSymbol: string): Promise<any | null> {
    const key = `yield:${assetSymbol}`;
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  static async invalidateYieldCache(assetSymbol?: string): Promise<void> {
    if (assetSymbol) {
      await redisClient.del(`yield:${assetSymbol}`);
    } else {
      const keys = await redisClient.keys('yield:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  }
}