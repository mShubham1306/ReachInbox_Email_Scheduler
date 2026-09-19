import { LogOut, Mail, Home } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onCompose: () => void;
}

export function Header({ user, onLogout, onCompose }: HeaderProps) {
  return (
    <header className="glass-nav sticky top-0 z-40 border-b border-white/5 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-18">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              ReachInbox<span className="text-brand-400 text-xs px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 font-mono">AI</span>
            </span>
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Landing Page link */}
          <a
            href="/"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Landing
          </a>



          {/* Compose button */}
          <button
            onClick={onCompose}
            className="btn-shimmer bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Mail className="w-4 h-4" />
            <span>New Campaign</span>
          </button>

          {/* User avatar + info */}
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full ring-2 ring-brand-500/30 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {user.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block leading-tight text-left">
              <div className="text-xs font-semibold text-white truncate max-w-[140px]">{user.name}</div>
              <div className="text-[11px] text-slate-400 truncate max-w-[140px] font-mono">{user.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

