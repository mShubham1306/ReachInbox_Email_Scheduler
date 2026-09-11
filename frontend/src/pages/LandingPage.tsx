import { useState } from 'react';
import { 
  Mail, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Cpu, 
  Database, 
  Send, 
  Search, 
  Sliders, 
  CheckCircle, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Server,
  Layers
} from 'lucide-react';
import { GoogleAccountChooserModal } from '../components/GoogleAccountChooserModal';
import { authApi } from '../services/api';

export function LandingPage() {
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'official' | 'setup' | 'direct'>('official');
  const [activeTab, setActiveTab] = useState<'scheduler' | 'ratelimit' | 'throttle' | 'idempotency'>('scheduler');

  const handleGoogleClick = async () => {
    try {
      const status = await authApi.getGoogleStatus();
      if (status.isConfigured) {
        window.location.href = '/auth/google';
      } else {
        setModalMode('setup');
        setIsGoogleModalOpen(true);
      }
    } catch {
      setModalMode('setup');
      setIsGoogleModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden bg-grid-pattern selection:bg-brand-500/30 selection:text-brand-200">
      {/* Background Ambient Glow Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-radial-brand pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[500px] bg-radial-purple pointer-events-none" />

      {/* Top Glass Navbar */}
      <header className="sticky top-0 z-40 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/25 ring-1 ring-white/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
                ReachInbox<span className="text-brand-400 font-extrabold text-sm px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">AI</span>
              </span>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#telemetry" className="hover:text-white transition-colors">Engine Specs</a>
            <a 
              href="/admin/queues" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-brand-300 transition-colors"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              Queue Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              BullMQ Cluster Online
            </div>

            <button
              onClick={handleGoogleClick}
              className="btn-shimmer flex items-center gap-2.5 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 ring-1 ring-white/20 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign In with Google
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 max-w-7xl mx-auto text-center">
        {/* Release Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-xs font-medium text-slate-300 mb-8 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin" />
          <span>Autonomous Outreach Engine v2.4</span>
          <span className="text-slate-600">•</span>
          <span className="text-brand-300 font-semibold">Zero-Drop BullMQ Architecture</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6">
          Scale Cold Email Outreach with <br className="hidden sm:inline" />
          <span className="text-gradient-brand">Mathematical Precision</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
          A high-throughput distributed email scheduler engineered with BullMQ delayed queues, 
          distributed Redis rate-limiting, and PostgreSQL transaction idempotency. No cron jobs. Zero duplicate sends.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={handleGoogleClick}
            className="w-full sm:w-auto btn-shimmer flex items-center justify-center gap-3 bg-white text-slate-950 hover:bg-slate-100 font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Launch Scheduler Dashboard
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <a
            href="/admin/queues"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto glass-card glass-card-hover flex items-center justify-center gap-2.5 text-slate-300 font-semibold px-7 py-4 rounded-2xl text-base border border-slate-800 hover:border-slate-700"
          >
            <Server className="w-5 h-5 text-brand-400" />
            Live Queue Monitor
          </a>
        </div>

        {/* Live Metrics Grid */}
        <div id="telemetry" className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="glass-card p-6 rounded-2xl text-left border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Hourly Capacity</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">5,000+</div>
            <p className="text-xs text-slate-400 mt-1">Emails/hr per sender limit</p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-left border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Cron Overhead</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">0 ms</div>
            <p className="text-xs text-slate-400 mt-1">Pure BullMQ delayed jobs</p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-left border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Idempotency</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">100%</div>
            <p className="text-xs text-slate-400 mt-1">SELECT FOR UPDATE NOWAIT</p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-left border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Throttle Spacing</span>
              <Sliders className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-purple-300 tracking-tight">2,000 ms</div>
            <p className="text-xs text-slate-400 mt-1">Global inter-email slot claim</p>
          </div>
        </div>
      </section>

      {/* Interactive Engine Architecture Showcase */}
      <section id="architecture" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Under the Hood: <span className="text-gradient-brand">Enterprise Distributed Engine</span>
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Explore how ReachInbox coordinates millions of stateful email dispatches across Redis clusters, 
            resilient workers, and Postgres ACID boundaries.
          </p>

          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {[
              { id: 'scheduler', label: '1. Delayed Job Scheduler', icon: Clock },
              { id: 'ratelimit', label: '2. Distributed Rate Limiter', icon: Zap },
              { id: 'throttle', label: '3. Atomic Spacing Throttle', icon: Sliders },
              { id: 'idempotency', label: '4. Zero-Drop State Machine', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 border border-brand-400/40'
                      : 'glass-card text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Architecture Content Panel */}
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-800 relative overflow-hidden">
          {activeTab === 'scheduler' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Pure BullMQ Queue</span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-4">Persistent Delayed Jobs (No Crons)</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Instead of unreliable intervals or cron sweeps, each email is ingested into BullMQ with a calculated delay:
                  <code className="block bg-slate-950 p-3 rounded-lg text-xs font-mono text-brand-300 my-3 border border-slate-800">
                    delay = Math.max(0, scheduledAt.getTime() - Date.now())
                  </code>
                  Jobs reside in Redis sorted sets. Even if the entire cluster restarts, Redis maintains the timer and triggers delivery on schedule.
                </p>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Survives server crash & redeploys without job loss
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Millisecond-accurate dispatch precision
                  </div>
                </div>
              </div>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300">
                <div className="text-slate-500 mb-2">// BullMQ delayed job representation</div>
                <pre className="text-emerald-400">{`{
  "queue": "email-send",
  "jobId": "email-984a-2f10",
  "delay": 120000,
  "attempts": 3,
  "backoff": { "type": "exponential", "delay": 5000 },
  "data": {
    "emailId": "uuid-1122",
    "campaignId": "camp-5544",
    "senderId": "sender-009"
  }
}`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'ratelimit' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Hourly Quota Guard</span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-4">Lua Atomic Sliding Windows & Auto-Reschedule</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Using Redis atomic Lua scripts, counters are keyed per sender per hour:
                  <code className="block bg-slate-950 p-3 rounded-lg text-xs font-mono text-amber-300 my-3 border border-slate-800">
                    {'key = "ratelimit:sender:{id}:hour:{YYYYMMDDHH}"'}
                  </code>
                  If the limit is hit, jobs are <strong>never dropped or failed</strong>. The worker calculates the top of the next hour window (`nextWindowAt`), reschedules the job, and notifies your team on Slack.
                </p>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Atomic across multiple concurrent worker containers
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Live Slack notification with 1 alert/hour dedup
                  </div>
                </div>
              </div>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300">
                <div className="text-slate-500 mb-2">// Rate-limit Lua script execution</div>
                <pre className="text-amber-400">{`local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
if current > tonumber(ARGV[2]) then
  redis.call('DECR', KEYS[1])
  return 0 -- Limit exceeded: Reschedule to nextWindowAt
end
return 1 -- Allowed: Proceed to throttle`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'throttle' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Provider Protection</span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-4">Global Inter-Email Slot Coordination</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  SMTP providers flag bursts of emails sent from the same mailbox. Our <code>ThrottleService</code> uses atomic slot reservation in Redis to space outgoing emails by at least 2,000ms globally across all workers.
                </p>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Safe under multi-threaded concurrency
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Maintains mailbox reputation and inbox placement
                  </div>
                </div>
              </div>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300">
                <div className="text-slate-500 mb-2">// Slot claim logic</div>
                <pre className="text-purple-300">{`const allowedAt = await throttleService.acquireSendSlot(senderId);
await throttleService.waitForSlot(allowedAt);
// SMTP dispatch occurs only when slot is reached`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'idempotency' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Zero Duplication Guarantee</span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-4">PostgreSQL Transaction State Machine</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  To prevent race conditions where two workers pick up the same job, workers execute:
                  <code className="block bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-300 my-3 border border-slate-800">
                    SELECT * FROM "Email" WHERE id = $1 FOR UPDATE NOWAIT
                  </code>
                  If locked, PostgreSQL throws error 55P03, and the competing worker instantly skips. Only one worker transitions the record:
                  <code>SCHEDULED → PROCESSING → SENT</code>.
                </p>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Application-level exactly-once execution logic
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Fail-safe rollback on unrecoverable SMTP errors
                  </div>
                </div>
              </div>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300">
                <div className="text-slate-500 mb-2">// Postgres State Transitions</div>
                <pre className="text-blue-300">{`SCHEDULED
   │  (Claimed via FOR UPDATE NOWAIT)
   ▼
PROCESSING
   ├── [Rate Limit Hit]  ──► RATE_LIMITED ──► (Rescheduled)
   ├── [SMTP Success]    ──► SENT (Message ID recorded)
   └── [Retries Exhaust] ──► FAILED (Error logged)`}</pre>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Feature Spotlights */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything You Need for <span className="text-gradient-brand">Cold Outreach</span>
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Engineered for growth teams that demand reliability, speed, and real-time observability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card glass-card-hover p-8 rounded-3xl border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-6">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Elasticsearch Indexing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every dispatched email is indexed into Elasticsearch with fuzzy multi-match searching across recipient addresses, subject lines, and message bodies.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-8 rounded-3xl border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Slack Notifications</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real OAuth authorization connects your workspace. The instant a sender reaches their hourly rate limit, an automated alert posts to Slack.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-8 rounded-3xl border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">CSV Lead Ingestion</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Drag-and-drop CSV or plain text lists with automatic deduplication, invalid character stripping, and real-time lead counts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Mail className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-white">ReachInbox.ai</span> — Outbox Labs Hiring Assignment
          </div>
          <div className="flex items-center gap-6">
            <a href="/admin/queues" target="_blank" rel="noreferrer" className="hover:text-slate-300">
              Queue Dashboard
            </a>
            <span 
              onClick={handleGoogleClick}
              className="hover:text-slate-300 cursor-pointer"
            >
              Sign In
            </span>
            <span>TypeScript • BullMQ • Redis • Postgres</span>
          </div>
        </div>
      </footer>

      {/* Google Account Chooser Modal */}
      <GoogleAccountChooserModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        defaultMode={modalMode}
      />
    </div>
  );
}
