import React, { useState } from 'react';
import { X, ShieldCheck, Database, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredForAction?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, requiredForAction }) => {
  const { signInWithGoogle, signInDemo, loading, error } = useAuth();
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [useCustomDemo, setUseCustomDemo] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    onClose();
  };

  const handleDemoLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await signInDemo(demoEmail || undefined, demoName || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Top brand blue accent line */}
        <div className="h-1.5 w-full bg-blue-600" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header with Niyo Kart & PostgreSQL icon */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-black tracking-tight text-slate-900">Niyo</span>
                <span className="text-lg font-black tracking-tight text-blue-600">Kart</span>
              </div>
              <h2 className="text-base font-bold text-slate-900">PostgreSQL Account Sign In</h2>
              <p className="text-xs text-slate-500">Cloud SQL (asia-southeast1) + Firebase</p>
            </div>
          </div>

          {requiredForAction && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800">
              {requiredForAction}
            </div>
          )}

          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
            Sign in to store your smartphone battle arena comparisons, algorithm weight calibrations, and device bookmarks directly into the relational <strong className="text-slate-900">Cloud SQL PostgreSQL</strong> database.
          </p>

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <p className="font-semibold">Authentication Notice:</p>
              <p className="mt-0.5">{error}</p>
            </div>
          )}

          {/* Login Actions */}
          <div className="mt-6 space-y-3">
            {/* Google Sign-In */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-blue-500 active:scale-95 disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or Instant Preview Login
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Quick 1-Click Test User Login */}
            {!useCustomDemo ? (
              <button
                onClick={() => handleDemoLogin()}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>1-Click Test Reviewer (PostgreSQL)</span>
              </button>
            ) : (
              <form onSubmit={handleDemoLogin} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Reviewer Name</label>
                  <input
                    type="text"
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Reviewer Email</label>
                  <input
                    type="email"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="e.g. alex@techradar.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  Create & Login to PostgreSQL
                </button>
              </form>
            )}

            <button
              onClick={() => setUseCustomDemo(!useCustomDemo)}
              className="w-full text-center text-[11px] font-medium text-slate-500 hover:text-blue-600"
            >
              {useCustomDemo ? '← Back to quick 1-click test' : 'Need custom reviewer credentials?'}
            </button>
          </div>

          {/* Security & Database notice */}
          <div className="mt-6 border-t border-slate-100 pt-4 space-y-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Token verification via Firebase Admin in Node.js server</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Direct upsert and query handling with Drizzle ORM in PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
