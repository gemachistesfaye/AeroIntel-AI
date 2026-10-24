import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Globe } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  isBackendConnected,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
      setLocalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#0d1322]/90 backdrop-blur-md px-6 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Aviation Clocks - Neutral Monochromatic */}
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-slate-400" />
              <span>{utcTime || '00:00:00 UTC'}</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{localTime || '00:00:00'}</span>
            </div>
          </div>

          {/* Backend Status indicator */}
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              isBackendConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-800 bg-slate-900 text-slate-400'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{isBackendConnected ? 'API Connected' : 'Offline Demo'}</span>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
            title="Refresh active metrics"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
