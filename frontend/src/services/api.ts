import axios from 'axios';
import type {
  User,
  Sender,
  Campaign,
  Email,
  ParsedLeads,
  ScheduleEmailsPayload,
  ScheduleResult,
  PaginatedResult,
  ApiResponse,
  HealthStatus,
} from '../types';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = rawApiUrl ? `${rawApiUrl}/api` : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  me: async (): Promise<User | null> => {
    try {
      const res = await api.get<ApiResponse<User>>('/auth/me');
      return res.data.data ?? null;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        return null;
      }
      return null;
    }
  },
  logout: () => api.post('/auth/logout'),
  devLogin: (email?: string, name?: string) =>
    api.post<ApiResponse<User>>('/auth/dev-login', { email, name }).then((r) => r.data.data!),
  getGoogleStatus: () =>
    api.get<{ success: boolean; isConfigured: boolean; clientId: string | null; callbackUrl: string }>('/auth/google/status').then((r) => r.data),
  configureGoogle: (clientId: string, clientSecret: string) =>
    api.post<{ success: boolean; message: string; authUrl: string }>('/auth/google/configure', { clientId, clientSecret }).then((r) => r.data),
};

// ─── Emails ──────────────────────────────────────────────────────────────────
export const emailApi = {
  schedule: (payload: ScheduleEmailsPayload) =>
    api.post<ApiResponse<ScheduleResult>>('/emails/schedule', payload).then((r) => r.data.data!),

  sendTest: (payload: {
    to: string;
    subject?: string;
    body?: string;
    fromEmail?: string;
    smtpPassword?: string;
    smtpHost?: string;
    smtpPort?: number;
  }) =>
    api.post<{ success: boolean; message: string; messageId: string; previewUrl?: string }>('/emails/send-test', payload).then((r) => r.data),

  getScheduled: (page = 1, limit = 20) =>
    api
      .get<PaginatedResult<Email>>('/emails/scheduled', { params: { page, limit } })
      .then((r) => r.data),

  getSent: (page = 1, limit = 20) =>
    api
      .get<PaginatedResult<Email>>('/emails/sent', { params: { page, limit } })
      .then((r) => r.data),

  search: (q: string, status?: string) =>
    api
      .get<ApiResponse<Email[]>>('/emails/search', { params: { q, status } })
      .then((r) => r.data.data ?? []),

  parseLeads: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<ApiResponse<ParsedLeads>>('/emails/parse-leads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data!);
  },
};

// ─── Campaigns & Senders ─────────────────────────────────────────────────────
export const campaignApi = {
  getAll: () => api.get<ApiResponse<Campaign[]>>('/campaigns').then((r) => r.data.data ?? []),
  getById: (id: string) =>
    api.get<ApiResponse<Campaign>>(`/campaigns/${id}`).then((r) => r.data.data!),
};

export const senderApi = {
  getAll: () => api.get<ApiResponse<Sender[]>>('/senders').then((r) => r.data.data ?? []),
  create: (data: {
    email: string;
    smtpUser: string;
    smtpPassword: string;
    smtpHost?: string;
    smtpPort?: number;
    hourlyLimit?: number;
  }) => api.post<ApiResponse<Sender>>('/senders', data).then((r) => r.data.data!),
};

// ─── Slack ───────────────────────────────────────────────────────────────────
export const slackApi = {
  getStatus: () =>
    api
      .get<ApiResponse<{ connected: boolean; teamName?: string }>>('/slack/status')
      .then((r) => r.data.data!),
  disconnect: () => api.post('/slack/disconnect'),
  // Connect initiates a redirect — done via window.location, not Axios
  getConnectUrl: () => '/auth/slack/connect',
};

// ─── Health ──────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => {
    const healthBase = import.meta.env.VITE_API_URL ?? '';
    return api.get<HealthStatus>(`${healthBase}/health`, { baseURL: '' }).then((r) => r.data);
  },
};

export default api;
