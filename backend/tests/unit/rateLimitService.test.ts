import { describe, it, expect, vi } from 'vitest';
import { RateLimitService } from '../../src/services/RateLimitService';

describe('RateLimitService Logic', () => {
  it('should format hour key consistently', () => {
    const service = new RateLimitService();
    const key = (service as any).getHourKey('sender-123');
    expect(key).toMatch(/^ratelimit:sender:sender-123:hour:\d{10}$/);
  });

  it('should calculate next window timestamp at the top of the next hour', () => {
    const service = new RateLimitService();
    const nextWindow = (service as any).getNextWindowAt();
    expect(nextWindow.getUTCMinutes()).toBe(0);
    expect(nextWindow.getUTCSeconds()).toBe(0);
    expect(nextWindow.getTime()).toBeGreaterThan(Date.now());
  });
});
