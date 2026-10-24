import React from 'react';
import { RiskTier } from '../../types/aviation';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'low' | 'moderate' | 'high' | 'severe' | 'info' | 'carrier' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    severe: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-slate-800 text-slate-300 border-slate-700',
    carrier: 'bg-slate-800 text-slate-300 border-slate-700 font-mono',
    default: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const RiskBadge: React.FC<{ tier: RiskTier | string }> = ({ tier }) => {
  const cleanTier = tier.toLowerCase();
  let variant: 'low' | 'moderate' | 'high' | 'severe' = 'low';

  if (cleanTier.includes('severe') || cleanTier.includes('critical')) variant = 'severe';
  else if (cleanTier.includes('high') || cleanTier.includes('mod')) variant = 'moderate';

  return <Badge variant={variant}>{tier}</Badge>;
};
