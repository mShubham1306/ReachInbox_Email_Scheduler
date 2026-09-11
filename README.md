# ReachInbox Email Scheduler

A **production-grade, distributed email scheduling platform** built as a full-stack TypeScript monorepo. Demonstrates persistent BullMQ delayed jobs, distributed Redis-backed rate limiting, application-level idempotency, Elasticsearch search, real Google + Slack OAuth, and a polished React dashboard.

---

## 🏗 Architecture

```
React + Tailwind (Vite :5173)
        │ REST API + Cookie session
        ▼
Express.js API (:5000)
        │
   ┌────┴─────┐
   ▼          ▼
PostgreSQL   Redis
(Prisma)     (BullMQ)
               │
         BullMQ Worker (separate process)
               │
        ┌──────┼──────────┐
        ▼      ▼          ▼
  Rate Limit  Throttle  Idempotency
        │
        ▼
  Ethereal SMTP
        │
        ▼
  Elasticsearch  ─── Search API
        │
        ▼
  Slack OAuth ─── Rate-limit alerts
```

---

## ✨ Features

| Feature | Status |
|---|---|
| BullMQ delayed scheduling (no cron!) | ✅ |
| Redis-persisted jobs — survive restart | ✅ |
| Distributed rate limiting (Lua atomic) | ✅ |
| Rescheduling when rate-limited | ✅ |
| Minimum delay between sends (Redis throttle) | ✅ |
| Worker concurrency (configurable) | ✅ |
| DB-level idempotency (`FOR UPDATE NOWAIT`) | ✅ |
| Ethereal SMTP sending | ✅ |
| Elasticsearch indexing + full-text search | ✅ |
| Bull Board queue dashboard | ✅ |
| Real Google OAuth | ✅ |
| Real Slack OAuth + rate-limit notifications | ✅ |
| CSV/TXT lead upload + parsing | ✅ |
| React + Tailwind dashboard | ✅ |

---

## 🛠 Tech Stack

**Backend:** Node.js · TypeScript · Express.js · PostgreSQL · Prisma ORM · Redis · BullMQ · Nodemailer · Elasticsearch · Passport.js · Slack Web API · Zod · Multer · csv-parse · pino

**Frontend:** React · Vite · TypeScript · Tailwind CSS · React Router · TanStack Query · Axios · lucide-react · react-hot-toast

**Infrastructure:** Docker Compose · PostgreSQL 16 · Redis 7 · Elasticsearch 8

---

## 📁 Repository Structure

```
reachinbox-email-scheduler/
├── backend/
│   ├── src/
│   │   ├── config/         # Typed env config
│   │   ├── controllers/    # Thin HTTP handlers
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic
│   │   │   ├── CampaignService.ts
│   │   │   ├── EmailSchedulingService.ts
│   │   │   ├── RateLimitService.ts      ← Lua atomic Redis
│   │   │   ├── ThrottleService.ts       ← Slot-based Redis throttle
│   │   │   ├── IdempotencyService.ts    ← FOR UPDATE NOWAIT
│   │   │   ├── SMTPService.ts
│   │   │   ├── SearchIndexService.ts
│   │   │   └── NotificationService.ts
│   │   ├── queues/         # BullMQ queue definition
│   │   ├── workers/        # Worker entrypoint + processor
│   │   ├── middleware/     # Auth, validation, error, basicAuth
│   │   ├── integrations/   # ES, Slack, SMTP clients
│   │   └── utils/          # Logger, Redis, CSV parser
│   ├── prisma/schema.prisma
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/          # Login, Dashboard
│       ├── features/       # ComposeModal, EmailTabs, SlackConnect
│       ├── components/     # Button, Input, Modal, Badge, etc.
│       ├── hooks/          # useAuth, useEmails
│       └── services/api.ts # Typed Axios layer
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 20+
- Docker Desktop (for Postgres, Redis, Elasticsearch)

### 2. Clone and install

```bash
git clone <repo>
cd reachinbox-email-scheduler

# Install all workspaces
npm install
```

### 3. Configure environment

```bash
# Copy root .env.example and fill in values
cp .env.example backend/.env
```

**Required** for basic operation (everything else has defaults):
```
DATABASE_URL=postgresql://reachinbox:reachinbox_secret@localhost:5432/reachinbox
REDIS_URL=redis://localhost:6379
SESSION_SECRET=any-long-random-string
```

### 4. Start infrastructure

```bash
docker compose up -d
# Starts PostgreSQL, Redis, Elasticsearch
# Wait ~30 seconds for Elasticsearch to be ready
```

### 5. Set up database

```bash
cd backend
npm run generate   # generates Prisma client
npm run migrate    # creates tables
```

### 6. Generate Ethereal SMTP credentials

```bash
npm run setup:ethereal
# Copy the output to your backend/.env:
# ETHEREAL_HOST=smtp.ethereal.email
# ETHEREAL_PORT=587
# ETHEREAL_USER=...
# ETHEREAL_PASSWORD=...
```

### 7. Run the application

**Terminal 1 — API server:**
```bash
cd backend
npm run dev
# → http://localhost:5000
```

**Terminal 2 — BullMQ worker:**
```bash
cd backend
npm run worker
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials (Web application)
3. Set Authorized redirect URI: `http://localhost:5000/auth/google/callback`
4. Add to `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

> **Development shortcut:** Without Google credentials, use the **"Quick Dev Login"** button on the login page — no OAuth needed.

---

## 💬 Slack OAuth Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create App
2. Under **OAuth & Permissions**, add Bot Token Scopes: `chat:write`, `channels:read`
3. Add Redirect URL: `http://localhost:5000/auth/slack/callback`
4. Add to `backend/.env`:
   ```
   SLACK_CLIENT_ID=your-client-id
   SLACK_CLIENT_SECRET=your-client-secret
   ```

