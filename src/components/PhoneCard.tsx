import React from 'react';
import {
  Heart,
  Plus,
  Check,
  Cpu,
  Camera,
  Battery,
  Monitor,
  BadgeDollarSign,
  Info,
  Sparkles,
} from 'lucide-react';
import { PhoneSpecs, AlgorithmWeights, calculateAlgorithmScore } from '../data/phones.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PhoneCardProps {
  phone: PhoneSpecs;
  weights: AlgorithmWeights;
  isSelected: boolean;
  onToggleSelect: (phoneId: string) => void;
  onViewDetails: (phone: PhoneSpecs) => void;
  openLoginModal: () => void;
  rank?: number;
}

export const PhoneCard: React.FC<PhoneCardProps> = ({
  phone,
  weights,
  isSelected,
  onToggleSelect,
  onViewDetails,
  openLoginModal,
  rank,
}) => {
  const { favorites, toggleFavorite, token } = useAuth();
  const isFavorited = favorites.includes(phone.id);
  const algoScore = calculateAlgorithmScore(phone, weights);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      openLoginModal();
      return;
    }
    await toggleFavorite(phone.id);
  };

  // Determine score color badge
  const getScoreColor = (score: number) => {
    if (score >= 95) return 'from-emerald-400 to-cyan-500 text-emerald-300 border-emerald-500/30';
    if (score >= 90) return 'from-cyan-400 to-blue-500 text-cyan-300 border-cyan-500/30';
    if (score >= 85) return 'from-blue-400 to-indigo-500 text-blue-300 border-blue-500/30';
    return 'from-slate-400 to-slate-500 text-slate-300 border-slate-700';
  };

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 ${
        isSelected
          ? 'border-cyan-500 bg-slate-900/95 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/30'
          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900/90'
      }`}
    >
      {/* Top Banner / Badges */}
      <div className="relative p-5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {rank !== undefined && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                #{rank}
              </span>
            )}
            <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              {phone.brand}
            </span>
            {phone.badge && (
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                {phone.badge}
              </span>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className={`rounded-full p-2 transition hover:scale-110 ${
              isFavorited
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-slate-800/60 text-slate-400 hover:text-rose-400'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Save to PostgreSQL favorites'}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Phone Preview Image & Score Header */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-950 p-1 border border-slate-800">
            <img
              src={phone.image}
              alt={phone.name}
              className="h-full w-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Algorithm Score
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${getScoreColor(
                  algoScore
                )}`}
              >
                {algoScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/100</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 font-mono mt-1">
              ${phone.price.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">MSRP</span>
          </div>
        </div>

        {/* Phone Name & Tagline */}
        <div className="mt-3">
          <h3
            onClick={() => onViewDetails(phone)}
            className="cursor-pointer text-base font-bold text-white transition hover:text-cyan-400 line-clamp-1"
          >
            {phone.name}
          </h3>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {phone.tagline}
          </p>
        </div>
      </div>

      {/* Algorithmic Pillars Breakdown */}
      <div className="mt-4 px-5 space-y-2 border-t border-slate-800/80 pt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="h-3 w-3 text-indigo-400" />
            <span>Perf</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
              <div
                style={{ width: `${phone.scores.performance}%` }}
                className="h-full rounded-full bg-indigo-500"
              />
            </div>
            <span className="font-mono text-slate-300 font-semibold">{phone.scores.performance}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Camera className="h-3 w-3 text-rose-400" />
            <span>Camera</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
              <div
                style={{ width: `${phone.scores.camera}%` }}
                className="h-full rounded-full bg-rose-500"
              />
            </div>
            <span className="font-mono text-slate-300 font-semibold">{phone.scores.camera}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Battery className="h-3 w-3 text-emerald-400" />
            <span>Battery</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
              <div
                style={{ width: `${phone.scores.battery}%` }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
            <span className="font-mono text-slate-300 font-semibold">{phone.scores.battery}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Monitor className="h-3 w-3 text-amber-400" />
            <span>Display</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
              <div
                style={{ width: `${phone.scores.display}%` }}
                className="h-full rounded-full bg-amber-500"
              />
            </div>
            <span className="font-mono text-slate-300 font-semibold">{phone.scores.display}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <BadgeDollarSign className="h-3 w-3 text-teal-400" />
            <span>Value</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
              <div
                style={{ width: `${phone.scores.value}%` }}
                className="h-full rounded-full bg-teal-400"
              />
            </div>
            <span className="font-mono text-slate-300 font-semibold">{phone.scores.value}</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-5 border-t border-slate-800 bg-slate-950/50 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSelect(phone.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
              isSelected
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 hover:bg-cyan-600'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:border-cyan-500/50 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>In Comparison</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Add to Compare</span>
              </>
            )}
          </button>

          <button
            onClick={() => onViewDetails(phone)}
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            title="Inspect full benchmark & hardware specs"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
