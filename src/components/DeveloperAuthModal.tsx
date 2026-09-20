import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, X, KeyRound, Terminal } from 'lucide-react';

interface DeveloperAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  verifyCode: (code: string) => boolean;
}

export const DeveloperAuthModal: React.FC<DeveloperAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  verifyCode,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ok = verifyCode(passcode);
    if (ok) {
      setPasscode('');
      onSuccess();
    } else {
      setError('Invalid developer credentials. Please enter your developer passcode or developer email.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Developer Backend Access</h3>
            <p className="text-xs text-slate-400">Restricted to authorized system administrator</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
          <div className="flex items-start gap-2">
            <Terminal className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              This portal allows the developer to ingest smartphones with Gemini AI and publish them live to user storefronts.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Developer Passcode or Registered Email
            </label>
            <div className="relative">
              <input
                type="password"
                autoFocus
                placeholder="Enter passcode (e.g. admin2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Default developer key: <code className="text-indigo-300 font-mono">admin2026</code> or developer email
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
            >
              Unlock Backend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
