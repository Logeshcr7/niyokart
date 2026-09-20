import React from 'react';
import { Database, ShieldCheck, Terminal } from 'lucide-react';

interface NiyoFooterProps {
  onOpenDeveloperPortal?: () => void;
  isDeveloper?: boolean;
}

export const NiyoFooter: React.FC<NiyoFooterProps> = ({
  onOpenDeveloperPortal,
  isDeveloper = false,
}) => {
  return (
    <footer className="mt-20 border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 4 Columns matching Figma */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Col 1: About */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">ABOUT NIYO KART</h4>
            <ul className="mt-4 space-y-2.5 text-[11px]">
              <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition">About Our Tech & Algorithm</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
              <li><a href="#" className="hover:text-white transition">Niyo Stories</a></li>
              <li><a href="#" className="hover:text-white transition">Press Releases</a></li>
              <li><a href="#" className="hover:text-white transition">Corporate Information</a></li>
            </ul>
          </div>

          {/* Col 2: Help */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">HELP & SUPPORT</h4>
            <ul className="mt-4 space-y-2.5 text-[11px]">
              <li><a href="#" className="hover:text-white transition">Payments & EMI Options</a></li>
              <li><a href="#" className="hover:text-white transition">Shipping & Delivery Policies</a></li>
              <li><a href="#" className="hover:text-white transition">Cancellation & Returns</a></li>
              <li><a href="#" className="hover:text-white transition">Comparison Matrix FAQ</a></li>
              <li><a href="#" className="hover:text-white transition">Report Infringement</a></li>
            </ul>
          </div>

          {/* Col 3: Policy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">CONSUMER POLICY</h4>
            <ul className="mt-4 space-y-2.5 text-[11px]">
              <li><a href="#" className="hover:text-white transition">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white transition">Security & Encryption</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">PostgreSQL Cloud Sync Notice</a></li>
              <li><a href="#" className="hover:text-white transition">Sitemap & Directory</a></li>
              <li><a href="#" className="hover:text-white transition">Grievance Redressal</a></li>
            </ul>
          </div>

          {/* Col 4: Address & Registered Office */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">REGISTERED OFFICE</h4>
            <div className="mt-4 text-[11px] leading-relaxed text-slate-400">
              <p className="font-semibold text-slate-200">Niyo Kart Private Limited</p>
              <p>Tech Park Block 4, Bandra Kurla Complex,</p>
              <p>Mumbai, Maharashtra, India - 400051</p>
              <p className="mt-2">CIN: U51909MH2024PTC123456</p>
              <p>Telephone: <strong className="text-white">1800-NIYO-KART</strong></p>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-2.5">
              <Database className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-[10px] font-bold text-white">Cloud SQL PostgreSQL</p>
                <p className="text-[9px] text-emerald-400 font-mono">asia-southeast1 Connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white font-black text-xs">
              N
            </div>
            <span className="font-bold text-white">Niyo Kart</span>
            <span>— © 2024 Niyo Kart. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>100% Genuine Mobile Retailer</span>
            </div>
            <span>•</span>
            <span>PCI-DSS Verified Payments</span>
            {onOpenDeveloperPortal && (
              <>
                <span>•</span>
                <button
                  onClick={onOpenDeveloperPortal}
                  className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-indigo-400 transition"
                  title="Developer Console (Shortcut: Ctrl + Shift + A)"
                >
                  <Terminal className="h-3 w-3" />
                  <span>{isDeveloper ? 'Developer CMS Active' : 'Developer Portal'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
