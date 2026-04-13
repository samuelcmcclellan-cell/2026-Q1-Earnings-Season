import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaColor?: 'green' | 'red' | 'yellow' | 'blue';
  icon?: ReactNode;
  subtitle?: string;
}

export function StatCard({ label, value, delta, deltaColor = 'green', icon, subtitle }: StatCardProps) {
  const deltaColors = {
    green: 'text-accent-green',
    red: 'text-accent-red',
    yellow: 'text-accent-yellow',
    blue: 'text-accent-blue',
  };

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4 hover:bg-bg-hover transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <div className="font-mono text-2xl font-semibold text-text-primary">{value}</div>
      {(delta || subtitle) && (
        <div className="mt-1 flex items-center gap-2">
          {delta && <span className={cn('text-sm font-mono font-medium', deltaColors[deltaColor])}>{delta}</span>}
          {subtitle && <span className="text-text-muted text-xs">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
