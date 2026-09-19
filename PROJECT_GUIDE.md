# 📧 ReachInbox — Full Project Guide

> **Easy English · No jargon · Everything explained**
> Whether you are a developer reading the code or a non-technical person trying to use the app, this guide covers everything.

---

## Table of Contents

1. [What is ReachInbox?](#1-what-is-reachinbox)
2. [What can you do with it?](#2-what-can-you-do-with-it)
3. [How the app works — Step by step](#3-how-the-app-works--step-by-step)
4. [How to use the app (User Guide)](#4-how-to-use-the-app-user-guide)
5. [Project Folder Structure](#5-project-folder-structure)
6. [Frontend — Every page and component explained](#6-frontend--every-page-and-component-explained)
7. [Backend — Every service explained](#7-backend--every-service-explained)
8. [How emails are sent (The full journey)](#8-how-emails-are-sent-the-full-journey)
9. [Environment Variables](#9-environment-variables)
10. [How to run locally](#10-how-to-run-locally)
11. [Deployment (Vercel + Render)](#11-deployment-vercel--render)
12. [Security features](#12-security-features)
13. [Tech Stack (Simple version)](#13-tech-stack-simple-version)

---

## 1. What is ReachInbox?

**ReachInbox** is an **automated email sending platform.**

Imagine you run a small business and you want to send a personalized "Hello, are you interested?" email to 500 potential customers. Doing that manually would take hours. ReachInbox does it for you — automatically, at the right time, without sending too many at once.

**In one line:**
> Upload a list of email addresses → Write your email → Choose when to send → ReachInbox sends them automatically, one by one, at the pace you set.

---

## 2. What can you do with it?

| Feature | What it means |
|---|---|
| 📤 Upload contacts | Upload a `.csv` or `.txt` file with email addresses |
| ✍️ Write email | Type your subject line and email body |
| 🕐 Schedule sending | Send right now, or pick a future date and time |
| ⏱️ Control the pace | Choose how many emails to send per hour |
| 📬 Real inbox delivery | Emails land in the recipient's actual Gmail/Outlook inbox |
| 📋 Track sent emails | See a list of all emails that were sent |
| 🔍 Search emails | Find any sent email by recipient address or subject |
| 🔔 Slack notifications | Get a Slack message if the hourly sending limit is hit |
| 🔐 Google login | Sign in with your Google account — no password needed |
| 🔒 Secure | Your SMTP password is encrypted and stored safely |

---

## 3. How the app works — Step by step

Here is the full journey of one email, explained simply:

```
You fill the form → App saves the email to database → App puts it in a queue
→ At the right time, a background worker picks it up
→ Worker checks: "Is it okay to send now? Am I under the hourly limit?"
→ If YES → sends the email via SMTP → marks it as "Delivered"
→ If limit reached → waits until next hour → tries again
→ If something fails → retries up to 3 times automatically
```

**Why not just send immediately?**
Because sending 500 emails in 1 second looks like spam to email providers (Gmail, Outlook). By spacing them out (e.g. 1 email every 2 seconds, max 100/hour), your emails look natural and land in the inbox — not spam.

---

## 4. How to use the app (User Guide)

### Step 1 — Open the app
Go to the app URL (your Vercel link). You will see the **Landing Page**.

### Step 2 — Sign in
Click **"Get Started Free — Sign in with Google"**.
You will be taken to the official Google login page.
Sign in with your Google account and come back.

### Step 3 — You are in the Dashboard
After login, you see your **Dashboard**. It shows:
- **Emails Queued** — how many emails are waiting to be sent
- **Emails Sent** — how many have been delivered
- **Email Accounts** — how many sender email addresses you have connected

### Step 4 — Create a campaign (New Campaign button)
Click **"New Campaign"** in the top right.
A form opens. Fill it in:

| Field | What to enter |
|---|---|
| **Recipient email address** | Type any email (e.g. `friend@gmail.com`) and click "Add Recipient" |
| **Or upload a CSV** | Upload a `.csv` or `.txt` file with one email per line |
| **Subject** | Your email's subject line |
| **Email body** | The actual message you want to send |
| **When to send** | "Send Immediately" or "Schedule for Later" (pick a date) |
| **Delay between emails** | How many milliseconds between each email (default 2000 = 2 seconds) |
| **Max emails per hour** | The hourly limit (default 100) |

### Step 5 — Connect your Gmail (to send real emails)
Click **"+ Connect Real Gmail / SMTP"** inside the form.
Enter your Gmail address and your **Gmail App Password**.

> **What is a Gmail App Password?**
> It is a special 16-character password Google generates for apps.
> Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → create one → paste it here.
> This is NOT your regular Gmail password.

Click **"Save & Set as Active Sender"**.

### Step 6 — Send the campaign
Click **"Send to X Recipient(s)"** at the bottom.
Your emails are now scheduled. You will see them in the **"Scheduled & Sending"** tab.

### Step 7 — Track your emails
- **"Scheduled & Sending" tab** → shows emails that are queued or currently being sent
- **"Sent" tab** → shows emails that were successfully delivered
- Each email shows: recipient address, subject, scheduled time, and status

### Status meanings
| Status shown | What it means |
|---|---|
| 🔵 Queued | Waiting for the right time to send |
| 🟣 Sending now | Currently being sent |
| 🟢 Delivered | Successfully arrived in the recipient's inbox |
| 🟠 Paused (limit reached) | Hourly limit hit — will retry next hour automatically |
| 🔴 Failed to send | Could not be sent after 3 attempts (check SMTP settings) |

---

## 5. Project Folder Structure

```
reachinbox-email-scheduler/
│
├── frontend/                  ← The website (what users see)
│   ├── src/
│   │   ├── pages/             ← Full pages (Landing, Login, Dashboard)
│   │   ├── components/        ← Small reusable UI pieces (buttons, modals, etc.)
│   │   ├── features/          ← Bigger feature sections (email tabs, slack section)
│   │   ├── hooks/             ← Logic helpers (fetching data, auth state)
│   │   ├── services/          ← API calls to the backend
│   │   └── types/             ← TypeScript data shapes
│   ├── .env.example           ← Template for environment variables
│   └── package.json
│
├── backend/                   ← The server (does all the real work)
│   ├── src/
│   │   ├── controllers/       ← Handle web requests (what happens when URL is hit)
│   │   ├── services/          ← Business logic (sending emails, rate limiting, etc.)
│   │   ├── workers/           ← Background jobs (process the email queue)
│   │   ├── queues/            ← Set up the job queue
│   │   ├── middleware/        ← Request interceptors (auth check, etc.)
│   │   ├── routes/            ← URL routing
│   │   ├── utils/             ← Helpers (encryption, config)
│   │   └── types/             ← TypeScript data shapes
│   ├── prisma/
│   │   └── schema.prisma      ← Database table definitions
│   ├── tests/                 ← Automated tests
│   └── package.json
│
├── vercel.json                ← Tells Vercel how to deploy the frontend
└── package.json               ← Root scripts
```

---

## 6. Frontend — Every page and component explained

### Pages

#### `LandingPage.tsx`
**What it is:** The home page that visitors see before signing in.

**What it shows:**
- Big headline explaining what the app does
- "How it works" section with 3 simple steps
- Features section (plain English benefits)
- "Get Started Free" button that takes you to Google login

**Who sees it:** Anyone who visits the app URL without being logged in.

---

#### `Login.tsx`
**What it is:** The sign-in page.

**What it shows:**
- A card with a "Sign in with Google" button
- Clicking it goes to Google's official login page
- After Google login, you are redirected back to the dashboard

---

#### `Dashboard.tsx`
**What it is:** The main page after you log in. Your control panel.

**What it shows:**
- 3 stat cards (Emails Queued, Emails Sent, Email Accounts)
- Optional Slack connection banner
- Tabs to switch between "Scheduled & Sending" and "Sent" emails
- "New Campaign" button to open the compose form

---

### Components (small reusable pieces)

#### `Header.tsx`
**What it is:** The top navigation bar shown on the Dashboard.

**What it has:**
- ReachInbox logo (links to home)
- "New Campaign" button
- Your Google profile picture and name
- Logout button

---

#### `Badge.tsx` → `StatusBadge`
**What it is:** The coloured pill that shows an email's current status.

**How it looks:**
- 🔵 Blue = Queued
- 🟣 Purple = Sending now
- 🟢 Green = Delivered
- 🟠 Orange = Paused (limit reached)
- 🔴 Red = Failed to send

---

#### `GoogleAccountChooserModal.tsx`
**What it is:** A pop-up window for signing in or setting up Google OAuth.

**What it has:**
- Tab 1: Official Google sign-in (recommended)
- Tab 2: Enter your own Google OAuth credentials (for advanced setup)
- Tab 3: Enter a specific email address directly

---

#### `Modal.tsx`
**What it is:** A reusable overlay/popup container.
Used for the compose form and email detail view.

---

#### `FileUploader.tsx`
**What it is:** A drag-and-drop box for uploading CSV/TXT files.

**How to use:** Drag a file into the box, or click to browse.
The file should have one email address per line.

---

#### `Input.tsx` and `Textarea.tsx`
**What they are:** Styled form fields used across the compose form.

---

#### `Button.tsx`
**What it is:** A reusable styled button with loading state support.

---

#### `LoadingSpinner.tsx`
**What it is:** A spinning animation shown while data is loading.

---

#### `EmptyState.tsx`
**What it is:** A friendly "nothing here yet" message shown when a list is empty.

---

#### `Tabs.tsx`
**What it is:** The tab switcher between "Scheduled & Sending" and "Sent".

---

### Features

#### `features/emails/ComposeEmailModal.tsx`
**What it is:** The form you fill in when creating a campaign. It is the most important UI component.

**What it lets you do:**
1. Add recipient email addresses one by one, OR upload a CSV file
2. Load a template (pre-written email)
3. Connect a real Gmail account via SMTP
4. Write subject and body
5. Choose send time (now or later)
6. Set delay between emails and hourly limit
7. Send a quick test email to one address
8. Submit the campaign to be scheduled

---

#### `features/emails/ScheduledEmailsTab.tsx`
**What it is:** The table showing emails that are queued or currently sending.

**What it shows per row:**
- Recipient email address
- Subject line
- Scheduled date/time
- Status badge (Queued, Sending now, etc.)

**You can also:** Click any row to see the full email body.

---

#### `features/emails/SentEmailsTab.tsx`
**What it is:** The table showing emails that were successfully delivered.

**What it shows:** Same columns as above, but only delivered emails.
Has a search box to find emails by recipient or subject.

---

#### `features/slack/SlackConnect.tsx`
**What it is:** A banner to connect your Slack workspace.

**Why connect Slack?**
When your hourly sending limit is reached, the app sends a Slack message to alert you.
Click "Connect Slack" → authorize → done.

---

### Hooks (data fetching logic)

#### `hooks/useAuth.ts`
Gets the current logged-in user. Used to check if you are logged in and to log out.

#### `hooks/useEmails.ts`
Fetches scheduled and sent email lists from the backend. Auto-refreshes every 10 seconds.

---

### Services (API calls)

#### `services/api.ts`
All the functions that call the backend server:
- `authApi` — login, logout, check session
- `emailApi` — get scheduled emails, get sent emails, schedule new emails, send test
- `senderApi` — add/list email sender accounts
- `slackApi` — connect Slack, get Slack status

---

## 7. Backend — Every service explained

### Controllers (handle web requests)

#### `authController.ts`
**What it does:** Manages user login and sessions.
- Handles Google OAuth login flow
- Creates a user in the database on first login
- Issues session tokens and JWT tokens for the frontend
- Has a dev-login endpoint for local testing

#### `campaignController.ts`
**What it does:** Manages email sender accounts.
- `POST /api/senders` — Save a new Gmail/SMTP account (encrypts the password before saving)
- `GET /api/senders` — List your connected sender accounts

#### `emailController.ts`
**What it does:** The main email engine API.
- `POST /api/emails/schedule` — Receives the campaign form, creates email records, queues them
- `GET /api/emails/scheduled` — Returns the list of queued/sending emails
- `GET /api/emails/sent` — Returns the list of delivered emails
- `GET /api/emails/search` — Search emails by text
- `POST /api/emails/test` — Sends a single test email immediately

#### `slackController.ts`
**What it does:** Manages Slack integration.
- Handles OAuth flow to connect a Slack workspace
- Provides the Slack connection status

---

### Services (the real business logic)

#### `EmailSchedulingService.ts`
**What it does:** The "campaign creator."

When you submit the campaign form:
1. Validates that the sender belongs to you
2. Creates one row in the database per recipient email
3. Calculates when each email should be sent (start time + delay × position)
4. Puts each email into the background queue with the right delay

**Example:** 3 recipients, start at 10am, 2s delay between each:
- Email 1 → sent at 10:00:00
- Email 2 → sent at 10:00:02
- Email 3 → sent at 10:00:04

---

#### `IdempotencyService.ts`
**What it does:** The "no duplicate sends" guard.

Before a worker sends an email, it "locks" it in the database.
If two workers somehow try to send the same email at the same time, only one wins — the other skips it.

It also detects "stuck" emails — if an email was claimed for sending more than 5 minutes ago but never finished, it automatically recovers it.

---

#### `RateLimitService.ts`
**What it does:** The "hourly limit" checker.

Before sending each email, it checks: "How many emails has this sender sent this hour?"
- If under the limit → allow
- If at the limit → reschedule the email for the next hour and notify Slack

---

#### `ThrottleService.ts`
**What it does:** The "spacing" controller.

Even within the hourly limit, it enforces a minimum gap between sends (default 2 seconds).
This prevents sending bursts that could look suspicious to email providers.

---

#### `SMTPService.ts`
**What it does:** The actual email sender.

Takes the email content and sends it via SMTP (the standard email protocol).
- Auto-detects Gmail vs. other SMTP providers
- In production: uses real TLS security
- In development: TLS can be relaxed for testing

---

#### `SearchIndexService.ts`
**What it does:** Indexes sent emails into Elasticsearch so you can search them.

When an email is delivered, it gets saved to a search index.
This makes the search box in the "Sent" tab very fast even with thousands of emails.

---

#### `NotificationService.ts`
**What it does:** Sends Slack messages.

When the hourly limit is reached, this service posts a message to your connected Slack channel telling you which sender hit the limit and when it will resume.

---

### Workers (background jobs)

#### `workers/processors/emailProcessor.ts`
**What it does:** The actual "email worker" — the most important backend file.

This runs silently in the background, 24/7. Here is what happens each time a job fires:

```
1. Receive job from queue
2. Lock the email in database (prevent duplicates)
3. Check hourly rate limit
   → If limit hit: reschedule for next hour, notify Slack
4. Wait for spacing slot (2 second gap)
5. Decrypt the SMTP password
6. Connect to SMTP server
7. Send the email
8. Mark as "Delivered" in database
9. Save to search index
```

If anything goes wrong, the job automatically retries up to 3 times with a 5-second wait between tries.

---

### Utils (helper tools)

#### `utils/encryption.ts`
**What it does:** Encrypts and decrypts your SMTP (Gmail App) password.

Uses AES-256-GCM encryption (military-grade). Your password is never stored as plain text.
When the worker needs to send an email, it decrypts it on the fly.

---

## 8. How emails are sent (The full journey)

Here is the complete path of one email, from you clicking "Send" to it arriving in the inbox:

```
[You click "Send to 500 Recipients"]
        │
        ▼
[Backend creates 500 rows in the database — one per email]
        │
        ▼
[Each row gets added to the background queue with a delay]
 (email #1 → 0s delay, email #2 → 2s delay, email #3 → 4s delay...)
        │
        ▼
[Queue waits until it's time for each email]
        │
        ▼
[Worker wakes up for email #1]
    ├── Locks the row (prevents accidental double-send)
    ├── Checks: Is hourly limit OK?
    │       YES → Continue
    │       NO  → Reschedule for next hour, notify Slack
    ├── Waits for spacing slot (2 seconds since last send)
    ├── Decrypts SMTP password
    ├── Connects to Gmail via SMTP
    ├── Sends the email
    ├── Marks row as "Delivered" in database
    └── Saves to search index
        │
        ▼
[Email arrives in recipient's real inbox ✅]
```

---

## 9. Environment Variables

These are settings you configure in Render (backend) and Vercel (frontend).
**Never put real credentials in your code files.**

### Backend (Render)

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Your PostgreSQL database connection string |
| `REDIS_URL` | Your Redis connection string (e.g. from Upstash) |
| `SESSION_SECRET` | A random secret string (min 32 chars) for securing sessions |
| `ENCRYPTION_KEY` | A random 32+ char string used to encrypt SMTP passwords |
| `GOOGLE_CLIENT_ID` | Your Google OAuth app's Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth app's Client Secret |
| `GOOGLE_CALLBACK_URL` | `https://your-render-url.onrender.com/auth/google/callback` |
| `CLIENT_URL` | Your Vercel frontend URL (e.g. `https://yourapp.vercel.app`) |
| `NODE_ENV` | Set to `production` on Render |
| `ELASTICSEARCH_URL` | Optional — Elasticsearch URL for email search |
| `SLACK_CLIENT_ID` | Optional — for Slack integration |
| `SLACK_CLIENT_SECRET` | Optional — for Slack integration |

### Frontend (Vercel)

| Variable | What it is |
|---|---|
| `VITE_API_URL` | Your Render backend URL (e.g. `https://yourapp.onrender.com`) |

---

## 10. How to run locally

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud like Neon)
- Redis (local or cloud like Upstash)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/mShubham1306/ReachInbox_Email_Scheduler.git
cd ReachInbox_Email_Scheduler

# 2. Install all dependencies
npm install

# 3. Set up backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# 4. Set up the database
cd backend
npx prisma migrate dev
npx prisma generate

# 5. Start backend (in one terminal)
npm run dev

# 6. Start frontend (in another terminal)
cd ../frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

### Testing email sending locally
If you do not have a real Gmail App Password, you can use **Ethereal** (a fake SMTP inbox):
1. Go to [ethereal.email](https://ethereal.email) and create a free account
2. Use the provided credentials in the "Connect Real Gmail / SMTP" section
3. Your "sent" emails will appear at ethereal.email/messages (they are not real, just for testing)

---

## 11. Deployment (Vercel + Render)

### Frontend → Vercel
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set **Root Directory** to `frontend` (or leave default — `vercel.json` handles it)
4. Add environment variable: `VITE_API_URL` = your Render backend URL
5. Deploy ✅

### Backend → Render
1. Go to [render.com](https://render.com) → New Web Service → Connect GitHub repo
2. Set:
   - **Build command:** `cd backend && npm install && npx prisma generate && npm run build`
   - **Start command:** `cd backend && npm start`
3. Add all the backend environment variables listed above
4. Deploy ✅

### After both are deployed
- Update `GOOGLE_CALLBACK_URL` in Render to your live Render URL
- Add your Vercel URL to the **Authorized redirect URIs** in Google Cloud Console

---

## 12. Security features

| Feature | What it protects |
|---|---|
| **AES-256-GCM encryption** | Your SMTP/Gmail password — never stored as plain text |
| **Google OAuth only** | No username/password system — Google handles identity |
| **Session cookies** | Secure, HTTP-only, with SameSite protection |
| **JWT tokens** | Used for cross-domain auth (Vercel frontend ↔ Render backend) |
| **Sender ownership check** | You can only send from email accounts you added yourself |
| **Duplicate send prevention** | Database lock ensures each email is sent exactly once |
| **HTTPS in production** | All traffic is encrypted in transit |
| **TLS for SMTP** | Email is sent over encrypted connection to Gmail servers |

---

## 13. Tech Stack (Simple version)

| Layer | Technology | What it does |
|---|---|---|
| **Frontend** | React + TypeScript | The website UI |
| **Styling** | Tailwind CSS | Makes the UI look nice |
| **Backend** | Express.js + TypeScript | The server / API |
| **Database** | PostgreSQL + Prisma | Stores users, emails, senders |
| **Job Queue** | BullMQ + Redis | Schedules background email jobs |
| **Email sending** | Nodemailer | Connects to Gmail / SMTP and sends |
| **Authentication** | Google OAuth + Passport.js | User login |
| **Search** | Elasticsearch | Fast email search |
| **Notifications** | Slack API | Sends alerts when limits are hit |
| **Hosting** | Vercel (frontend) + Render (backend) | Runs the app online |

---

## Quick Links

- **Live App (Frontend):** Your Vercel URL
- **Backend API:** Your Render URL
- **GitHub Repo:** https://github.com/mShubham1306/ReachInbox_Email_Scheduler
- **Gmail App Passwords:** https://myaccount.google.com/apppasswords
- **Google Cloud Console:** https://console.cloud.google.com
- **Ethereal (Test Inbox):** https://ethereal.email

---

*Made with ❤️ — ReachInbox Email Scheduler*
