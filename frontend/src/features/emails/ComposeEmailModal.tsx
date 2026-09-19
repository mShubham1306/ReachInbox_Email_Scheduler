import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/Modal';
import { Input, Textarea } from '../../components/Input';
import { Button } from '../../components/Button';
import { FileUploader } from '../../components/FileUploader';
import { useScheduleEmails, useParseLeads } from '../../hooks/useEmails';
import { senderApi, emailApi } from '../../services/api';
import type { Sender } from '../../types';
import { 
  CheckCircle, 
  Users, 
  AlertTriangle, 
  Sparkles, 
  Send, 
  Calendar, 
  Clock, 
  ExternalLink,
  Mail,
  ShieldCheck,
  Globe,
  Settings,
  Plus,
  Zap
} from 'lucide-react';

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  senders: Sender[];
}

interface FormState {
  senderId: string;
  senderMode: 'ethereal' | 'real_smtp';
  realEmail: string;
  realPassword: string;
  realHost: string;
  realPort: number;
  subject: string;
  body: string;
  scheduleMode: 'now' | 'later';
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
}

const TEMPLATES = [
  {
    name: 'ðŸŽ¯ Outreach Demo',
    subject: 'Quick question about {{company}} outbound outreach',
    body: `Hi there,\n\nI noticed you're scaling your team and wanted to see how you're currently handling cold email deliverability at scale.\n\nAt ReachInbox, we help teams send thousands of personalized emails automatically, at the right time.\n\nOpen to a quick 5-min chat this Thursday?\n\nBest,\nReachInbox Outreach Team`,
  },
  {
    name: 'âš¡ Real Email Test',
    subject: 'Live ReachInbox Test: Real Email Delivery',
    body: `Hello,\n\nThis is a real outbound message dispatched live through the ReachInbox Email Scheduler.\n\nIf you received this in your actual inbox, the email delivery system is working perfectly.\n\nTimestamp: ${new Date().toLocaleString()}\nReachInbox Engineering`,
  },
];

const SAMPLE_LEADS = [
  'alex.morgan@techventures.io',
  'sarah.chen@innovatecorp.com',
  'david.kim@scaleoutbound.ai',
];

