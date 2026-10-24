import React from 'react';
import {
  LayoutDashboard,
  PlaneTakeoff,
  BrainCircuit,
  Compass,
  BarChart4,
  Database,
  Radio,
  ChevronRight,
  ExternalLink
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
      label: 'Mission Dashboard',
      description: 'Fleet KPIs & delay distribution',
      icon: LayoutDashboard,
    },
    {
      id: 'flight-analysis' as NavTab,
      label: 'Flight Analysis',
      description: 'Search & detailed flight log',
      icon: PlaneTakeoff,
    },
    {
      id: 'predict-delay' as NavTab,
      label: 'Predict Delay',
      description: 'Interactive AI delay engine',
      icon: BrainCircuit,
      badge: 'ML Live',
    },
    {
      id: 'route-intelligence' as NavTab,
      label: 'Route Intelligence',
      description: 'Corridors & hub congestion',
      icon: Compass,
    },
    {
      id: 'model-evaluation' as NavTab,
      label: 'Model Evaluation',
      description: 'Transparent Scikit-Learn metrics',
      icon: BarChart4,
    },
    {
      id: 'data-management' as NavTab,
      label: 'Data Management',
      description: 'FAA schema & ingestion health',
      icon: Database,
    },
  ];

  return (
    <aside className="w-72 shrink-0 border-r border-[#1a2947] bg-[#0c1324] flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1a2947] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 text-white shadow-lg shadow-sky-500/25">
            <Radio className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              AeroIntel <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">AI</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400">Aviation Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="p-3 flex-1 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Analytics & Prediction Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full group text-left px-3.5 py-3 rounded-xl transition-all duration-150 flex items-center justify-between ${
                isActive
                  ? 'bg-sky-500/15 text-sky-200 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                    {item.label}
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                </div>
              </div>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isActive ? 'text-sky-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#1a2947] bg-[#090e1c]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Backend API</span>
            <span className={`font-mono text-[11px] font-semibold flex items-center gap-1 ${isBackendConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isBackendConnected ? 'Connected (Flask)' : 'Offline / Mock'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Model Runtime</span>
            <span className="font-mono text-[11px] text-slate-300">Scikit-Learn 1.8</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>v1.0.0-alpha</span>
            <span className="text-sky-400 flex items-center gap-1">INSA Project</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
