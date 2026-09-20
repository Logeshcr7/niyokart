import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, Scale, Check, ShoppingBag, Star, Sparkles, Building2, ChevronDown } from 'lucide-react';
import { PhoneSpecs, AlgorithmWeights, calculateAlgorithmScore, formatINR } from '../data/phones.ts';

interface PhoneCatalogSectionProps {
  phones: PhoneSpecs[];
  weights: AlgorithmWeights;
  comparedPhoneIds: string[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleCompare: (phone: PhoneSpecs) => void;
  onAddToCart: (phone: PhoneSpecs) => void;
  onSelectPhone: (phone: PhoneSpecs) => void;
}

const TOP_BRANDS = [
  'all',
  'Samsung',
  'Apple',
  'Xiaomi',
  'Motorola',
  'OnePlus',
  'Realme',
  'POCO',
  'Vivo',
  'iQOO',
  'Oppo',
  'Google',
  'Nothing',
  'Infinix',
  'Tecno',
  'Honor',
  'Asus',
];

export const PhoneCatalogSection: React.FC<PhoneCatalogSectionProps> = ({
  phones,
  weights,
  comparedPhoneIds,
  selectedBrand,
  onSelectBrand,
  searchQuery,
  setSearchQuery,
  onToggleCompare,
  onAddToCart,
  onSelectPhone,
}) => {
  const [sortBy, setSortBy] = useState<'score' | 'price-asc' | 'price-desc' | 'rating'>('score');
  const [visibleCount, setVisibleCount] = useState(24);

  // Filter phones
  const filteredPhones = phones.filter((phone) => {
    const matchesSearch =
      phone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.details.processor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand =
      selectedBrand === 'all' || phone.brand.toLowerCase() === selectedBrand.toLowerCase();
    return matchesSearch && matchesBrand;
  });

  // Sort phones
  const sortedPhones = [...filteredPhones].sort((a, b) => {
    if (sortBy === 'score') {
      return calculateAlgorithmScore(b, weights) - calculateAlgorithmScore(a, weights);
    }
    if (sortBy === 'price-asc') {
      return a.price - b.price;
    }
    if (sortBy === 'price-desc') {
      return b.price - a.price;
    }
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    return 0;
  });

  const displayedPhones = sortedPhones.slice(0, visibleCount);

  return (
    <section id="all-phones-catalog" className="mt-16 scroll-mt-20">
      {/* Section Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Explore All Smartphones
            </h2>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-700">
              {phones.length}+ Live Phones
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real devices verified from Amazon, Flipkart, Mi Store, Motorola Hub & brand outlets
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="score">Algorithm Match Score (High to Low)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Brand Filter Pills */}
      <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {TOP_BRANDS.map((brand) => {
          const isSelected = selectedBrand.toLowerCase() === brand.toLowerCase();
          const count = brand === 'all' ? phones.length : phones.filter((p) => p.brand.toLowerCase() === brand.toLowerCase()).length;
          return (
            <button
              key={brand}
              onClick={() => {
                onSelectBrand(brand);
                setVisibleCount(24);
              }}
              className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{brand === 'all' ? 'All Brands' : brand}</span>
              <span className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {sortedPhones.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-xs text-slate-400">
          No smartphones match your current brand filter or search term.
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {displayedPhones.map((phone) => {
              const isComparing = comparedPhoneIds.includes(phone.id);
              const score = calculateAlgorithmScore(phone, weights);

              return (
                <div
                  key={phone.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg"
                >
                  {/* Score badge at top right */}
                  <div className="absolute right-3.5 top-3.5 z-10 flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-200">
                    <Sparkles className="h-2.5 w-2.5 text-blue-600" />
                    <span>Algo {score}</span>
                  </div>

                  {/* Compare Checkbox at top left */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCompare(phone);
                    }}
                    className={`absolute left-3.5 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                      isComparing
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white/90 text-slate-600 hover:border-blue-500 hover:text-blue-600'
                    }`}
                    title={isComparing ? 'Remove from Compare' : 'Add to Compare'}
                  >
                    {isComparing ? <Check className="h-3.5 w-3.5" /> : <Scale className="h-3.5 w-3.5" />}
                  </button>

                  {/* Product Image */}
                  <div
                    onClick={() => onSelectPhone(phone)}
                    className="relative mt-5 flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-2"
                  >
                    <img
                      src={phone.image}
                      alt={phone.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="mt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">
                          {phone.brand}
                        </span>
                        {phone.storeSource && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-slate-500">
                            <Building2 className="h-2.5 w-2.5 text-blue-500" />
                            {phone.storeSource.split('/')[0].trim()}
                          </span>
                        )}
                      </div>
                      <h3
                        onClick={() => onSelectPhone(phone)}
                        className="mt-0.5 line-clamp-1 cursor-pointer text-sm font-bold text-slate-900 transition hover:text-blue-600"
                      >
                        {phone.name}
                      </h3>

                      {/* Star Rating & Processor */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <span>{phone.rating || 4.5}</span>
                          <Star className="h-2.5 w-2.5 fill-white" />
                        </div>
                        <span className="text-[11px] text-slate-400 line-clamp-1">
                          {phone.details.processor}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-900">
                          {formatINR(phone.price)}
                        </span>
                        {phone.originalPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatINR(phone.originalPrice)}
                          </span>
                        )}
                        {phone.discountPercent && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            {phone.discountPercent}% off
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-4 pt-2 flex flex-col gap-1.5">
                      <button
                        onClick={() => onAddToCart(phone)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Buy Now</span>
                      </button>

                      <button
                        onClick={() => onToggleCompare(phone)}
                        className={`flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold transition ${
                          isComparing
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Scale className="h-3 w-3 text-blue-600" />
                        <span>{isComparing ? 'In Comparison' : 'Add to Compare'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Pagination */}
          {visibleCount < sortedPhones.length && (
            <div className="mt-10 flex flex-col items-center justify-center gap-2 border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{displayedPhones.length}</span> of{' '}
                <span className="font-bold text-slate-900">{sortedPhones.length}</span> smartphones
              </p>
              <button
                onClick={() => setVisibleCount((prev) => prev + 24)}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600 active:scale-95"
              >
                <span>Load More Smartphones ({sortedPhones.length - displayedPhones.length} remaining)</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};
