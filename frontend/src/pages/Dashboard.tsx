import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { Tabs } from '../components/Tabs';
import { useAuth } from '../hooks/useAuth';
import { ComposeEmailModal } from '../features/emails/ComposeEmailModal';
import { ScheduledEmailsTab } from '../features/emails/ScheduledEmailsTab';
import { SentEmailsTab } from '../features/emails/SentEmailsTab';
import { SlackConnect } from '../features/slack/SlackConnect';
import { senderApi, slackApi, emailApi } from '../services/api';
import { Clock, CheckCircle2, Mail, Send, Zap } from 'lucide-react';

type ActiveTab = 'scheduled' | 'sent';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const { data: senders = [] } = useQuery({
    queryKey: ['senders'],
    queryFn: senderApi.getAll,
  });

  const { data: slackStatus } = useQuery({
    queryKey: ['slack', 'status'],
    queryFn: slackApi.getStatus,
  });

  const { data: scheduledData } = useQuery({
    queryKey: ['emails', 'scheduled', 1],
    queryFn: () => emailApi.getScheduled(1, 100),
    refetchInterval: 10_000,
  });

  const { data: sentData } = useQuery({
    queryKey: ['emails', 'sent', 1],
    queryFn: () => emailApi.getSent(1, 100),
    refetchInterval: 10_000,
  });

  if (!user) return null;

  const scheduledCount = scheduledData?.total ?? 0;
  const sentCount = sentData?.total ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 bg-grid-pattern selection:bg-brand-500/30 selection:text-brand-200">
      <Header user={user} onLogout={logout} onCompose={() => setIsComposeOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">Emails Queued</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{scheduledCount}</div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 mt-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Waiting to send
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">Emails Sent</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{sentCount}</div>
            <div className="text-xs text-slate-400 mt-1">Successfully delivered</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">Email Accounts</span>
              <Mail className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">{Math.max(1, senders.length)}</div>
            <div className="text-xs text-slate-400 mt-1">
              {senders.length === 0 ? 'Add a sender to start' : 'Connected senders'}
            </div>
          </div>
        </div>

        {/* Slack Connection Banner */}
        <SlackConnect status={slackStatus} />

        {/* Main Workspace */}
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Header toolbar */}
          <div className="px-6 pt-6 pb-0 border-b border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Send className="w-5 h-5 text-brand-400" />
                  Your Campaigns
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  All your scheduled and sent emails in one place
                </p>
              </div>

              <button
                onClick={() => setIsComposeOpen(true)}
                className="btn-shimmer inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-brand-500/25 transition-all active:scale-95"
              >
                <Zap className="w-4 h-4" />
                New Campaign
              </button>
            </div>

            {/* Tabs */}
            <Tabs
              tabs={[
                { id: 'scheduled', label: 'Scheduled & Sending', count: scheduledCount },
                { id: 'sent', label: 'Sent', count: sentCount },
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as ActiveTab)}
            />
          </div>

          {/* Table Container */}
          <div className="p-6">
            {activeTab === 'scheduled' && <ScheduledEmailsTab />}
            {activeTab === 'sent' && <SentEmailsTab />}
          </div>
        </div>
      </main>

      {/* Compose Modal */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        senders={senders}
      />
    </div>
  );
}
