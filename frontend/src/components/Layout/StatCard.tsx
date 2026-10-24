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
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#111827] p-5 transition-all hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className="rounded-lg p-2 border border-slate-800 bg-slate-900 text-slate-400">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white font-mono">{value}</span>
        {trend && (
          <span className="inline-flex items-center text-xs font-medium text-slate-400">
            {trend.value}
            {trend.label && <span className="ml-1 text-slate-500 font-normal">{trend.label}</span>}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
