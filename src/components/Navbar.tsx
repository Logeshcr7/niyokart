import React, { useState } from 'react';
import {
  Scale,
  Sliders,
  Smartphone,
  Bookmark,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ActiveTab } from '../types/index.ts';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedPhoneCount: number;
  openLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedPhoneCount,
  openLoginModal,
}) => {
  const { dbUser, signOutUser, stats } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('arena')}
            className="flex cursor-pointer items-center gap-2.5 transition-transform hover:scale-102"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Scale className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white">ALGO</span>
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-xs font-semibold tracking-wide text-cyan-300">
                  MOBILE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Algorithmic Spec & Benchmark Intelligence</p>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 md:flex">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>PostgreSQL Active</span>
          </div>
        </div>

        {/* Center Nav tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          <button
            onClick={() => setActiveTab('arena')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'arena'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>Battle Arena</span>
            {selectedPhoneCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-bold text-cyan-200">
                {selectedPhoneCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Phone Ranks</span>
          </button>

          <button
            onClick={() => setActiveTab('algorithm')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'algorithm'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Algorithm Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'saved'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>Saved ({stats.savedComparisonsCount})</span>
          </button>
        </nav>

        {/* Right Auth controls */}
        <div className="flex items-center gap-2.5">
          {dbUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 transition hover:border-cyan-500/50"
              >
                {dbUser.photoUrl ? (
                  <img
                    src={dbUser.photoUrl}
                    alt={dbUser.displayName || 'User'}
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-cyan-400/50"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600/30 text-xs font-bold text-cyan-300">
                    {(dbUser.displayName || dbUser.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden text-xs font-medium text-slate-200 sm:inline-block max-w-[120px] truncate">
                  {dbUser.displayName || dbUser.email.split('@')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in">
                  <div className="border-b border-slate-800 px-3 py-2">
                    <p className="text-xs font-semibold text-white truncate">{dbUser.displayName || 'User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{dbUser.email}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Synced to Cloud SQL</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('saved');
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Bookmark className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Saved Comparisons</span>
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                        {stats.savedComparisonsCount}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('algorithm');
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="h-3.5 w-3.5 text-amber-400" />
                        <span>Custom Presets</span>
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                        {stats.customPresetsCount}
                      </span>
                    </button>
                  </div>

                  <div className="border-t border-slate-800 pt-1">
                    <button
                      onClick={() => {
                        signOutUser();
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/25 transition hover:brightness-110 active:scale-95"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Login / Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex border-t border-slate-900 bg-slate-950 px-2 py-1.5 md:hidden justify-around">
        <button
          onClick={() => setActiveTab('arena')}
          className={`flex flex-col items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ${
            activeTab === 'arena' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Arena</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ${
            activeTab === 'catalog' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Phones</span>
        </button>

        <button
          onClick={() => setActiveTab('algorithm')}
          className={`flex flex-col items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ${
            activeTab === 'algorithm' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Weights</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex flex-col items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ${
            activeTab === 'saved' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Saved</span>
        </button>
      </div>
    </header>
  );
};
