// Shared TypeScript types for frontend

export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RATE_LIMITED';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  senders: Sender[];
  slackConnection: { connected: boolean; teamName: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sender {
  id: string;
  userId: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  hourlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  userId: string;
  senderId: string;
  subject: string;
  body: string;
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
  status: CampaignStatus;
  _count?: { emails: number };
  sender?: { email: string };
  createdAt: string;
  updatedAt: string;
}

export interface Email {
  id: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  attempts: number;
  bullJobId: string | null;
  idempotencyKey: string;
  errorMessage: string | null;
  campaign?: { subject: string; id: string };
  sender?: { email: string };
  createdAt: string;
  updatedAt: string;
}

export interface ParsedLeads {
  valid: string[];
  invalid: string[];
  duplicatesRemoved: number;
  total: number;
}

export interface ScheduleEmailsPayload {
  senderId: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
}

export interface ScheduleResult {
  campaignId: string;
  totalEmails: number;
  scheduledEmails: number;
  firstScheduledAt: string;
  lastScheduledAt: string;
}

export interface PaginatedResult<T> {
  success: boolean;
  emails: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthStatus {
  api: string;
  database: string;
  redis: string;
  elasticsearch: string;
  timestamp: string;
}
