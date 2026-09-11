import { useState, useEffect } from 'react';
import { UserPlus, ArrowRight, X, ShieldCheck, CheckCircle2, KeyRound, Globe, Chrome, Copy, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'official' | 'setup' | 'direct';
}

export function GoogleAccountChooserModal({ isOpen, onClose, defaultMode }: GoogleAccountChooserModalProps) {
  const { devLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'official' | 'setup' | 'direct'>('official');
  const [googleStatus, setGoogleStatus] = useState<{
    isConfigured: boolean;
    clientId: string | null;
    callbackUrl: string;
  }>({
    isConfigured: false,
    clientId: null,
    callbackUrl: 'http://localhost:5000/auth/google/callback',
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Setup form
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Direct login form
  const [directEmail, setDirectEmail] = useState('');
  const [directName, setDirectName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingStatus(true);
    authApi
      .getGoogleStatus()
      .then((status) => {
        setGoogleStatus(status);
        if (!status.isConfigured && (!defaultMode || defaultMode === 'official')) {
          setActiveTab('setup');
        } else if (defaultMode) {
          setActiveTab(defaultMode);
        } else {
          setActiveTab('official');
        }
      })
      .catch(() => {
        setActiveTab('direct');
      })
      .finally(() => {
        setIsLoadingStatus(false);
      });
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  const handleLaunchOfficialGoogle = () => {
    window.location.href = '/auth/google';
  };

  const handleSaveGoogleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error('Both Google Client ID and Client Secret are required');
      return;
    }

    setIsSavingConfig(true);
    try {
      const res = await authApi.configureGoogle(clientId.trim(), clientSecret.trim());
      toast.success(res.message || 'Google Cloud OAuth credentials saved!');
      window.location.href = res.authUrl || '/auth/google';
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to activate Google OAuth');
      setIsSavingConfig(false);
    }
  };

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = directEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    const name = directName.trim() || email.split('@')[0];
    setIsLoggingIn(true);

    devLogin(
      { email, name },
      {
        onSuccess: () => {
          toast.success(`Signed in as ${email}`);
          window.location.href = '/dashboard';
        },
        onError: () => {
          window.location.href = `/auth/google?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
        },
      }
    );
  };

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(googleStatus.callbackUrl);
    toast.success('Redirect URI copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Google Modal Dialog */}
      <div className="relative w-full max-w-[460px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="pt-7 px-7 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              {/* Google G Logo */}
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-bold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Official Google Chrome Sign-In
              </span>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {activeTab === 'official' && 'Launch Official Google Sign-In'}
            {activeTab === 'setup' && 'Connect Google Cloud OAuth'}
            {activeTab === 'direct' && 'Direct Email Authentication'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authenticate to manage the <span className="font-semibold text-brand-500">ReachInbox</span> scheduler.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex gap-1.5 mt-4 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('official')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'official'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Chrome className="w-3.5 h-3.5 text-blue-500" />
              Official Google
            </button>

            <button
              onClick={() => setActiveTab('setup')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'setup'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              API Credentials
            </button>

            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'direct'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
              Direct Email
            </button>
          </div>
        </div>

        {/* Tab 1: Official Google Chrome Sign-in */}
        {activeTab === 'official' && (
          <div className="p-7 space-y-5">
            {googleStatus.isConfigured ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Official Google OAuth Ready
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Client ID active: <span className="font-mono">{googleStatus.clientId}</span>
                  </p>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Click below to open the official Google Chrome account chooser dialog at <span className="font-semibold text-blue-500">accounts.google.com</span>. Chrome will automatically list all your logged-in Google accounts and allow adding new ones.
                </div>

                <button
                  onClick={handleLaunchOfficialGoogle}
                  className="w-full btn-shimmer flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-2xl py-3.5 px-5 font-bold text-sm shadow-xl transition-all active:scale-95 group"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Open Official Google Chrome Account Chooser</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    Google Cloud Client ID Required
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    To trigger official Chrome account selection with Google's native dialog, provide your Google Cloud OAuth credentials in the <strong>API Credentials</strong> tab.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('setup')}
                    className="w-1/2 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Enter Google Client ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('direct')}
                    className="w-1/2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Direct Email Sign-In
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Google Cloud Setup */}
        {activeTab === 'setup' && (
          <form onSubmit={handleSaveGoogleConfig} className="p-7 space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Google Cloud Console Instructions:</span>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 underline font-semibold"
                >
                  Open Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                1. Create an OAuth 2.0 Client ID (Web Application) <br />
                2. Set Authorized Redirect URI:
              </p>
              <div className="flex items-center justify-between bg-slate-900 text-slate-100 px-2.5 py-1.5 rounded-lg font-mono text-[11px] mt-1 border border-white/10">
                <span className="truncate">{googleStatus.callbackUrl}</span>
                <button
                  type="button"
                  onClick={copyCallbackUrl}
                  className="p-1 hover:text-brand-400 transition-colors ml-1"
                  title="Copy Redirect URI"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Google Client ID *
              </label>
              <input
                type="text"
                placeholder="e.g. 1234567890-xxx.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Google Client Secret *
              </label>
              <input
                type="password"
                placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSavingConfig ? 'Activating Credentials...' : 'Save & Launch Official Google Chrome Sign-In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Direct Email Sign-In */}
        {activeTab === 'direct' && (
          <form onSubmit={handleDirectLogin} className="p-7 space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
              Type any email address below. You will be authenticated immediately as that identity with active session and mailbox access.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Nayan"
                value={directName}
                onChange={(e) => setDirectName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Your Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. yourname@gmail.com"
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoggingIn ? 'Logging In...' : 'Sign In Now'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Security Footer */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>OAuth 2.0 RFC 6749 • Session-signed BullMQ queue credentials</span>
        </div>
      </div>
    </div>
  );
}
