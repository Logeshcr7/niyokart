import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Scale, Sparkles, X } from 'lucide-react';
import { PhoneSpecs, AlgorithmWeights, calculateAlgorithmScore } from '../data/phones.ts';
import { PhoneCard } from './PhoneCard.tsx';

interface PhoneCatalogProps {
  phones: PhoneSpecs[];
  weights: AlgorithmWeights;
  selectedPhoneIds: string[];
  onToggleSelect: (phoneId: string) => void;
  onViewDetails: (phone: PhoneSpecs) => void;
  openLoginModal: () => void;
  onGoToArena: () => void;
}

export const PhoneCatalog: React.FC<PhoneCatalogProps> = ({
  phones,
  weights,
  selectedPhoneIds,
  onToggleSelect,
  onViewDetails,
  openLoginModal,
  onGoToArena,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'algo' | 'price-asc' | 'price-desc' | 'perf' | 'battery'>('algo');

  // Unique brands
  const brands = useMemo(() => {
    const set = new Set(phones.map((p) => p.brand));
    return ['All', ...Array.from(set)];
  }, [phones]);

  // Filtered & Sorted phones
  const filteredPhones = useMemo(() => {
    return phones
      .filter((phone) => {
        // Search filter
        const matchesSearch =
          phone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          phone.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          phone.details.processor.toLowerCase().includes(searchQuery.toLowerCase());

        // Brand filter
        const matchesBrand = selectedBrand === 'All' || phone.brand === selectedBrand;

        // Category filter
        let matchesCat = true;
        if (selectedCategory === 'flagship') matchesCat = phone.price >= 1000;
        else if (selectedCategory === 'budget') matchesCat = phone.price < 900;
        else if (selectedCategory === 'gaming') matchesCat = phone.scores.performance >= 95;
        else if (selectedCategory === 'camera') matchesCat = phone.scores.camera >= 95;
        else if (selectedCategory === 'battery') matchesCat = phone.scores.battery >= 95;

        return matchesSearch && matchesBrand && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'algo') {
          return calculateAlgorithmScore(b, weights) - calculateAlgorithmScore(a, weights);
        }
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'perf') return b.scores.performance - a.scores.performance;
        if (sortBy === 'battery') return b.scores.battery - a.scores.battery;
        return 0;
      });
  }, [phones, searchQuery, selectedBrand, selectedCategory, sortBy, weights]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Search bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search phones by model, chipset (Snapdragon 8 Elite, A18 Pro), brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="algo">Rank: Dynamic Algorithm Score</option>
            <option value="perf">Performance First</option>
            <option value="battery">Battery Endurance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Pills & Brand Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Phones' },
            { id: 'flagship', label: 'Ultra Flagships ($1000+)' },
            { id: 'camera', label: 'Pro Optics' },
            { id: 'gaming', label: 'Gaming Beasts' },
            { id: 'battery', label: 'Battery Monsters' },
            { id: 'budget', label: 'Value Kings (<$900)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Brand tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                selectedBrand === brand
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Phones Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPhones.map((phone, idx) => (
          <PhoneCard
            key={phone.id}
            phone={phone}
            weights={weights}
            isSelected={selectedPhoneIds.includes(phone.id)}
            onToggleSelect={onToggleSelect}
            onViewDetails={onViewDetails}
            openLoginModal={openLoginModal}
            rank={sortBy === 'algo' ? idx + 1 : undefined}
          />
        ))}
      </div>

      {filteredPhones.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-sm font-semibold text-slate-300">No smartphones match your query</p>
          <p className="mt-1 text-xs text-slate-500">Try clearing your search query or switching filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBrand('All');
              setSelectedCategory('all');
            }}
            className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs text-cyan-400 hover:bg-slate-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Floating Bottom Comparison Dock */}
      {selectedPhoneIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 w-[95%] max-w-2xl rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-3.5 shadow-2xl shadow-cyan-500/20 backdrop-blur-lg animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {selectedPhoneIds.length} {selectedPhoneIds.length === 1 ? 'Phone' : 'Phones'} Selected for Battle
                </p>
                <p className="text-[10px] text-slate-400">
                  {selectedPhoneIds.length < 2
                    ? 'Select at least 1 more phone to initiate algorithmic comparison'
                    : 'Ready for side-by-side spec & benchmark fight'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => selectedPhoneIds.forEach((id) => onToggleSelect(id))}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Clear
              </button>
              <button
                onClick={onGoToArena}
                disabled={selectedPhoneIds.length < 2}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Launch Compare Arena</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
