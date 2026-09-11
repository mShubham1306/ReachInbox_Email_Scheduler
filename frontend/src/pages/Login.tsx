import { useState, useEffect } from 'react';
import { Mail, Sparkles, ArrowRight, ShieldCheck, Chrome } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleAccountChooserModal } from '../components/GoogleAccountChooserModal';
import { authApi } from '../services/api';

export function Login() {
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'official' | 'setup' | 'direct'>('official');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      toast.error(`Sign in error: ${decodeURIComponent(errorParam)}`);
    }
    if (params.get('setup_google') === 'true') {
      setModalMode('setup');
      setIsChooserOpen(true);
    }
  }, []);

  const handleGoogleClick = () => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden bg-grid-pattern selection:bg-brand-500/30 selection:text-brand-200">
      {/* Ambient background glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-radial-brand pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[400px] bg-radial-purple pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md glass-card rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Logo & Pill */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/25 ring-1 ring-white/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                ReachInbox<span className="text-brand-400 text-xs px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 font-mono">AI</span>
              </h1>
              <p className="text-xs text-slate-400">Autonomous Email Scheduler</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            Welcome to the Engine
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Sign in with your official Google account to access your high-throughput outreach dashboard and queue monitor.
          </p>
        </div>

        {/* Primary Google Login Button */}
        <button
          onClick={handleGoogleClick}
          className="w-full btn-shimmer flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl py-3.5 px-5 font-semibold text-sm shadow-xl transition-all active:scale-95 group mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Sign in with Google</span>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
        </button>

        {/* Feature badge */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3 text-xs text-slate-400 mb-6">
          <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span>Includes Google Account Chooser & multiple session selection</span>
        </div>

        {/* Back to landing link */}
        <div className="text-center pt-2">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-brand-400 transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Landing Page & Architecture
          </a>
        </div>

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>BullMQ Redis Queue • PostgreSQL ACID Idempotency</span>
        </div>
      </div>

      {/* Google Account Picker Modal */}
      <GoogleAccountChooserModal
        isOpen={isChooserOpen}
        onClose={() => setIsChooserOpen(false)}
        defaultMode={modalMode}
      />
    </div>
  );
}
