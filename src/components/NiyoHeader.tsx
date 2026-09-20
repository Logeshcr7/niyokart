import React, { useState } from 'react';
import {
  MapPin,
  Smartphone,
  PhoneCall,
  Search,
  Scale,
  User,
  ShoppingCart,
  Sliders,
  Database,
  LogOut,
  Bookmark,
  Check,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { formatINR } from '../data/phones.ts';

interface NiyoHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  compareCount: number;
  onOpenCompare: () => void;
  onOpenAlgorithm: () => void;
  onOpenCart: () => void;
  onOpenLogin: () => void;
  onOpenSaved: () => void;
  onOpenAdmin: () => void;
  cartCount: number;
  cartTotal: number;
  isDeveloper?: boolean;
  onExitDeveloperMode?: () => void;
}

export const NiyoHeader: React.FC<NiyoHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  compareCount,
  onOpenCompare,
  onOpenAlgorithm,
  onOpenCart,
  onOpenLogin,
  onOpenSaved,
  onOpenAdmin,
  cartCount,
  cartTotal,
  isDeveloper = false,
  onExitDeveloperMode,
}) => {
  const { dbUser, signOutUser, token } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [pincode, setPincode] = useState('Mumbai 400001');
  const [editingPincode, setEditingPincode] = useState(false);

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditingPincode(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      {/* 1. Top Utility / Announcement Bar */}
      <div className="border-b border-slate-100 bg-slate-50 text-[11px] text-slate-600">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6">
          {/* Left Info */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <span>Deliver to</span>
              {editingPincode ? (
                <form onSubmit={handlePincodeSubmit} className="inline-flex items-center">
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="rounded border border-blue-500 bg-white px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none"
                    autoFocus
                    onBlur={() => setEditingPincode(false)}
                  />
                </form>
              ) : (
                <button
                  onClick={() => setEditingPincode(true)}
                  className="font-bold text-slate-900 hover:text-blue-600 hover:underline"
                >
                  {pincode}
                </button>
              )}
            </div>

            <div className="hidden items-center gap-1 sm:flex text-slate-500">
              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
              <span className="hover:text-blue-600 cursor-pointer">Download App</span>
            </div>
          </div>

          {/* Right Info */}
          <div className="flex items-center gap-3 sm:gap-5">
            {isDeveloper && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-100/90 hover:bg-indigo-200/90 px-2.5 py-0.5 rounded-full border border-indigo-300 transition shadow-xs"
                  title="Developer Backend: Ingest phones via image & AI"
                >
                  <Sparkles className="h-3 w-3 text-indigo-600" />
                  <span>Developer Backend</span>
                </button>
                {onExitDeveloperMode && (
                  <button
                    onClick={onExitDeveloperMode}
                    className="text-[10px] text-slate-400 hover:text-rose-600 hover:underline px-1"
                    title="Exit Developer Mode to preview as regular user"
                  >
                    (Exit Dev)
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onOpenAlgorithm}
              className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
            >
              <Sliders className="h-3 w-3" />
              <span>Algorithm Matrix</span>
            </button>

            <span className="hidden cursor-pointer hover:text-blue-600 sm:inline">Become a Seller</span>

            <div className="flex items-center gap-1 font-medium text-slate-700">
              <PhoneCall className="h-3 w-3 text-slate-400" />
              <span>Customer Care: <strong className="text-slate-900">1800-NIYO-KART</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Brand Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand Logo: Niyo Kart */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            {/* Logo Icon with Blue Square and 'N' emblem */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25 transition group-hover:scale-105">
              <span className="text-xl font-black tracking-tighter">N</span>
              <span className="h-2 w-2 rounded-full bg-amber-400 -ml-0.5 -mt-2"></span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black tracking-tight text-slate-900">Niyo</span>
                <span className="text-2xl font-black tracking-tight text-blue-600">Kart</span>
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase -mt-1">
                Algorithm & Mobile Store
              </p>
            </div>
          </a>
        </div>

        {/* Center: Search Bar */}
        <div className="relative flex-1 max-w-xl mx-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600/10">
            <Search className="ml-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search for mobiles, brands and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mr-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
            <button className="m-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
              Search
            </button>
          </div>
        </div>

        {/* Right Controls: Compare, Login / Sign Up, My Cart, and Developer Backend (if authorized) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Developer Backend Button - ONLY visible on authorized developer system */}
          {isDeveloper && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50/90 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-400 active:scale-95 shadow-sm"
              title="Developer Backend: Ingest phones via image & AI, draft or publish to live store"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="hidden sm:inline">Developer Backend</span>
            </button>
          )}

          {/* Compare Link */}
          <button
            onClick={onOpenCompare}
            className="relative flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600"
            title="Open Spec Comparison Arena"
          >
            <Scale className="h-4 w-4 text-blue-600" />
            <span className="hidden md:inline">Compare</span>
            {compareCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {compareCount}
              </span>
            )}
          </button>

          {/* Login / User Status */}
          {token && dbUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {dbUser.displayName?.[0] || 'U'}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline font-semibold">
                  {dbUser.displayName || 'Account'}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{dbUser.displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{dbUser.email}</p>
                    <span className="mt-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      PostgreSQL Connected
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenSaved();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-blue-600" />
                    <span>Saved Comparisons</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenAlgorithm();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Sliders className="h-3.5 w-3.5 text-blue-600" />
                    <span>Custom Weight Presets</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOutUser();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 rounded-xl border border-blue-600 px-3.5 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
            >
              <User className="h-4 w-4" />
              <span>Login / Sign Up</span>
            </button>
          )}

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-800"
          >
            <div className="relative">
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-extrabold text-slate-950">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[9px] font-medium text-slate-300 -mb-0.5">My Cart</p>
              <p className="font-mono text-xs text-white">{formatINR(cartTotal)}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
