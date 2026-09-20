import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Cpu,
  Camera,
  BatteryCharging,
  Monitor,
  BadgeDollarSign,
  RotateCcw,
  Save,
  Trash2,
  Sparkles,
  Database,
  Check,
} from 'lucide-react';
import { AlgorithmWeights, DEFAULT_WEIGHTS, WEIGHT_PRESETS } from '../data/phones.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { CustomPresetRecord } from '../types/index.ts';

interface AlgorithmCustomizerProps {
  weights: AlgorithmWeights;
  setWeights: (weights: AlgorithmWeights) => void;
  openLoginModal: () => void;
}

export const AlgorithmCustomizer: React.FC<AlgorithmCustomizerProps> = ({
  weights,
  setWeights,
  openLoginModal,
}) => {
  const { token, dbUser, refreshUserData } = useAuth();
  const [dbPresets, setDbPresets] = useState<CustomPresetRecord[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load user presets from PostgreSQL
  useEffect(() => {
    if (token) {
      fetch('/api/presets', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setDbPresets(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Error fetching presets:', err));
    } else {
      setDbPresets([]);
    }
  }, [token]);

  const handleSliderChange = (key: keyof AlgorithmWeights, val: number) => {
    setWeights({
      ...weights,
      [key]: val,
    });
  };

  const handleSaveToPostgres = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openLoginModal();
      return;
    }
    if (!newPresetName.trim()) return;

    setSavingPreset(true);
    try {
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPresetName.trim(),
          performanceWeight: weights.performance,
          cameraWeight: weights.camera,
          batteryWeight: weights.battery,
          displayWeight: weights.display,
          valueWeight: weights.value,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setDbPresets((prev) => [saved, ...prev]);
        setNewPresetName('');
        setSaveSuccess(true);
        refreshUserData();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving preset:', err);
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeleteDbPreset = async (presetId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/presets/${presetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDbPresets((prev) => prev.filter((p) => p.id !== presetId));
        refreshUserData();
      }
    } catch (err) {
      console.error('Error deleting preset:', err);
    }
  };

  const totalWeight =
    weights.performance + weights.camera + weights.battery + weights.display + weights.value;

  const getPercent = (val: number) => {
    if (totalWeight === 0) return 0;
    return Math.round((val / totalWeight) * 100);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Algorithmic Scoring Matrix</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Customize weighting coefficients to redefine how smartphones are ranked across all comparison arenas.
          </p>
        </div>

        <button
          onClick={() => setWeights(DEFAULT_WEIGHTS)}
          className="flex items-center gap-1.5 self-start rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="mt-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Curated Scoring Archetypes
        </label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {WEIGHT_PRESETS.map((preset) => {
            const isMatch =
              weights.performance === preset.weights.performance &&
              weights.camera === preset.weights.camera &&
              weights.battery === preset.weights.battery &&
              weights.display === preset.weights.display &&
              weights.value === preset.weights.value;

            return (
              <button
                key={preset.name}
                onClick={() => setWeights(preset.weights)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  isMatch
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Sparkles className={`h-3 w-3 ${isMatch ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Weight Distribution Bar */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Composite Weight Distribution</span>
          <span className="font-mono text-cyan-400">Effective 100% Normalized</span>
        </div>

        <div className="mt-2.5 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            style={{ width: `${getPercent(weights.performance)}%` }}
            className="bg-indigo-500 transition-all duration-300"
            title={`Performance: ${getPercent(weights.performance)}%`}
          />
          <div
            style={{ width: `${getPercent(weights.camera)}%` }}
            className="bg-rose-500 transition-all duration-300"
            title={`Camera: ${getPercent(weights.camera)}%`}
          />
          <div
            style={{ width: `${getPercent(weights.battery)}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Battery: ${getPercent(weights.battery)}%`}
          />
          <div
            style={{ width: `${getPercent(weights.display)}%` }}
            className="bg-amber-500 transition-all duration-300"
            title={`Display: ${getPercent(weights.display)}%`}
          />
          <div
            style={{ width: `${getPercent(weights.value)}%` }}
            className="bg-teal-400 transition-all duration-300"
            title={`Value: ${getPercent(weights.value)}%`}
          />
        </div>

        {/* Legend */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-5">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span>Perf ({getPercent(weights.performance)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Camera ({getPercent(weights.camera)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Battery ({getPercent(weights.battery)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Display ({getPercent(weights.display)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
            <span>Value ({getPercent(weights.value)}%)</span>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Performance Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-white">Performance Index</span>
            </div>
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300 font-mono">
              {weights.performance} pts
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Weights CPU single/multicore, GPU ray-tracing, thermal throttling, and sustained gaming FPS.
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.performance}
            onChange={(e) => handleSliderChange('performance', Number(e.target.value))}
            className="mt-3 w-full accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* Camera Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                <Camera className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-white">Camera & Optics</span>
            </div>
            <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-300 font-mono">
              {weights.camera} pts
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Weights sensor dimensions, telephoto zoom clarity, HDR video bitrates, and low-light noise index.
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.camera}
            onChange={(e) => handleSliderChange('camera', Number(e.target.value))}
            className="mt-3 w-full accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Battery Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <BatteryCharging className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-white">Battery & Charging</span>
            </div>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 font-mono">
              {weights.battery} pts
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Weights real-world screen-on endurance hours, wired fast wattage, and wireless battery replenishment.
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.battery}
            onChange={(e) => handleSliderChange('battery', Number(e.target.value))}
            className="mt-3 w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Display Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Monitor className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-white">Display & Fluidity</span>
            </div>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 font-mono">
              {weights.display} pts
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Weights LTPO refresh rates, peak outdoor nits, anti-reflective coating, and color accuracy.
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.display}
            onChange={(e) => handleSliderChange('display', Number(e.target.value))}
            className="mt-3 w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Value Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                <BadgeDollarSign className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-white">Value & Longevity Index</span>
            </div>
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300 font-mono">
              {weights.value} pts
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Weights price-to-hardware efficiency, guaranteed years of OS version upgrades, and repairability.
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.value}
            onChange={(e) => handleSliderChange('value', Number(e.target.value))}
            className="mt-3 w-full accent-teal-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Save Custom Preset to PostgreSQL */}
      <div className="mt-6 border-t border-slate-800 pt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Persist Algorithm Preset to PostgreSQL</span>
            </h3>
            <p className="text-xs text-slate-400">
              Save your custom coefficients to your authenticated Cloud SQL account.
            </p>
          </div>

          <form onSubmit={handleSaveToPostgres} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Preset Name (e.g. My Vlogger Setup)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={savingPreset}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{token ? 'Save to DB' : 'Login to Save'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* User saved presets list from PostgreSQL */}
        {dbPresets.length > 0 && (
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Your PostgreSQL Presets ({dbPresets.length})
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {dbPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300"
                >
                  <button
                    onClick={() =>
                      setWeights({
                        performance: preset.performanceWeight,
                        camera: preset.cameraWeight,
                        battery: preset.batteryWeight,
                        display: preset.displayWeight,
                        value: preset.valueWeight,
                      })
                    }
                    className="font-medium text-cyan-300 hover:underline"
                  >
                    {preset.name}
                  </button>
                  <span className="text-[10px] text-slate-500">
                    P:{preset.performanceWeight} C:{preset.cameraWeight} B:{preset.batteryWeight}
                  </span>
                  <button
                    onClick={() => handleDeleteDbPreset(preset.id)}
                    className="text-slate-500 hover:text-red-400"
                    title="Delete preset"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
