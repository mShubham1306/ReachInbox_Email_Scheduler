import { getRedisClient } from '../utils/redis';
import config from '../config';
import logger from '../utils/logger';

export class ThrottleService {
  private minDelayMs: number;

  constructor() {
    this.minDelayMs = config.worker.minEmailDelayMs;
  }

  /**
   * Atomically claim the next available send slot for a sender.
   *
   * Algorithm (Lua script — atomic):
   *  - Read current next_send_at for sender
   *  - If empty or in the past → slot is NOW, set next_send_at = now + delay
   *  - If in the future → slot is that future time, set next_send_at += delay
   *  - Return the claimed slot timestamp (ms)
   *
   * This guarantees MIN_EMAIL_DELAY_MS between sends globally across all workers.
   */
  async acquireSendSlot(senderId: string): Promise<number> {
    const redis = getRedisClient();
    const key = `throttle:sender:${senderId}:next_send_at`;
    const now = Date.now();
    const delay = this.minDelayMs;

    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local delay = tonumber(ARGV[2])
      local current = tonumber(redis.call('GET', key))
      local slot
      if current == nil or current <= now then
        slot = now
      else
        slot = current
      end
      local new_next = slot + delay
      -- TTL of 10 minutes is more than enough
      redis.call('SET', key, tostring(new_next), 'PX', 600000)
      return tostring(slot)
    `;

    const result = (await redis.eval(luaScript, 1, key, now.toString(), delay.toString())) as string;
    const allowedAt = parseInt(result, 10);

    logger.debug(
      { senderId, allowedAt, now, willWait: allowedAt > now, waitMs: Math.max(0, allowedAt - now) },
      'Throttle slot acquired',
    );

    return allowedAt;
  }

  async waitForSlot(allowedAt: number): Promise<void> {
    const waitMs = allowedAt - Date.now();
    if (waitMs > 0) {
      logger.debug({ waitMs }, 'Throttle: waiting for slot');
      await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

export const throttleService = new ThrottleService();
