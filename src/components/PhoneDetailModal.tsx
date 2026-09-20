import React from 'react';
import {
  X,
  Plus,
  Check,
  Heart,
  Cpu,
  Camera,
  Battery,
  Monitor,
  BadgeDollarSign,
  Shield,
  Layers,
  Zap,
  ShoppingBag,
  Scale,
  Star,
} from 'lucide-react';
import { PhoneSpecs, AlgorithmWeights, calculateAlgorithmScore, formatINR } from '../data/phones.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PhoneDetailModalProps {
  phone: PhoneSpecs | null;
  weights: AlgorithmWeights;
  onClose: () => void;
  isSelected: boolean;
  onToggleSelect: (phoneId: string) => void;
  onAddToCart: (phone: PhoneSpecs) => void;
  openLoginModal: () => void;
}

export const PhoneDetailModal: React.FC<PhoneDetailModalProps> = ({
  phone,
  weights,
  onClose,
  isSelected,
  onToggleSelect,
  onAddToCart,
  openLoginModal,
}) => {
  const { favorites, toggleFavorite, token } = useAuth();

  if (!phone) return null;

  const isFavorited = favorites.includes(phone.id);
  const score = calculateAlgorithmScore(phone, weights);

  const handleFavoriteClick = async () => {
    if (!token) {
      openLoginModal();
      return;
    }
    await toggleFavorite(phone.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Top brand blue line */}
        <div className="h-1.5 w-full bg-blue-600" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Top Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Phone Image */}
            <div className="sm:col-span-5 flex h-48 items-center justify-center rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <img
                src={phone.image}
                alt={phone.name}
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>

            {/* Info and Actions */}
            <div className="sm:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                    {phone.brand}
                  </span>
                  {phone.storeSource && (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                      Verified {phone.storeSource}
                    </span>
                  )}
                  {phone.badge && (
                    <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                      {phone.badge}
                    </span>
                  )}
                </div>

                <h2 className="mt-1 text-xl font-black text-slate-900">{phone.name}</h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{phone.tagline}</p>

                {/* Rating */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    <span>{phone.rating || 4.5}</span>
                    <Star className="h-2.5 w-2.5 fill-white" />
                  </div>
                  <span className="text-xs text-slate-500">
                    ({phone.ratingCount ? phone.ratingCount.toLocaleString('en-IN') : '1,200'} ratings)
                  </span>
                </div>

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-black text-slate-900">
                    {formatINR(phone.price)}
                  </span>
                  {phone.originalPrice && (
                    <span className="text-sm text-slate-400 line-through font-mono">
                      {formatINR(phone.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Buy Now & Add to Compare */}
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    onAddToCart(phone);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Buy Now</span>
                </button>

                <button
                  onClick={() => onToggleSelect(phone.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isSelected ? <Check className="h-4 w-4 text-blue-600" /> : <Scale className="h-4 w-4" />}
                  <span>{isSelected ? 'In Comparison' : 'Add to Compare'}</span>
                </button>

                <button
                  onClick={handleFavoriteClick}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    isFavorited
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-slate-200 bg-white text-slate-400 hover:text-rose-600'
                  }`}
                  title={isFavorited ? 'Remove bookmark' : 'Save bookmark to PostgreSQL'}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Algorithmic Match Score Card */}
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">
                Algorithmic Match Score
              </span>
              <span className="font-mono text-lg font-black text-blue-600">{score} / 100</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              Dynamically derived from your active weighting matrix for Performance, Camera, Battery, Display, and Bang-for-buck.
            </p>
          </div>

          {/* Specifications Breakdown */}
          <div className="mt-6">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              Full Technical Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="font-bold text-slate-900 block">Display</span>
                <span className="text-slate-600 mt-0.5 block">{phone.details.screenSize} ({phone.details.displayType})</span>
                <span className="text-slate-400 text-[11px] block">{phone.details.refreshRate} • {phone.details.peakBrightness}</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="font-bold text-slate-900 block">Processor & Compute</span>
                <span className="text-slate-600 mt-0.5 block">{phone.details.processor}</span>
                <span className="text-slate-400 text-[11px] block">AnTuTu: {phone.details.antutuScore.toLocaleString()}</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="font-bold text-slate-900 block">RAM & Storage</span>
                <span className="text-slate-600 mt-0.5 block">{phone.details.ram}</span>
                <span className="text-slate-400 text-[11px] block">{phone.details.storage}</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="font-bold text-slate-900 block">Battery & Charging</span>
                <span className="text-slate-600 mt-0.5 block">{phone.details.batteryCapacity}</span>
                <span className="text-slate-400 text-[11px] block">{phone.details.wiredCharging}</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-2">
                <span className="font-bold text-slate-900 block">Cameras</span>
                <span className="text-slate-600 mt-0.5 block">{phone.details.mainCamera}</span>
                {phone.details.telephotoCamera !== 'None' && (
                  <span className="text-slate-500 text-[11px] block mt-0.5">Telephoto: {phone.details.telephotoCamera}</span>
                )}
                <span className="text-slate-400 text-[11px] block">Selfie: {phone.details.selfieCamera}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
