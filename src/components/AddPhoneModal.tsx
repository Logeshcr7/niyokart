import React, { useState } from 'react';
import { X, Search, Check, Plus, Scale } from 'lucide-react';
import { PhoneSpecs, formatINR } from '../data/phones.ts';

interface AddPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPhones: PhoneSpecs[];
  comparedPhoneIds: string[];
  onAddPhone: (phone: PhoneSpecs) => void;
}

export const AddPhoneModal: React.FC<AddPhoneModalProps> = ({
  isOpen,
  onClose,
  allPhones,
  comparedPhoneIds,
  onAddPhone,
}) => {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');

  if (!isOpen) return null;

  const brands = ['all', ...Array.from(new Set(allPhones.map((p) => p.brand)))];

  const filteredPhones = allPhones.filter((phone) => {
    const matchesSearch =
      phone.name.toLowerCase().includes(search.toLowerCase()) ||
      phone.brand.toLowerCase().includes(search.toLowerCase()) ||
      phone.details.processor.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = selectedBrand === 'all' || phone.brand.toLowerCase() === selectedBrand.toLowerCase();
    return matchesSearch && matchesBrand;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Phone to Comparison Matrix</h3>
              <p className="text-xs text-slate-500">
                Select from our complete verified database of smartphones
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

        {/* Search and Brand Filters */}
        <div className="border-b border-slate-100 bg-slate-50 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by device name, brand, or processor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition ${
                  selectedBrand === b
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {b === 'all' ? 'All Brands' : b}
              </button>
            ))}
          </div>
        </div>

        {/* List of phones */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          <div className="pb-2 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>{filteredPhones.length} smartphones found</span>
            {filteredPhones.length > 60 && <span>Showing top 60 (type to narrow search)</span>}
          </div>
          {filteredPhones.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching phones found. Try a different query.
            </div>
          ) : (
            filteredPhones.slice(0, 60).map((phone) => {
              const isAlreadyAdded = comparedPhoneIds.includes(phone.id);

              return (
                <div
                  key={phone.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-1 flex items-center justify-center">
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
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">
                          {phone.brand}
                        </span>
                        {phone.storeSource && (
                          <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] text-slate-500 font-medium">
                            {phone.storeSource.split('/')[0].trim()}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{phone.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {phone.details.processor} • {phone.details.batteryCapacity}
                      </p>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {formatINR(phone.price)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        onAddPhone(phone);
                        onClose();
                      }
                    }}
                    disabled={isAlreadyAdded}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      isAlreadyAdded
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-95'
                    }`}
                  >
                    {isAlreadyAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Already In Arena</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
