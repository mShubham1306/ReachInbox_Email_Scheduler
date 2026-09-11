import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock all infra connections BEFORE app is imported
vi.mock('../../src/utils/redis', () => ({
  getRedisClient: () => ({
    ping: vi.fn().mockResolvedValue('PONG'),
    on: vi.fn(),
    quit: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    decr: vi.fn(),
    eval: vi.fn(),
  }),
  createRedisClient: () => ({
    ping: vi.fn().mockResolvedValue('PONG'),
    on: vi.fn(),
    quit: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  }),
  closeRedisClient: vi.fn(),
}));

vi.mock('../../src/integrations/elasticsearch/client', () => ({
  getElasticsearchClient: () => ({ ping: vi.fn().mockResolvedValue(true) }),
  pingElasticsearch: vi.fn().mockResolvedValue(true),
}));

vi.mock('@prisma/client', () => {
  const prisma = {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    user: { findUnique: vi.fn() },
    slackConnection: { findFirst: vi.fn() },
    campaign: { findUnique: vi.fn() },
    sender: { findUnique: vi.fn() },
    email: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  };
  return { PrismaClient: vi.fn(() => prisma), EmailStatus: {}, CampaignStatus: {} };
});

vi.mock('bullmq', () => ({
  Queue: vi.fn(() => ({
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    on: vi.fn(),
    close: vi.fn(),
  })),
  QueueEvents: vi.fn(() => ({ on: vi.fn(), close: vi.fn() })),
  Worker: vi.fn(() => ({ on: vi.fn(), close: vi.fn() })),
}));

describe('GET /health', () => {
  let request: any;
  let app: any;

  beforeAll(async () => {
    const supertest = await import('supertest');
    const appModule = await import('../../src/app');
    request = supertest.default;
    app = appModule.default;
  });

  it('should return structured health payload', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('api', 'ok');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('redis');
    expect(res.body).toHaveProperty('elasticsearch');
    expect(res.body).toHaveProperty('timestamp');
  });
});
