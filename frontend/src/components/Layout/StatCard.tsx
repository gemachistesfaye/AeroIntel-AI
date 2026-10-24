import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  accentColor?: 'sky' | 'emerald' | 'amber' | 'rose' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'sky',
}) => {
  const colorStyles = {
    sky: 'border-sky-500/20 bg-gradient-to-br from-[#111e3b]/90 to-[#0b1426]/90 text-sky-400',
    emerald: 'border-emerald-500/20 bg-gradient-to-br from-[#0c2e26]/90 to-[#081f1a]/90 text-emerald-400',
    amber: 'border-amber-500/20 bg-gradient-to-br from-[#2e230e]/90 to-[#1f1709]/90 text-amber-400',
    rose: 'border-rose-500/20 bg-gradient-to-br from-[#2f111e]/90 to-[#1f0a13]/90 text-rose-400',
    indigo: 'border-indigo-500/20 bg-gradient-to-br from-[#1a173b]/90 to-[#0f0e26]/90 text-indigo-400',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition-all hover:border-slate-600 ${colorStyles[accentColor]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="rounded-xl bg-slate-800/80 p-2.5 text-current shadow-inner border border-slate-700/50">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">{value}</span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value}
            {trend.label && <span className="ml-1 text-slate-400 font-normal">{trend.label}</span>}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-2 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
