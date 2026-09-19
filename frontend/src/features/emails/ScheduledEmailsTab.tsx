import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Mail, X } from 'lucide-react';
import { useScheduledEmails } from '../../hooks/useEmails';
import { StatusBadge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import type { Email } from '../../types';

export function ScheduledEmailsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { data, isLoading, isError, refetch } = useScheduledEmails(page);

  const emails: Email[] = data?.emails ?? [];
  const filtered = search
    ? emails.filter(
        (e) =>
          e.recipient.toLowerCase().includes(search.toLowerCase()) ||
          e.subject.toLowerCase().includes(search.toLowerCase())
      )
    : emails;

  if (isLoading) return <LoadingSpinner label="Loading scheduled queue..." />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by recipient or subject..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-white placeholder:text-slate-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No scheduled emails in queue"
          description="Click New Campaign to schedule your first email."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold">Recipient</th>
                  <th className="text-left px-5 py-3.5 font-semibold hidden sm:table-cell">Subject</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Scheduled Time</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((email) => (
                  <tr 
                    key={email.id} 
                    onClick={() => setSelectedEmail(email)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-medium text-white max-w-[220px] truncate flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {email.recipient[0].toUpperCase()}
                      </div>
                      <span className="truncate group-hover:text-brand-300 transition-colors">
                        {email.recipient}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 hidden sm:table-cell max-w-[280px] truncate">
                      {email.subject}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap text-xs font-mono">
                      {format(new Date(email.scheduledAt), 'MMM d, h:mm:ss a')}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={email.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(data?.pages ?? 1) > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span>
                Page {page} of {data?.pages} ({data?.total} total queued)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 glass-card rounded-lg disabled:opacity-30 hover:text-white"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data?.pages ?? 1, p + 1))}
                  disabled={page === (data?.pages ?? 1)}
                  className="px-3 py-1.5 glass-card rounded-lg disabled:opacity-30 hover:text-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Email Inspection Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedEmail(null)} />
          <div className="relative w-full max-w-xl glass-card rounded-3xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white text-base">Email Details</h3>
              </div>
              <button 
                onClick={() => setSelectedEmail(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-semibold text-white font-mono">{selectedEmail.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-semibold text-white">{selectedEmail.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled At:</span>
                  <span className="text-brand-300 font-mono">
                    {format(new Date(selectedEmail.scheduledAt), 'PPpp')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <StatusBadge status={selectedEmail.status} />
                </div>

              </div>

              <div>
                <span className="text-slate-500 block mb-1">Message Content:</span>
                <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto font-sans leading-relaxed">
                  {selectedEmail.body}
                </div>
              </div>


            </div>
          </div>
        </div>
      )}
    </div>
  );
}

