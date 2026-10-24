import React, { useState } from 'react';
import { Database, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface DemoDataBannerProps {
  sectionTitle?: string;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ sectionTitle }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-400 transition-all">
      <div className="flex items-center justify-between px-3.5 py-2">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span className="font-medium text-slate-300">
            {sectionTitle || 'Operations'}:
          </span>
          <span className="text-slate-400">
            1,250 Benchmark Flight Records (FAA/BTS Distribution)
          </span>
          <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Scikit-Learn Operational
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300"
        >
          <span>{expanded ? 'Less' : 'Provenance & Specs'}</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-800/80 px-3.5 py-2.5 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
          <p>
            Generated using empirical carrier punctuality, hub banking curves, and real IATA coordinates calibrated to BTS TranStats distributions. Real historical archives can be ingested via Data Management.
          </p>
          <p className="text-slate-500 italic">
            Statistical Advisory: Platform predictions are probabilistic estimates derived from trained model weights, not deterministic flight guarantees.
          </p>
        </div>
      )}
    </div>
  );
};
