import React, { useState } from 'react';
import {
  Trophy,
  Scale,
  Plus,
  X,
  Save,
  Check,
  Cpu,
  Camera,
  Battery,
  Monitor,
  BadgeDollarSign,
  Sparkles,
  Zap,
  Bookmark,
  Share2,
  Database,
  ArrowRight,
} from 'lucide-react';
import { PhoneSpecs, AlgorithmWeights, calculateAlgorithmScore } from '../data/phones.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface CompareArenaProps {
  phones: PhoneSpecs[];
  selectedPhoneIds: string[];
  weights: AlgorithmWeights;
  onRemovePhone: (phoneId: string) => void;
  onAddPhone: (phoneId: string) => void;
  openLoginModal: () => void;
  onGoToCatalog: () => void;
}

export const CompareArena: React.FC<CompareArenaProps> = ({
  phones,
  selectedPhoneIds,
  weights,
  onRemovePhone,
  onAddPhone,
  openLoginModal,
  onGoToCatalog,
}) => {
  const { token, refreshUserData } = useAuth();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [comparisonTitle, setComparisonTitle] = useState('');
  const [comparisonNotes, setComparisonNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected phone objects
  const selectedPhones = phones.filter((p) => selectedPhoneIds.includes(p.id));

  // Determine overall algorithmic winner
  const scoredPhones = selectedPhones.map((phone) => ({
    phone,
    score: calculateAlgorithmScore(phone, weights),
  }));

  const winner =
    scoredPhones.length > 0
      ? scoredPhones.reduce((prev, curr) => (curr.score > prev.score ? curr : prev))
      : null;

  // Category winners
  const bestPerf = selectedPhones.reduce((prev, curr) =>
    curr.scores.performance > prev.scores.performance ? curr : prev,
    selectedPhones[0]
  );
  const bestCam = selectedPhones.reduce((prev, curr) =>
    curr.scores.camera > prev.scores.camera ? curr : prev,
    selectedPhones[0]
  );
  const bestBat = selectedPhones.reduce((prev, curr) =>
    curr.scores.battery > prev.scores.battery ? curr : prev,
    selectedPhones[0]
  );
  const bestDisp = selectedPhones.reduce((prev, curr) =>
    curr.scores.display > prev.scores.display ? curr : prev,
    selectedPhones[0]
  );
  const bestVal = selectedPhones.reduce((prev, curr) =>
    curr.scores.value > prev.scores.value ? curr : prev,
    selectedPhones[0]
  );

  // Available phones to add to comparison
  const availablePhones = phones.filter((p) => !selectedPhoneIds.includes(p.id));

  const handleSaveComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openLoginModal();
      return;
    }
    if (!comparisonTitle.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/comparisons', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: comparisonTitle.trim(),
          phoneIds: selectedPhoneIds,
          weights,
          notes: comparisonNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        refreshUserData();
        setTimeout(() => {
          setSaveSuccess(false);
          setSaveModalOpen(false);
          setComparisonTitle('');
          setComparisonNotes('');
        }, 1800);
      }
    } catch (err) {
      console.error('Save comparison error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (selectedPhones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <Scale className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-white">Compare Arena is Empty</h2>
        <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
          Select 2 to 4 smartphones to pit them in head-to-head battle using our mathematical spec weighting and benchmark algorithms.
        </p>
        <button
          onClick={onGoToCatalog}
          className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110"
        >
          <span>Browse & Select Phones</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Head-to-Head Algorithmic Arena</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Comparing {selectedPhones.length} devices evaluated under your active algorithm coefficients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add another phone dropdown */}
          {selectedPhones.length < 4 && availablePhones.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onAddPhone(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 focus:border-cyan-500 focus:outline-none"
              >
                <option value="" disabled>
                  + Add Phone ({selectedPhones.length}/4)
                </option>
                {availablePhones.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Save to PostgreSQL */}
          <button
            onClick={() => {
              if (!token) {
                openLoginModal();
              } else {
                setComparisonTitle(selectedPhones.map((p) => p.name).join(' vs '));
                setSaveModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Save to PostgreSQL</span>
          </button>

          {/* Share */}
          <button
            onClick={handleCopyShare}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Copied Link' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Algorithmic Winner Spotlight */}
      {winner && (
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-500/10">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                  <Trophy className="h-7 w-7 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                    Algorithm Winner
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    {winner.score} / 100 PTS
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">{winner.phone.name}</h3>
                <p className="text-xs text-slate-400">{winner.phone.tagline}</p>
              </div>
            </div>

            {/* Category champions pills */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                <span>Perf: {bestPerf?.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
                <Camera className="h-3.5 w-3.5 text-rose-400" />
                <span>Camera: {bestCam?.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
                <Battery className="h-3.5 w-3.5 text-emerald-400" />
                <span>Battery: {bestBat?.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
                <Monitor className="h-3.5 w-3.5 text-amber-400" />
                <span>Display: {bestDisp?.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Phone Cards Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {selectedPhones.map((phone) => {
          const score = calculateAlgorithmScore(phone, weights);
          const isOverallWinner = winner?.phone.id === phone.id;

          return (
            <div
              key={phone.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition ${
                isOverallWinner
                  ? 'border-cyan-500/80 bg-slate-900/90 shadow-xl shadow-cyan-500/15 ring-2 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-900/70'
              }`}
            >
              {/* Close button */}
              <button
                onClick={() => onRemovePhone(phone.id)}
                className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                title="Remove from comparison"
              >
                <X className="h-4 w-4" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                    {phone.brand}
                  </span>
                  {isOverallWinner && (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      Top Pick
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-950 border border-slate-800 p-1">
                    <img src={phone.image} alt={phone.name} className="h-full w-full object-cover rounded" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{phone.name}</h4>
                    <p className="mt-0.5 text-xs font-semibold text-emerald-400 font-mono">
                      ${phone.price.toLocaleString()}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-cyan-400">{score}</span>
                      <span className="text-[10px] text-slate-500">/ 100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini pillar bars */}
              <div className="mt-4 space-y-1.5 border-t border-slate-800/80 pt-3 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Perf:</span>
                  <span className="font-mono text-indigo-300 font-bold">{phone.scores.performance}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Camera:</span>
                  <span className="font-mono text-rose-300 font-bold">{phone.scores.camera}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Battery:</span>
                  <span className="font-mono text-emerald-300 font-bold">{phone.scores.battery}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Display:</span>
                  <span className="font-mono text-amber-300 font-bold">{phone.scores.display}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Value:</span>
                  <span className="font-mono text-teal-300 font-bold">{phone.scores.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Specs Comparison Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-sm">
        <div className="border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Detailed Hardware & Benchmark Breakdown
          </h3>
          <p className="text-xs text-slate-400">
            Side-by-side specifications with best-in-class highlights.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <tbody>
              {/* Category: Performance */}
              <tr className="bg-indigo-950/20 font-bold text-indigo-300">
                <td colSpan={selectedPhones.length + 1} className="px-6 py-2.5 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-4 w-4" />
                    <span>Performance & Hardware Silicon</span>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="w-48 px-6 py-3 font-semibold text-slate-400">Processor / SoC</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3 font-medium text-white">
                    {p.details.processor}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">AnTuTu Benchmark</td>
                {selectedPhones.map((p) => {
                  const isHighest =
                    p.details.antutuScore ===
                    Math.max(...selectedPhones.map((x) => x.details.antutuScore));
                  return (
                    <td
                      key={p.id}
                      className={`px-6 py-3 font-mono ${
                        isHighest ? 'font-bold text-cyan-400' : 'text-slate-300'
                      }`}
                    >
                      {p.details.antutuScore.toLocaleString()} {isHighest && '★'}
                    </td>
                  );
                })}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Geekbench Single / Multi</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3 font-mono">
                    <span className="text-white font-bold">{p.details.geekbenchSingle}</span> /{' '}
                    <span className="text-slate-300">{p.details.geekbenchMulti}</span>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">RAM & Storage Tech</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3">
                    <div>{p.details.ram}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.details.storage}</div>
                  </td>
                ))}
              </tr>

              {/* Category: Display */}
              <tr className="bg-amber-950/20 font-bold text-amber-300">
                <td colSpan={selectedPhones.length + 1} className="px-6 py-2.5 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Monitor className="h-4 w-4" />
                    <span>Display & Optics</span>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Panel & Size</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3">
                    <span className="font-semibold text-white">{p.details.screenSize}</span> -{' '}
                    <span>{p.details.displayType}</span>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Resolution & Refresh</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3">
                    <div>{p.details.resolution}</div>
                    <div className="text-cyan-400 font-semibold">{p.details.refreshRate}</div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Peak Outdoor Brightness</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3 font-mono font-medium text-amber-300">
                    {p.details.peakBrightness}
                  </td>
                ))}
              </tr>

              {/* Category: Camera */}
              <tr className="bg-rose-950/20 font-bold text-rose-300">
                <td colSpan={selectedPhones.length + 1} className="px-6 py-2.5 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Camera className="h-4 w-4" />
                    <span>Camera & Video Production</span>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Primary Sensor</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3 font-medium text-white">
                    {p.details.mainCamera}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Telephoto Optical Zoom</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3">
                    {p.details.telephotoCamera}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Video Capture Engine</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3 text-slate-300">
                    {p.details.videoResolution}
                  </td>
                ))}
              </tr>

              {/* Category: Battery */}
              <tr className="bg-emerald-950/20 font-bold text-emerald-300">
                <td colSpan={selectedPhones.length + 1} className="px-6 py-2.5 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Battery className="h-4 w-4" />
                    <span>Battery & Charging</span>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Battery Capacity</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3 font-mono font-bold text-emerald-400">
                    {p.details.batteryCapacity}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Real-World Endurance</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3 font-mono font-medium text-white">
                    {p.details.batteryLifeHours} hrs active test
                  </td>
                ))}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Wired & Wireless Charging</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3">
                    <div>{p.details.wiredCharging}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.details.wirelessCharging}</div>
                  </td>
                ))}
              </tr>

              {/* Category: Build, OS, Support */}
              <tr className="bg-teal-950/20 font-bold text-teal-300">
                <td colSpan={selectedPhones.length + 1} className="px-6 py-2.5 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <BadgeDollarSign className="h-4 w-4" />
                    <span>Longevity, OS & Dimensions</span>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">OS & Update Support</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3">
                    <div>{p.details.os}</div>
                    <div className="text-teal-400 font-semibold font-mono">
                      {p.details.updateSupportYears} Years Guaranteed Upgrades
                    </div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Weight & Durability</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3">
                    <div>{p.details.weight}</div>
                    <div className="text-cyan-400 font-medium">{p.details.ipRating}</div>
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-800/30">
                <td className="px-6 py-3 font-semibold text-slate-400">Price (USD MSRP)</td>
                {selectedPhones.map((p) => (
                  <td key={p.id} className="px-6 py-3 font-mono font-bold text-lg text-emerald-400">
                    ${p.price.toLocaleString()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Comparison Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setSaveModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 text-emerald-400">
              <Database className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Save Comparison to Cloud SQL</h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              This comparison session will be persisted in your PostgreSQL account database.
            </p>

            <form onSubmit={handleSaveComparison} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Comparison Title</label>
                <input
                  type="text"
                  required
                  value={comparisonTitle}
                  onChange={(e) => setComparisonTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. S25 Ultra vs iPhone 16 Pro Max Flagship Showdown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Review Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={comparisonNotes}
                  onChange={(e) => setComparisonNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Add any notes on benchmark impressions or purchase recommendations..."
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Saved Phones: </span>
                {selectedPhones.map((p) => p.name).join(', ')}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Saved to PostgreSQL!</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Writing to DB...' : 'Save Comparison'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
