import { getRedisClient } from '../utils/redis';
import logger from '../utils/logger';

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  nextWindowAt: Date;
}

export class RateLimitService {
  private getHourKey(senderId: string): string {
    const now = new Date();
    const hour = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      String(now.getUTCDate()).padStart(2, '0'),
      String(now.getUTCHours()).padStart(2, '0'),
    ].join('');
    return `ratelimit:sender:${senderId}:hour:${hour}`;
  }

  private getNextWindowAt(): Date {
    const next = new Date();
    next.setUTCMinutes(0, 0, 0);
    next.setUTCHours(next.getUTCHours() + 1);
    return next;
  }

  /**
   * Atomically increment counter and check against limit.
   * Uses a Lua script so the INCR + EXPIRE is atomic.
   * If over limit, we decrement and return not allowed.
   */
  async checkAndIncrement(senderId: string, limit: number): Promise<RateLimitResult> {
    const redis = getRedisClient();
    const key = this.getHourKey(senderId);

    // Atomic increment + set expiry on first use
    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], 3600)
      end
      return current
    `;

    const current = (await redis.eval(luaScript, 1, key)) as number;
    const nextWindowAt = this.getNextWindowAt();

    if (current > limit) {
      // Over limit — undo the increment so count stays accurate
      await redis.decr(key);
      logger.warn({ senderId, current: current - 1, limit }, 'Rate limit reached');
      return { allowed: false, currentCount: current - 1, limit, nextWindowAt };
    }

    return { allowed: true, currentCount: current, limit, nextWindowAt };
  }

  async getCurrentCount(senderId: string): Promise<number> {
    const val = await getRedisClient().get(this.getHourKey(senderId));
    return val ? parseInt(val, 10) : 0;
  }

  async isSlackNotified(senderId: string): Promise<boolean> {
    const now = new Date();
    const hour = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      String(now.getUTCDate()).padStart(2, '0'),
      String(now.getUTCHours()).padStart(2, '0'),
    ].join('');
    const key = `slack:ratelimit-notified:${senderId}:${hour}`;
    const val = await getRedisClient().get(key);
    return val === '1';
  }

  async markSlackNotified(senderId: string): Promise<void> {
    const now = new Date();
    const hour = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      String(now.getUTCDate()).padStart(2, '0'),
      String(now.getUTCHours()).padStart(2, '0'),
    ].join('');
    const key = `slack:ratelimit-notified:${senderId}:${hour}`;
    await getRedisClient().set(key, '1', 'EX', 3600);
  }
}

export const rateLimitService = new RateLimitService();
