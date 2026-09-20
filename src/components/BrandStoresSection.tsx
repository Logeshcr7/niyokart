import React from 'react';

interface BrandStoresSectionProps {
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
}

const BRANDS = [
  { id: 'all', name: 'All Brands', code: 'ALL', bg: 'bg-slate-900 text-white' },
  { id: 'Apple', name: 'Apple', code: 'AP', bg: 'bg-black text-white' },
  { id: 'Samsung', name: 'Samsung', code: 'SS', bg: 'bg-blue-700 text-white' },
  { id: 'OnePlus', name: 'OnePlus', code: 'OP', bg: 'bg-red-600 text-white' },
  { id: 'Xiaomi', name: 'Xiaomi', code: 'MI', bg: 'bg-orange-500 text-white' },
  { id: 'Realme', name: 'Realme', code: 'RM', bg: 'bg-amber-500 text-slate-950 font-black' },
  { id: 'Motorola', name: 'Motorola', code: 'MO', bg: 'bg-cyan-700 text-white' },
  { id: 'POCO', name: 'POCO', code: 'PO', bg: 'bg-yellow-400 text-slate-950 font-black' },
];

export const BrandStoresSection: React.FC<BrandStoresSectionProps> = ({
  selectedBrand,
  onSelectBrand,
}) => {
  return (
    <section className="mt-14">
      <div className="text-center">
        <h2 className="text-sm font-extrabold tracking-widest text-slate-400 uppercase">
          OFFICIAL BRAND STORES
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Browse authenticated official partner catalogs
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {BRANDS.map((brand) => {
          const isSelected = selectedBrand.toLowerCase() === brand.id.toLowerCase();

          return (
            <button
              key={brand.id}
              onClick={() => onSelectBrand(brand.id)}
              className="flex flex-col items-center gap-2 group transition-transform hover:-translate-y-1"
            >
              {/* Brand Circle */}
              <div
                className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full text-base sm:text-lg font-black shadow-md transition-all ${
                  brand.bg
                } ${
                  isSelected
                    ? 'ring-4 ring-blue-600 ring-offset-2 scale-105 shadow-lg'
                    : 'group-hover:shadow-lg'
                }`}
              >
                {brand.code}
              </div>

              {/* Brand Name */}
              <span
                className={`text-xs font-bold transition ${
                  isSelected ? 'text-blue-600' : 'text-slate-700 group-hover:text-blue-600'
                }`}
              >
                {brand.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