export function ComposeEmailModal({ isOpen, onClose, senders }: ComposeEmailModalProps) {
  const [form, setForm] = useState<FormState>({
    senderId: senders[0]?.id ?? '11111111-2222-3333-4444-555555555555',
    senderMode: 'ethereal',
    realEmail: '',
    realPassword: '',
    realHost: 'smtp.gmail.com',
    realPort: 465,
    subject: 'Live ReachInbox Test: Real Email Delivery',
    body: `Hello,\n\nThis is a live test email sent via ReachInbox.\n\nIf you received this, the SMTP pipeline and BullMQ scheduler are operating successfully!\n\nSent At: ${new Date().toLocaleString()}`,
    scheduleMode: 'now',
    startTime: new Date().toISOString().slice(0, 16),
    delayMs: 2000,
    hourlyLimit: 100,
  });

  const [directRecipientInput, setDirectRecipientInput] = useState('');
  const [parsedLeads, setParsedLeads] = useState<{ valid: string[]; invalid: string[]; duplicatesRemoved: number } | null>({
    valid: ['recipient@example.com'],
    invalid: [],
    duplicatesRemoved: 0,
  });
  const [isAddingRealSender, setIsAddingRealSender] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ to: string; messageId: string; previewUrl?: string } | null>(null);

  const { mutate: parseFile, isPending: isParsing } = useParseLeads();
  const { mutate: scheduleEmails, isPending: isScheduling } = useScheduleEmails();

  const handleSendLiveTest = async () => {
    const targetEmail = (parsedLeads?.valid[0] || directRecipientInput || form.realEmail).trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Please enter or select at least one recipient email to test live delivery');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await emailApi.sendTest({
        to: targetEmail,
        subject: form.subject || 'ReachInbox Real Email Verification',
        body: form.body || '<p>Hello from ReachInbox Scheduler! Real email delivery confirmed.</p>',
        fromEmail: form.realEmail || undefined,
        smtpPassword: form.realPassword || undefined,
        smtpHost: form.realHost || undefined,
        smtpPort: form.realPort || undefined,
      });

      setTestResult({
        to: targetEmail,
        messageId: res.messageId,
        previewUrl: res.previewUrl,
      });
      toast.success(`ðŸš€ Real test email dispatched to ${targetEmail}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to dispatch test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Keep default sender in sync
  useEffect(() => {
    if (senders.length > 0 && (!form.senderId || form.senderId === '11111111-2222-3333-4444-555555555555')) {
      setForm((f) => ({ ...f, senderId: senders[0].id }));
    }
  }, [senders, form.senderId]);

  const handleFile = (file: File) => {
    parseFile(file, {
      onSuccess: (data) => {
        setParsedLeads({ valid: data.valid, invalid: data.invalid, duplicatesRemoved: data.duplicatesRemoved });
        toast.success(`${data.valid.length} valid leads detected from file`);
      },
      onError: () => toast.error('Could not parse file â€” check format'),
    });
  };

  const handleAddDirectRecipient = () => {
    const email = directRecipientInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address (e.g. yourname@gmail.com)');
      return;
    }
    setParsedLeads((prev) => {
      const existing = prev?.valid ?? [];
      if (existing.includes(email)) {
        toast('Email is already in recipient list', { icon: 'â„¹ï¸' });
        return prev;
      }
      return {
        valid: [email, ...existing],
        invalid: prev?.invalid ?? [],
        duplicatesRemoved: prev?.duplicatesRemoved ?? 0,
      };
    });
    setDirectRecipientInput('');
    toast.success(`Added ${email} to recipient list`);
  };

  const handleCreateRealSender = async () => {
    if (!form.realEmail || !form.realPassword) {
      toast.error('Please enter your Gmail address and 16-character App Password');
      return;
    }
    try {
      const res = await senderApi.create({
        email: form.realEmail,
        smtpHost: form.realHost,
        smtpPort: form.realPort,
        smtpUser: form.realEmail,
        smtpPassword: form.realPassword,
        hourlyLimit: form.hourlyLimit,
      });
      toast.success(`Real sender ${res.email} configured!`);
      setForm((f) => ({ ...f, senderId: res.id, senderMode: 'real_smtp' }));
      setIsAddingRealSender(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save real sender');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedLeads || parsedLeads.valid.length === 0) {
      toast.error('Please specify at least one recipient email');
      return;
    }

    const scheduledDate = form.scheduleMode === 'now' 
      ? new Date() 
      : new Date(form.startTime);

    scheduleEmails(
      {
        senderId: form.senderId || senders[0]?.id || '11111111-2222-3333-4444-555555555555',
        subject: form.subject,
        body: form.body,
        recipients: parsedLeads.valid,
        startTime: scheduledDate.toISOString(),
        delayMs: form.delayMs,
        hourlyLimit: form.hourlyLimit,
      },
      {
        onSuccess: (result: any) => {
          if (result?.liveDelivered?.length > 0) {
            toast.success(
              `ðŸš€ Dispatched live to ${result.liveDelivered.length} real email addresses!`,
              { duration: 6000 }
            );
          } else {
            toast.success(
              `âœ… ${result.scheduledEmails} emails queued into BullMQ!`,
              { duration: 5000 }
            );
          }
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || 'Failed to schedule emails');
        },
      }
    );
  };

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Campaign" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 dark:text-slate-200">
        {/* Quick Templates Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Templates:</span>
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, subject: t.subject, body: t.body }));
                  toast.success(`Loaded "${t.name}"`);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-300 transition-colors font-medium"
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingRealSender(!isAddingRealSender)}
              className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              <Globe className="w-3.5 h-3.5" />
              {isAddingRealSender ? 'Close Real SMTP Setup' : '+ Connect Real Gmail / SMTP'}
            </button>
          </div>
        </div>

        {/* Real SMTP Configuration Accordion */}
        {isAddingRealSender && (
          <div className="p-4 bg-brand-500/5 dark:bg-brand-950/30 border border-brand-500/20 rounded-2xl space-y-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-brand-700 dark:text-brand-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-500" />
                Connect Real Sending Mailbox (Gmail / Custom SMTP)
              </span>
              <a 
                href="https://myaccount.google.com/apppasswords" 
                target="_blank" 
                rel="noreferrer" 
                className="text-brand-500 hover:underline flex items-center gap-1 font-medium text-[11px]"
              >
                Get Gmail App Password â†’
              </a>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              When connected, emails will be transmitted across real internet mail servers and land directly in the recipient's real inbox.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Your Real Email Address (e.g. Gmail)"
                placeholder="yourname@gmail.com"
                value={form.realEmail}
                onChange={update('realEmail')}
              />
              <Input
                label="16-character Gmail App Password"
                type="password"
                placeholder="abcd efgh ijkl mnop"
                value={form.realPassword}
                onChange={update('realPassword')}
                helperText="Generated from your Google Security Settings"
              />
              <Input
                label="SMTP Host"
                placeholder="smtp.gmail.com"
                value={form.realHost}
                onChange={update('realHost')}
              />
              <Input
                label="SMTP Port"
                type="number"
                value={form.realPort}
                onChange={update('realPort')}
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button type="button" onClick={handleCreateRealSender} className="bg-brand-500 hover:bg-brand-600 text-white text-xs">
                Save & Set as Active Sender
              </Button>
            </div>
          </div>
        )}

        {/* Sender selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Sending Mailbox (From Address)
          </label>
          <select
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            value={form.senderId}
            onChange={update('senderId')}
            required
          >
            {senders.map((s) => (
              <option key={s.id} value={s.id}>
                {s.email} â€¢ {s.smtpHost.includes('gmail') ? 'Real Gmail SMTP' : 'Default SMTP'} ({s.hourlyLimit} emails/hr quota)
              </option>
            ))}
            {senders.length === 0 && (
              <option value="11111111-2222-3333-4444-555555555555">
                demo@reachinbox.ai â€¢ Default SMTP (100 emails/hr quota)
              </option>
            )}
          </select>
        </div>

        {/* Direct Real Recipient Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Enter Particular Real Email Address(es)
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter any particular email address (e.g. your personal Gmail to test real delivery)..."
              value={directRecipientInput}
              onChange={(e) => setDirectRecipientInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDirectRecipient();
                }
              }}
              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddDirectRecipient}
              className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Recipient
            </button>
          </div>

          {/* Recipient list chips */}
          {parsedLeads && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  {parsedLeads.valid.length} Recipient(s) will receive this email:
                </span>
                <span className="text-slate-400 text-[11px]">Click an email to remove</span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {parsedLeads.valid.map((email) => (
                  <span 
                    key={email}
                    onClick={() => {
                      setParsedLeads((p) => ({
                        valid: p?.valid.filter((e) => e !== email) ?? [],
                        invalid: p?.invalid ?? [],
                        duplicatesRemoved: p?.duplicatesRemoved ?? 0,
                      }));
                      toast.success(`Removed ${email}`);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-red-400 hover:text-red-500 px-2 py-1 rounded-md font-mono cursor-pointer transition-colors"
                    title="Click to remove"
                  >
                    {email}
                    <span className="text-slate-400 hover:text-red-500 font-bold">Ã—</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Or bulk upload CSV */}
        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Or upload CSV/TXT lead file for bulk sending:
          </div>
          <FileUploader onFile={handleFile} isLoading={isParsing} />
        </div>

        {/* Subject */}
        <Input
          label="Subject Line"
          placeholder="e.g. Live Outreach from ReachInbox"
          value={form.subject}
          onChange={update('subject')}
          required
        />

        {/* Body */}
        <Textarea
          label="Email Body"
          placeholder="Write your email body..."
          rows={5}
          value={form.body}
          onChange={update('body')}
          required
        />

        {/* Scheduling Options */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              When to send
            </span>
            <div className="flex gap-1 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, scheduleMode: 'now' }))}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  form.scheduleMode === 'now'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Send Immediately
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, scheduleMode: 'later' }))}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  form.scheduleMode === 'later'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule for Later
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {form.scheduleMode === 'later' ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  value={form.startTime}
                  onChange={update('startTime')}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Queue Status
                </label>
                <div className="w-full px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Direct Send
                </div>
              </div>
            )}

            <Input
              label="Delay between emails (ms)"
              type="number"
              min={500}
              step={500}
              value={form.delayMs}
              onChange={update('delayMs')}
            />

            <Input
              label="Max emails per hour"
              type="number"
              min={1}
              max={5000}
              value={form.hourlyLimit}
              onChange={update('hourlyLimit')}
            />
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <span className="font-bold">Real Email Delivered to {testResult.to}!</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-mono">Message ID: {testResult.messageId}</span>
              </div>
            </div>
            {testResult.previewUrl && (
              <a 
                href={testResult.previewUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 bg-emerald-500/20 px-2.5 py-1 rounded-lg"
              >
                View Email <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Submit & Test Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Reliable delivery — no duplicate sends</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSendLiveTest}
              isLoading={isSendingTest}
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              {isSendingTest ? 'Sending...' : 'Send Test Email'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isScheduling}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-lg shadow-brand-500/25 px-5 text-xs"
            >
              {isScheduling ? 'Scheduling...' : `Send to ${parsedLeads?.valid.length ?? 0} Recipient(s)`}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