---

## 🐂 Bull Board Queue Dashboard

Visit **http://localhost:5000/admin/queues**

Login: `admin` / `admin123` (configurable via `BULL_BOARD_USER` / `BULL_BOARD_PASSWORD`)

Shows live queue stats:
- Waiting, Active, Completed, Failed, Delayed jobs

---

## ⚙️ How It Works

### Scheduling (No cron!)
```
POST /api/emails/schedule
  → Create Campaign in PostgreSQL
  → Create Email records with staggered scheduledAt times
  → For each email: addEmailJob(emailId, scheduledAt)
  → BullMQ stores delayed job in Redis
  → At scheduled time, BullMQ worker picks it up
```

### Restart Persistence
```
Schedule email for future
  → Stop worker/API
  → Restart worker/API
  → Worker reconnects to Redis
  → BullMQ continues processing at correct time
  → No jobs recreated — Redis holds them
```

### Idempotency (DB state machine)
```
SCHEDULED → PROCESSING (worker claims via FOR UPDATE NOWAIT)
PROCESSING → SENT (after successful SMTP)
PROCESSING → RATE_LIMITED (if hourly limit hit)
RATE_LIMITED → SCHEDULED (rescheduled to next hour)
PROCESSING → FAILED (after all retries exhausted)

Two concurrent workers trying to process the same email:
  Worker A: acquires FOR UPDATE lock → transitions to PROCESSING → sends
  Worker B: NOWAIT raises error → detects lock → skips (no duplicate send)
```

### Distributed Rate Limiting
```
Redis key: ratelimit:sender:{senderId}:hour:{YYYYMMDDHH}
  → Lua atomic INCR + EXPIRE on first use
  → If counter > limit: decrement, return not allowed
  → Worker reschedules email to nextWindowAt (top of next hour)
  → Sends Slack notification (once per sender per hour)
```

### Distributed Throttle (min delay)
```
Redis key: throttle:sender:{senderId}:next_send_at
  → Lua atomic slot acquisition
  → If slot is past → use now, set next = now + minDelay
  → If slot is future → use future, set next += minDelay
  → Worker waits until claimed slot time
  → Safe across all workers simultaneously
```

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Unit tests: CSV parser, rate limit key calculation  
Integration tests: `/health` endpoint

---

## 📊 1000-Email Behavior

When 1000 emails are scheduled simultaneously:
- All 1000 jobs are stored in Redis (BullMQ handles the load)
- Workers process with configured concurrency (default: 5)
- Rate limiter caps sends at `hourlyLimit` per sender
- Throttle ensures `minEmailDelayMs` between sends
- Excess emails are automatically rescheduled to next hour window
- No memory explosion — BullMQ streams jobs from Redis as workers are available

---

## 🔒 Security Notes

- Sessions stored server-side (express-session) — never expose session secret
- Bull Board protected by HTTP Basic Auth
- Google OAuth state parameter prevents CSRF
- `helmet` sets security headers
- CORS restricted to `FRONTEND_URL` only
- No secrets logged (pino filters by structure)
- All `/api/*` routes require authentication

---

## 🚨 Known Limitations / Trade-offs

1. **SMTP exactly-once**: Ethereal (like all SMTP) doesn't provide exactly-once delivery guarantees at the transport level. The system prevents duplicate sends at the application level via `FOR UPDATE NOWAIT` + status state machine. A crash between SMTP success and the DB `markSent()` call could theoretically cause a retry — mitigated by BullMQ retry delay + the `SENT` check on re-entry.

2. **Elasticsearch eventual consistency**: ES is not the source of truth. PostgreSQL holds authoritative state. ES indexing is best-effort and fails gracefully.

3. **Slot-based throttle vs. exact timing**: The Redis throttle guarantees minimum spacing globally but doesn't guarantee exact send times — only that no two sends from the same sender happen within `MIN_EMAIL_DELAY_MS`.

4. **Single Redis instance**: For true HA, replace ioredis with Redis Sentinel or Redis Cluster. BullMQ supports both.
