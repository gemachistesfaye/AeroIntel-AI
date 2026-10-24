import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Globe, Shield, Terminal } from 'lucide-react';

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
    <header className="sticky top-0 z-20 border-b border-[#1a2947] bg-[#0c1324]/90 backdrop-blur-md px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">AeroIntel Ops</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-medium text-slate-400">{title}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Aviation Clocks */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 font-mono text-xs shadow-inner">
            <div className="flex items-center gap-1.5 text-sky-300">
              <Globe className="h-3.5 w-3.5 text-sky-400" />
              <span>{utcTime || '00:00:00 UTC'}</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{localTime || '00:00:00 Local'}</span>
            </div>
          </div>

          {/* Backend Status indicator */}
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium ${
              isBackendConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span>{isBackendConnected ? 'Flask API Online' : 'API Connecting...'}</span>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50"
            title="Refresh active metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
