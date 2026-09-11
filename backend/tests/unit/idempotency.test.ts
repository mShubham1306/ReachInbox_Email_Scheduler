import { describe, it, expect, vi } from 'vitest';
import { IdempotencyService } from '../../src/services/IdempotencyService';

describe('IdempotencyService Unit Tests', () => {
  it('should correctly instantiate service', () => {
    const service = new IdempotencyService();
    expect(service).toBeDefined();
    expect(typeof service.claimForProcessing).toBe('function');
    expect(typeof service.markSent).toBe('function');
    expect(typeof service.markFailed).toBe('function');
    expect(typeof service.markRateLimited).toBe('function');
    expect(typeof service.markScheduled).toBe('function');
  });
});
