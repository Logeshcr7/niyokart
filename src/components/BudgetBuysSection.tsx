import React from 'react';
import { Star, Scale, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { PhoneSpecs, formatINR } from '../data/phones.ts';

interface BudgetBuysSectionProps {
  phones: PhoneSpecs[];
  comparedPhoneIds: string[];
  onToggleCompare: (phone: PhoneSpecs) => void;
  onAddToCart: (phone: PhoneSpecs) => void;
  onSelectPhone: (phone: PhoneSpecs) => void;
}

export const BudgetBuysSection: React.FC<BudgetBuysSectionProps> = ({
  phones,
  comparedPhoneIds,
  onToggleCompare,
  onAddToCart,
  onSelectPhone,
}) => {
  // Grab phones under ₹10,000 or category === 'budget'
  const budgetPhones = phones.filter((p) => p.category === 'budget' || p.price <= 10000).slice(0, 4);

  return (
    <section className="mt-14">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Budget Buys Under ₹10,000
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Incredible features at entry-level pricing
          </p>
        </div>

        <button
          onClick={() => {
            const catalogEl = document.getElementById('all-phones-catalog');
            catalogEl?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
        >
          <span>View All Budget Phones</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 4-Card Grid matching Figma */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {budgetPhones.map((phone) => {
          const isComparing = comparedPhoneIds.includes(phone.id);

          return (
            <div
              key={phone.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg"
            >
              {/* Badge: Under ₹10k */}
              <div className="absolute left-3.5 top-3.5 z-10 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                Under ₹10k
              </div>

              {/* Compare Quick Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(phone);
                }}
                className={`absolute right-3.5 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg border transition ${
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
                className="relative mt-3 flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-2"
              >
                <img
                  src={phone.image}
                  alt={phone.name}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Product Info */}
              <div className="mt-3 flex-1 flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {phone.brand}
                </span>

                <h3
                  onClick={() => onSelectPhone(phone)}
                  className="mt-0.5 line-clamp-1 cursor-pointer text-sm font-bold text-slate-900 transition hover:text-blue-600"
                >
                  {phone.name}
                </h3>

                {/* Star Rating */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <span>{phone.rating || 4.2}</span>
                    <Star className="h-2.5 w-2.5 fill-white" />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ({phone.ratingCount ? phone.ratingCount.toLocaleString('en-IN') : '850'})
                  </span>
                </div>

                {/* Price Display */}
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-base font-black text-slate-900">
                    {formatINR(phone.price)}
                  </span>
                  {phone.originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatINR(phone.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Buy Now & Compare */}
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
    </section>
  );
};
