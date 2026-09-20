import React from 'react';
import { ShoppingBag, CreditCard, Sparkles } from 'lucide-react';
import { PhoneSpecs } from '../data/phones.ts';

interface GrandLaunchBannerProps {
  phone?: PhoneSpecs;
  onAddToCart: (phone: PhoneSpecs) => void;
  onCompare: (phone: PhoneSpecs) => void;
}

export const GrandLaunchBanner: React.FC<GrandLaunchBannerProps> = ({
  phone,
  onAddToCart,
  onCompare,
}) => {
  if (!phone) return null;

  return (
    <section className="mt-14">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-10 text-white shadow-xl shadow-slate-950/15">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Left info */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>GRAND LAUNCH SPECIAL</span>
            </div>

            <h3 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              The All-New Powerhouse: <span className="text-amber-400">Nord CE 4 Lite 5G</span>
            </h3>

            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Starting from <strong className="text-white font-bold">₹19,999*</strong>. Grab extra ₹2,000 launch coupon discount today with Sony LYT-600 50MP OIS sensor & 5,500 mAh battery.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onAddToCart(phone)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-400 active:scale-95"
              >
                <ShoppingBag className="h-4 w-4 text-slate-950" />
                <span>Buy Now</span>
              </button>

              <button
                onClick={() => onCompare(phone)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95"
              >
                <span>Add to Comparison</span>
              </button>

              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-300">
                <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                <span>SBI Card 10% Off</span>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="flex justify-center md:justify-end">
            <div className="relative flex h-52 w-52 sm:h-64 sm:w-64 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-2xl backdrop-blur">
              <img
                src={phone.image}
                alt={phone.name}
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                NEW
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
