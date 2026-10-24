import React from 'react';
import {
  LayoutDashboard,
  PlaneTakeoff,
  Compass,
  BarChart3,
  Database,
  Radio,
  ChevronRight,
  Calculator,
  ShieldCheck
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'flight-analysis'
  | 'predict-delay'
  | 'route-intelligence'
  | 'model-evaluation'
  | 'data-management';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isBackendConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isBackendConnected }) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Overview',
      description: 'Fleet KPIs & delay distribution',
      icon: LayoutDashboard,
    },
    {
      id: 'flight-analysis' as NavTab,
      label: 'Flights & Telemetry',
      description: 'Flight log, search & turnarounds',
      icon: PlaneTakeoff,
    },
    {
      id: 'predict-delay' as NavTab,
      label: 'Delay Predictor',
      description: 'Pre-departure ML simulator',
      icon: Calculator,
      badge: 'ML 1.0',
    },
    {
      id: 'route-intelligence' as NavTab,
      label: 'Routes & Air Corridors',
      description: 'Interactive map & hub congestion',
      icon: Compass,
    },
    {
      id: 'model-evaluation' as NavTab,
      label: 'Model Performance',
      description: 'Verified metrics & comparisons',
      icon: BarChart3,
    },
    {
      id: 'data-management' as NavTab,
      label: 'Data & Ingestion',
      description: 'BTS schema, uploads & audits',
      icon: Database,
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-[#0d1322] flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-semibold tracking-tight text-white">AeroIntel</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-sky-300 border border-slate-700">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Aviation Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="p-2.5 flex-1 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full group text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between ${
                isActive
                  ? 'bg-sky-500/10 text-white border border-sky-500/30 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <div className="truncate">
                  <div className="text-xs flex items-center gap-1.5">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                  isActive ? 'text-sky-400' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#0a0f1b]">
        <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Backend API</span>
            <span className={`text-[11px] font-medium flex items-center gap-1.5 ${isBackendConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isBackendConnected ? 'Connected' : 'Offline (Demo)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Model</span>
            <span className="text-[11px] text-slate-300 font-mono">Logistic Reg.</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
