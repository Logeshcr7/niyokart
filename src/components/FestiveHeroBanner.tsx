import React from 'react';
import { Sparkles, ArrowRight, Scale, ShieldCheck, Zap } from 'lucide-react';

interface FestiveHeroBannerProps {
  onExploreDeals: () => void;
  onCompareFlagships: () => void;
}

export const FestiveHeroBanner: React.FC<FestiveHeroBannerProps> = ({
  onExploreDeals,
  onCompareFlagships,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl shadow-slate-950/20">
      {/* Subtle ambient lighting glows */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 py-10 sm:px-10 md:grid-cols-12 md:py-14">
        {/* Left Copy & Actions */}
        <div className="md:col-span-7 lg:col-span-7">
          {/* Badge: LIMITED TIME FESTIVE OFFER */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>LIMITED TIME FESTIVE OFFER</span>
          </div>

          {/* Heading */}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Flagship Phones <span className="text-amber-400">Fest</span>
          </h1>

          {/* Subheading */}
          <p className="mt-2 text-xl font-bold text-amber-300 sm:text-2xl">
            Up to 40% Off
          </p>

          {/* Description */}
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Get crazy exchange bonuses, no-cost EMI up to 12 months, and instant 10% bank discount on major credit cards. Compare algorithm scores before checking out.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3.5">
            <button
              onClick={onExploreDeals}
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-white/10 transition hover:bg-slate-100 active:scale-95"
            >
              <span>Explore Deals</span>
              <ArrowRight className="h-4 w-4 text-slate-950" />
            </button>

            <button
              onClick={onCompareFlagships}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-100 backdrop-blur transition hover:border-slate-500 hover:bg-slate-700 active:scale-95"
            >
              <Scale className="h-4 w-4 text-blue-400" />
              <span>Compare Premium Models</span>
            </button>
          </div>

          {/* Trust points */}
          <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-slate-800/80 pt-5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>100% Brand Sealed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Next Day Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">PostgreSQL</span>
              <span>Cloud Sync</span>
            </div>
          </div>
        </div>

        {/* Right Art: Flagship Devices Visual Mockup */}
        <div className="relative md:col-span-5 lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm">
            {/* Phone Showcase Frame */}
            <div className="relative mx-auto rounded-3xl border-4 border-slate-700/60 bg-gradient-to-b from-slate-800 to-slate-900 p-2 shadow-2xl shadow-blue-500/20">
              <div className="overflow-hidden rounded-2xl bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=700&q=80"
                  alt="Flagship Showcase"
                  className="h-64 sm:h-72 w-full object-cover object-center transition duration-500 hover:scale-105"
                />
                <div className="p-3 bg-slate-900/90 backdrop-blur flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Trending #1</span>
                    <p className="text-xs font-bold text-white">Galaxy S24 Ultra</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 line-through">₹1,34,999</span>
                    <p className="text-xs font-bold text-amber-400">₹1,09,999</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Algorithmic Winner Badge */}
            <div className="absolute -bottom-3 -left-4 rounded-xl border border-blue-500/30 bg-slate-900/95 p-2.5 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">
                  96
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-200">Algorithmic Score</p>
                  <p className="text-[9px] text-emerald-400 font-medium">Top Benchmark Rated</p>
                </div>
              </div>
            </div>

            {/* Floating Discount Tag */}
            <div className="absolute -top-3 -right-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-slate-950 shadow-lg">
              18% OFF
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
