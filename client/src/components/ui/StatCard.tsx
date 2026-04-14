import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaColor?: 'green' | 'red' | 'yellow' | 'blue' | 'amber';
  icon?: ReactNode;
  subtitle?: string;
  accentColor?: string;
}

export function StatCard({ label, value, delta, deltaColor = 'green', icon, subtitle, accentColor }: StatCardProps) {
  const deltaColors = {
    green: 'text-accent-green',
    red: 'text-accent-red',
    yellow: 'text-accent-yellow',
    amber: 'text-accent-amber',
    blue: 'text-accent-blue',
  };

  return (
    <div
      className="bg-bg-card border border-border rounded-lg p-3 hover:border-border-light transition-colors relative overflow-hidden"
      style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 3 } : undefined}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-text-muted text-[10px] font-medium uppercase tracking-wider">{label}</span>
        {icon && <span className="text-text-muted opacity-60">{icon}</span>}
      </div>
      <div className="font-mono text-lg font-semibold text-text-primary leading-tight">{value}</div>
      {(delta || subtitle) && (
        <div className="mt-0.5 flex items-center gap-1.5">
          {delta && <span className={cn('text-[11px] font-mono font-medium', deltaColors[deltaColor])}>{delta}</span>}
          {subtitle && <span className="text-text-muted text-[10px]">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
