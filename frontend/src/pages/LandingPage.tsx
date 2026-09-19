import { Mail, Clock, Users, CheckCircle, Send, UploadCloud, CalendarClock, Star } from 'lucide-react';

export function LandingPage() {
  const handleGetStarted = () => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden selection:bg-brand-500/30 selection:text-brand-200">
      {/* Subtle background gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-radial-brand pointer-events-none opacity-60" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 glass-nav">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">ReachInbox</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </nav>

          {/* CTA */}
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 bg-white text-slate-950 hover:bg-slate-100 font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-32 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-xs font-medium text-slate-300 mb-8">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          Trusted for email outreach campaigns
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Send emails to{' '}
          <span className="text-gradient-brand">thousands of people,</span>{' '}
          automatically.
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Upload your contact list, write your message, pick a time — and we handle the rest.
          No technical knowledge needed.
        </p>

        <button
          onClick={handleGetStarted}
          className="btn-shimmer inline-flex items-center gap-3 bg-white text-slate-950 hover:bg-slate-100 font-bold px-8 py-4 rounded-2xl shadow-xl transition-all active:scale-95 text-base"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Get Started Free — Sign in with Google
        </button>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            As simple as <span className="text-gradient-brand">1 – 2 – 3</span>
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Set up your first campaign in under 5 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              Icon: UploadCloud,
              color: 'text-brand-400',
              bg: 'bg-brand-500/10 border-brand-500/20',
              title: 'Upload your contacts',
              desc: "Drag and drop a CSV file or paste email addresses. We'll handle duplicates automatically.",
            },
            {
              step: '2',
              Icon: Send,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
              title: 'Write your email',
              desc: "Type your subject and message. Preview exactly how it will look in the recipient's inbox.",
            },
            {
              step: '3',
              Icon: CalendarClock,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
              title: 'Pick a schedule & send',
              desc: "Choose when to start sending and how many emails per hour. Hit send — we do the rest.",
            },
          ].map(({ step, Icon, color, bg, title, desc }) => (
            <div key={step} className="glass-card glass-card-hover p-8 rounded-3xl border border-slate-800 relative">
              <div className="absolute top-6 right-6 text-5xl font-black text-slate-800/60 select-none">{step}</div>
              <div className={`w-12 h-12 rounded-2xl ${bg} border flex items-center justify-center ${color} mb-6`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything you need to <span className="text-gradient-brand">reach more people</span>
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Built for people who want results, not complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              Icon: CheckCircle,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
              title: 'Every email gets delivered',
              desc: "We make sure no email is sent twice or lost — even if there's a connection issue.",
            },
            {
              Icon: Clock,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20',
              title: 'Send at the perfect time',
              desc: 'Schedule emails to go out exactly when you want — morning, evening, or a specific date.',
            },
            {
              Icon: Users,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
              title: 'Send to 1,000+ people at once',
              desc: "Upload a big contact list and we'll send emails in batches, so your messages land in inboxes — not spam.",
            },
            {
              Icon: Mail,
              color: 'text-brand-400',
              bg: 'bg-brand-500/10 border-brand-500/20',
              title: 'Track what you\'ve sent',
              desc: 'See all your sent emails in one place. Search by name or email address instantly.',
            },
          ].map(({ Icon, color, bg, title, desc }) => (
            <div key={title} className="glass-card glass-card-hover p-8 rounded-3xl border border-slate-800 flex gap-5">
              <div className={`w-12 h-12 shrink-0 rounded-2xl ${bg} border flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 max-w-3xl mx-auto text-center">
        <div className="glass-card rounded-3xl border border-slate-800 p-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to start sending?
          </h2>
          <p className="text-slate-400 text-base mb-8">
            Sign in with your Google account — it takes less than a minute.
          </p>
          <button
            onClick={handleGetStarted}
            className="btn-shimmer inline-flex items-center gap-3 bg-white text-slate-950 hover:bg-slate-100 font-bold px-8 py-4 rounded-2xl shadow-xl transition-all active:scale-95 text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Get Started Free
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Mail className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-white">ReachInbox</span>
            <span>— Automated Email Campaigns</span>
          </div>
          <div className="flex items-center gap-6 text-slate-500">
            <span onClick={handleGetStarted} className="hover:text-slate-300 cursor-pointer transition-colors">
              Sign In
            </span>
            <a href="#how-it-works" className="hover:text-slate-300 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
