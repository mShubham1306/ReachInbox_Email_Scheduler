import { Request } from 'express';
import { User } from '@prisma/client';

// Augment Express session and user types
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
      googleId: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface JobData {
  emailId: string;
  campaignId: string;
  senderId: string;
  attempt?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface HealthStatus {
  api: 'ok' | 'error';
  database: 'ok' | 'error';
  redis: 'ok' | 'error';
  elasticsearch: 'ok' | 'error';
  timestamp: string;
}

export interface ScheduleEmailsBody {
  senderId: string;
  subject: string;
  body: string;
  recipients?: string[];
  startTime: string;
  delayMs?: number;
  hourlyLimit?: number;
}

export interface ParsedEmailsResponse {
  valid: string[];
  invalid: string[];
  duplicatesRemoved: number;
  total: number;
}
