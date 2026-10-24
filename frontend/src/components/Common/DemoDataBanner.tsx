import React from 'react';
import { Database, Cpu, Info, ShieldCheck } from 'lucide-react';

interface DemoDataBannerProps {
  sectionTitle?: string;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ sectionTitle }) => {
  return (
    <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-950/20 p-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
                <Info className="h-3 w-3" /> DEMO BENCHMARK DATASET
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                <Cpu className="h-3 w-3" /> SCIKIT-LEARN BASELINE ACTIVE
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              {sectionTitle ? `${sectionTitle} utilizes ` : 'Operating on '}
              FAA/BTS 1,250 flight historical benchmark records. Live ADS-B radar ingestion and deep temporal LSTM integration are scheduled for Phase 2.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <ShieldCheck className="h-4 w-4 text-sky-400" />
          <span>Real Trained ML Weights</span>
        </div>
      </div>
    </div>
  );
};
