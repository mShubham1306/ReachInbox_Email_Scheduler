import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { PrismaClient } from '@prisma/client';

import config from './config';
import logger from './utils/logger';
import { getRedisClient } from './utils/redis';
import { emailQueue } from './queues/emailQueue';
import { pingElasticsearch } from './integrations/elasticsearch/client';

import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import campaignRoutes from './routes/campaignRoutes';
import slackRoutes from './routes/slackRoutes';
import { basicAuth } from './middleware/basicAuth';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Bull Board dashboard to load styles/scripts
  })
);

// CORS configuration for frontend
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        config.frontendUrl,
        'http://localhost:5173',
        'http://localhost:3000',
      ];

      // Allow any vercel preview / production domain
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for credentials handshake
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Trust the first proxy (required for Render / Heroku-style deployments)
// so that req.secure is correct and session cookies with secure:true work.
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration — dev: lax/http, prod: none/https (cross-domain Vercel↔Render)
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: config.isProduction, // Only trust proxy in production (Render)
    cookie: {
      secure: config.isProduction,  // HTTPS only in prod; allows HTTP in local dev
      sameSite: config.isProduction ? 'none' : 'lax', // cross-site in prod, lax locally
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Bull Board UI for live BullMQ queue inspection
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue) as any],
  serverAdapter,
});

// Protect Bull Board with Basic Auth
app.use(
  '/admin/queues',
  basicAuth(config.bullBoard.user, config.bullBoard.password),
  serverAdapter.getRouter()
);

// Health check endpoint
app.get('/health', async (_req, expressRes) => {
  let dbStatus: 'ok' | 'error' = 'error';
  let redisStatus: 'ok' | 'error' = 'error';
  let esStatus: 'ok' | 'error' = 'error';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'ok';
  } catch (err) {
    logger.warn({ err }, 'DB health check failed');
  }

  try {
    const pong = await getRedisClient().ping();
    if (pong === 'PONG') redisStatus = 'ok';
  } catch (err) {
    logger.warn({ err }, 'Redis health check failed');
  }

  try {
    const esOk = await pingElasticsearch();
    if (esOk) esStatus = 'ok';
  } catch (err) {
    logger.warn({ err }, 'Elasticsearch health check failed');
  }

  const allHealthy = dbStatus === 'ok' && redisStatus === 'ok';

  return expressRes.status(allHealthy ? 200 : 503).json({
    api: 'ok',
    database: dbStatus,
    redis: redisStatus,
    elasticsearch: esStatus,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth/slack', slackRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api', campaignRoutes);
app.use('/api/slack', slackRoutes);

// Error Handling
app.use(errorHandler);

export default app;
