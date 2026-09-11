import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function optionalInt(key: string, defaultValue: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : defaultValue;
}

const config = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: optionalInt('PORT', 5000),
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173').replace(/\/+$/, ''),

  databaseUrl: required('DATABASE_URL'),
  redisUrl: optional('REDIS_URL', 'redis://localhost:6379'),
  elasticsearchUrl: optional('ELASTICSEARCH_URL', 'http://localhost:9200'),

  sessionSecret: optional('SESSION_SECRET', 'dev-secret-change-in-production'),

  google: {
    clientId: optional('GOOGLE_CLIENT_ID', ''),
    clientSecret: optional('GOOGLE_CLIENT_SECRET', ''),
    callbackUrl: optional('GOOGLE_CALLBACK_URL', 'http://localhost:5000/auth/google/callback'),
  },

  slack: {
    clientId: optional('SLACK_CLIENT_ID', ''),
    clientSecret: optional('SLACK_CLIENT_SECRET', ''),
    redirectUri: optional('SLACK_REDIRECT_URI', 'http://localhost:5000/auth/slack/callback'),
  },

  ethereal: {
    host: optional('ETHEREAL_HOST', 'smtp.ethereal.email'),
    port: optionalInt('ETHEREAL_PORT', 587),
    user: optional('ETHEREAL_USER', ''),
    password: optional('ETHEREAL_PASSWORD', ''),
  },

  worker: {
    concurrency: optionalInt('WORKER_CONCURRENCY', 5),
    minEmailDelayMs: optionalInt('MIN_EMAIL_DELAY_MS', 2000),
    defaultHourlyLimit: optionalInt('DEFAULT_HOURLY_LIMIT', 100),
  },

  bullBoard: {
    user: optional('BULL_BOARD_USER', 'admin'),
    password: optional('BULL_BOARD_PASSWORD', 'admin123'),
  },

  isDevelopment: optional('NODE_ENV', 'development') === 'development',
  isProduction: optional('NODE_ENV', 'development') === 'production',
};

export default config;
