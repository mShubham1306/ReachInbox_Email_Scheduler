import { useState } from 'react';
import { format } from 'date-fns';
import { Search, ExternalLink, Mail, CheckCircle2, X } from 'lucide-react';
import { useSentEmails, useEmailSearch } from '../../hooks/useEmails';
import { StatusBadge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import type { Email } from '../../types';

export function SentEmailsTab() {
  const [page, setPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { data, isLoading, isError, refetch } = useSentEmails(page);
  const { query, setQuery, results: searchResults, isLoading: isSearching } = useEmailSearch();

  const emails: Email[] = query ? searchResults : (data?.emails ?? []);

  if (isLoading) return <LoadingSpinner label="Loading sent history..." />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Elasticsearch search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Full-text Elasticsearch search (recipient, subject, or message body)..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-white placeholder:text-slate-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isSearching && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {query && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <p>
            Elasticsearch query matches for: <strong className="text-brand-300">"{query}"</strong>
          </p>
          <span className="bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded border border-brand-500/20 font-mono">
            {emails.length} hits
          </span>
        </div>
      )}

      {emails.length === 0 ? (
        <EmptyState
          title={query ? 'No Elasticsearch matches found' : 'No sent emails yet'}
          description={
            query
              ? `No dispatches match the query "${query}". Try searching another recipient or subject.`
              : 'Emails will appear here in real-time as workers pick them up from BullMQ and transmit via Ethereal SMTP.'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold">Recipient Lead</th>
                  <th className="text-left px-5 py-3.5 font-semibold hidden sm:table-cell">Subject</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Sent Timestamp</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold">Ethereal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {emails.map((email) => (
                  <tr 
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-medium text-white max-w-[200px] truncate flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {email.recipient[0].toUpperCase()}
                      </div>
                      <span className="truncate group-hover:text-emerald-300 transition-colors">
                        {email.recipient}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 hidden sm:table-cell max-w-[260px] truncate">
                      {email.subject}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap text-xs font-mono">
                      {email.sentAt ? format(new Date(email.sentAt), 'MMM d, h:mm:ss a') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={email.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <a
                        href="https://ethereal.email/messages"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Preview
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (only for non-search view) */}
          {!query && (data?.pages ?? 1) > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span>
                Page {page} of {data?.pages} ({data?.total} total sent)
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

      {/* Email Details Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedEmail(null)} />
          <div className="relative w-full max-w-xl glass-card rounded-3xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Dispatched Email Audit</h3>
              </div>
              <button 
                onClick={() => setSelectedEmail(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-semibold text-white font-mono">{selectedEmail.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-semibold text-white">{selectedEmail.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivered At:</span>
                  <span className="text-emerald-300 font-mono">
                    {selectedEmail.sentAt ? format(new Date(selectedEmail.sentAt), 'PPpp') : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <StatusBadge status={selectedEmail.status} />
                </div>
                {selectedEmail.bullJobId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">BullMQ Job ID:</span>
                    <span className="font-mono text-slate-400">{selectedEmail.bullJobId}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Message Body:</span>
                <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto font-sans leading-relaxed">
                  {selectedEmail.body}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Indexed in Elasticsearch cluster</span>
                <a
                  href="https://ethereal.email/messages"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  View in Ethereal Mailbox
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
