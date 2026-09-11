import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock infra modules before app is loaded
vi.mock('../../src/utils/redis', () => ({
  getRedisClient: () => ({
    ping: vi.fn().mockResolvedValue('PONG'),
    on: vi.fn(),
    quit: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  }),
  createRedisClient: () => ({
    ping: vi.fn().mockResolvedValue('PONG'),
    on: vi.fn(),
    quit: vi.fn(),
  }),
  closeRedisClient: vi.fn(),
}));

vi.mock('../../src/integrations/elasticsearch/client', () => ({
  getElasticsearchClient: () => ({ ping: vi.fn().mockResolvedValue(true) }),
  pingElasticsearch: vi.fn().mockResolvedValue(true),
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn(() => ({
    add: vi.fn().mockResolvedValue({ id: 'mock-bull-job-id' }),
    on: vi.fn(),
    close: vi.fn(),
  })),
  QueueEvents: vi.fn(() => ({ on: vi.fn(), close: vi.fn() })),
  Worker: vi.fn(() => ({ on: vi.fn(), close: vi.fn() })),
}));

describe('Email Scheduling Authentication & Authorization', () => {
  let request: any;
  let app: any;

  beforeAll(async () => {
    const supertest = await import('supertest');
    const appModule = await import('../../src/app');
    request = supertest.default;
    app = appModule.default;
  });

  it('POST /api/emails/schedule should reject unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/emails/schedule')
      .send({
        senderId: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'Test Subject',
        body: 'Test Body',
        recipients: ['test@example.com'],
        startTime: new Date().toISOString(),
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toMatch(/Authentication required/i);
  });

  it('GET /api/emails/scheduled should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/emails/scheduled');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
