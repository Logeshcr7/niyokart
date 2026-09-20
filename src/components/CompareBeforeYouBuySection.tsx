import React, { useState } from 'react';
import {
  Plus,
  X,
  Scale,
  Award,
  Sliders,
  Bookmark,
  Check,
  Zap,
  ShoppingBag,
  Sparkles,
  Database,
  ArrowUpDown,
} from 'lucide-react';
import { PhoneSpecs, AlgorithmWeights, calculateAlgorithmScore, formatINR } from '../data/phones.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface CompareBeforeYouBuySectionProps {
  comparedPhones: PhoneSpecs[];
  weights: AlgorithmWeights;
  onRemovePhone: (phoneId: string) => void;
  onOpenAddPhoneModal: () => void;
  onOpenAlgorithmModal: () => void;
  onAddToCart: (phone: PhoneSpecs) => void;
  onSaveToPostgres: () => void;
  isSaving: boolean;
}

export const CompareBeforeYouBuySection: React.FC<CompareBeforeYouBuySectionProps> = ({
  comparedPhones,
  weights,
  onRemovePhone,
  onOpenAddPhoneModal,
  onOpenAlgorithmModal,
  onAddToCart,
  onSaveToPostgres,
  isSaving,
}) => {
  const { dbUser, token } = useAuth();
  const [highlightDifferences, setHighlightDifferences] = useState(false);

  // Compute live algorithm score for each phone
  const scoredPhones = comparedPhones.map((phone) => ({
    ...phone,
    calculatedScore: calculateAlgorithmScore(phone, weights),
  }));

  // Find the algorithmic winner
  const highestScore = Math.max(...scoredPhones.map((p) => p.calculatedScore), 0);

  return (
    <section id="compare-section" className="mt-14 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-1.5">
            <Scale className="h-3.5 w-3.5" />
            <span>Algorithmic Spec Evaluation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Compare Before You Buy
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Weigh the specs side-by-side to make the smartest purchasing decision
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAlgorithmModal}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-500 hover:bg-slate-50"
            title="Adjust algorithm weights for performance, camera, battery, and display"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-600" />
            <span>Calibrate Algorithm</span>
          </button>

          {comparedPhones.length > 0 && (
            <button
              onClick={onSaveToPostgres}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
              title="Persist this comparison to Cloud SQL PostgreSQL database"
            >
              <Database className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isSaving ? 'Saving...' : 'Save to PostgreSQL'}</span>
            </button>
          )}

          <button
            onClick={onOpenAddPhoneModal}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Phone to Compare</span>
          </button>
        </div>
      </div>

      {comparedPhones.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Scale className="h-7 w-7" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900">No phones selected for comparison</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Choose any 2 to 4 devices from our catalog to analyze detailed benchmarks and algorithmic scores side by side.
          </p>
          <button
            onClick={onOpenAddPhoneModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Smartphones Now</span>
          </button>
        </div>
      ) : (
        /* Comparison Table matching Figma layout */
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            {/* Table Header: Devices & Photos */}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                {/* First Column Header: Specification Label */}
                <th className="w-56 p-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-black tracking-tight text-slate-900 normal-case">
                      Specification
                    </span>
                    <span className="text-[11px] font-normal text-slate-400 normal-case">
                      {comparedPhones.length} devices evaluated
                    </span>
                  </div>
                </th>

                {/* Device Columns */}
                {scoredPhones.map((phone) => {
                  const isWinner = phone.calculatedScore === highestScore && highestScore > 0;

                  return (
                    <th key={phone.id} className="min-w-[200px] p-4 align-top font-normal">
                      <div className="relative flex flex-col items-center text-center">
                        {/* Remove Phone Button (X) */}
                        <button
                          onClick={() => onRemovePhone(phone.id)}
                          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-rose-100 hover:text-rose-600"
                          title={`Remove ${phone.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        {/* Algorithmic Winner Flag */}
                        {isWinner && (
                          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black text-amber-600">
                            <Award className="h-3 w-3" />
                            <span>ALGO WINNER</span>
                          </div>
                        )}

                        {/* Phone Thumbnail */}
                        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl bg-white p-2">
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

                        {/* Name & Brand */}
                        <span className="mt-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {phone.brand}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{phone.name}</h4>

                        {/* Price */}
                        <p className="mt-1 font-mono text-sm font-black text-slate-900">
                          {formatINR(phone.price)}
                        </p>

                        {/* Buy Now Button */}
                        <button
                          onClick={() => onAddToCart(phone)}
                          className="mt-2.5 flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Spec Rows */}
            <tbody className="divide-y divide-slate-100">
              {/* Row 1: Algorithmic Match Score */}
              <tr className="bg-blue-50/40">
                <td className="p-4 font-bold text-blue-900">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span>Algorithmic Score</span>
                  </div>
                  <p className="text-[10px] font-normal text-slate-500 mt-0.5">
                    Weighted benchmark out of 100
                  </p>
                </td>
                {scoredPhones.map((phone) => (
                  <td key={phone.id} className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-xl font-black text-blue-600">{phone.calculatedScore}</span>
                        <span className="text-xs text-slate-400">/ 100</span>
                      </div>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${phone.calculatedScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 2: Display */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-700">Display</td>
                {scoredPhones.map((phone) => (
                  <td key={phone.id} className="p-4 text-slate-800">
                    <p className="font-semibold">{phone.details.screenSize}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{phone.details.resolution}</p>
                    <p className="text-blue-600 text-[10px] font-semibold mt-0.5">
                      {phone.details.refreshRate} • {phone.details.peakBrightness}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Row 3: Processor */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-700">Processor</td>
                {scoredPhones.map((phone) => (
                  <td key={phone.id} className="p-4 text-slate-800">
                    <p className="font-semibold text-slate-900">{phone.details.processor}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      AnTuTu: <strong className="text-slate-700">{phone.details.antutuScore.toLocaleString()}</strong>
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Geekbench: {phone.details.geekbenchSingle} / {phone.details.geekbenchMulti}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Row 4: RAM / Storage */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-700">RAM / Storage</td>
                {scoredPhones.map((phone) => (
                  <td key={phone.id} className="p-4 text-slate-800">
                    <p className="font-semibold">{phone.details.ram}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{phone.details.storage}</p>
                  </td>
                ))}
              </tr>

              {/* Row 5: Battery */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-700">Battery & Charging</td>
                {scoredPhones.map((phone) => (
                  <td key={phone.id} className="p-4 text-slate-800">
                    <p className="font-semibold">{phone.details.batteryCapacity}</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">{phone.details.wiredCharging}</p>
                    {phone.details.wirelessCharging !== 'No' && (
                      <p className="text-emerald-600 text-[10px] font-medium mt-0.5">
                        Wireless: {phone.details.wirelessCharging}
                      </p>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 6: Camera */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-700">Camera</td>
                {scoredPhones.map((phone) => (
                  <td key={phone.id} className="p-4 text-slate-800">
                    <p className="font-semibold text-slate-900">{phone.details.mainCamera}</p>
                    {phone.details.telephotoCamera !== 'None' && (
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Telephoto: {phone.details.telephotoCamera}
                      </p>
                    )}
                    <p className="text-slate-500 text-[11px]">
                      Selfie: {phone.details.selfieCamera}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Row 7: Software & Support */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-700">OS & Durability</td>
                {scoredPhones.map((phone) => (
                  <td key={phone.id} className="p-4 text-slate-800">
                    <p className="font-semibold">{phone.details.os}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{phone.details.ipRating}</p>
                    <p className="text-blue-600 text-[10px] font-medium">
                      {phone.details.updateSupportYears} Years OS Updates
                    </p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
