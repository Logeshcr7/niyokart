import React from 'react';
import { Truck, CreditCard, ShieldCheck, RefreshCw } from 'lucide-react';

export const WhyShopSection: React.FC = () => {
  const perks = [
    {
      icon: Truck,
      title: 'Free Express Delivery',
      desc: 'Get your device delivered safe & sound to your doorstep at zero cost within 24-48 hours.',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: CreditCard,
      title: 'Easy EMI Available',
      desc: 'No-cost EMI options on all major credit & debit cards up to 12 months with instant approvals.',
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: ShieldCheck,
      title: '100% Genuine Products',
      desc: 'Direct brand sourcing with 1-year official brand warranty and manufacturer tamper-proof seal.',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: RefreshCw,
      title: 'Hassle-Free Returns',
      desc: 'No questions asked 7-day replacement or refund policy if you change your mind.',
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <section className="mt-16">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Why Shop On Niyo Kart?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Uncompromised commitment to your satisfaction and device protection
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {perks.map((perk, idx) => {
          const Icon = perk.icon;
          return (
            <div
              key={idx}
              className="flex flex-col items-center text-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${perk.color} mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{perk.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{perk.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
