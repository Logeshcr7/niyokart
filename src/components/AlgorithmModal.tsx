import React, { useState } from 'react';
import { X, Sliders, Sparkles, RotateCcw, Database, Check, Bookmark } from 'lucide-react';
import { AlgorithmWeights, DEFAULT_WEIGHTS, WEIGHT_PRESETS } from '../data/phones.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AlgorithmModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: AlgorithmWeights;
  onUpdateWeights: (weights: AlgorithmWeights) => void;
  onSavePresetToPostgres: (name: string, weights: AlgorithmWeights) => Promise<void>;
}

export const AlgorithmModal: React.FC<AlgorithmModalProps> = ({
  isOpen,
  onClose,
  weights,
  onUpdateWeights,
  onSavePresetToPostgres,
}) => {
  const { dbUser, token } = useAuth();
  const [customName, setCustomName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const total = weights.performance + weights.camera + weights.battery + weights.display + weights.value;

  const handleSliderChange = (key: keyof AlgorithmWeights, value: number) => {
    onUpdateWeights({
      ...weights,
      [key]: value,
    });
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setSavingPreset(true);
    try {
      await onSavePresetToPostgres(customName.trim(), weights);
      setSaveSuccess(true);
      setCustomName('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPreset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Calibrate Comparison Algorithm</h3>
              <p className="text-xs text-slate-500">
                Adjust spec weight priorities to rank phones according to your personal usage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Quick Archetype Presets
              </span>
              <button
                onClick={() => onUpdateWeights(DEFAULT_WEIGHTS)}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset to Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    onClick={() => onUpdateWeights(preset.weights)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition ${
                      isMatch
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                      {isMatch && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            {/* Performance */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Processor & Gaming Performance</span>
                <span className="font-mono text-blue-600">{weights.performance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.performance}
                onChange={(e) => handleSliderChange('performance', Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-400">
                Weights AnTuTu score, Geekbench 6 single & multi-core, and hardware ray tracing
              </p>
            </div>

            {/* Camera */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Camera & Video Optics</span>
                <span className="font-mono text-blue-600">{weights.camera}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.camera}
                onChange={(e) => handleSliderChange('camera', Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-400">
                Weights primary megapixels, sensor sizes, optical zoom range, and 4K/8K HDR video
              </p>
            </div>

            {/* Battery */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Battery Life & Fast Charging</span>
                <span className="font-mono text-blue-600">{weights.battery}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.battery}
                onChange={(e) => handleSliderChange('battery', Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-400">
                Weights capacity (mAh), endurance test hours, wired charging wattage & wireless support
              </p>
            </div>

            {/* Display */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Display & Screen Quality</span>
                <span className="font-mono text-blue-600">{weights.display}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.display}
                onChange={(e) => handleSliderChange('display', Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-400">
                Weights refresh rate (120Hz LTPO), resolution (QHD+/1.5K) & peak brightness nits
              </p>
            </div>

            {/* Value */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Price-to-Performance Value</span>
                <span className="font-mono text-blue-600">{weights.value}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.value}
                onChange={(e) => handleSliderChange('value', Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-400">
                Weights spec bang-for-buck relative to MSRP and discount pricing
              </p>
            </div>
          </div>

          {/* Save to PostgreSQL */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-900">
                Persist Custom Matrix to PostgreSQL
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mb-3">
              Save your custom weighting formulas into your Cloud SQL database profile for future comparisons.
            </p>

            <form onSubmit={handleSavePreset} className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Preset Name (e.g. My Heavy Gaming Weights)"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!customName.trim() || savingPreset}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>{savingPreset ? 'Saving...' : 'Save'}</span>
              </button>
            </form>

            {saveSuccess && (
              <p className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                <span>Preset saved to PostgreSQL database successfully!</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
