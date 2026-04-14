import { DATA_SOURCE_LABELS } from '../../lib/constants';

const sourceColors: Record<string, string> = {
  seed: '#f59e0b',
  fmp: '#22c55e',
  finnhub: '#3b82f6',
  csv_import: '#a855f7',
};

interface DataSourceDotProps {
  source: string;
  showLabel?: boolean;
}

export function DataSourceDot({ source, showLabel }: DataSourceDotProps) {
  const color = sourceColors[source] || '#64748b';
  const label = DATA_SOURCE_LABELS[source] || source;

  return (
    <span className="inline-flex items-center gap-1" title={`Data source: ${label}`}>
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {showLabel && <span className="text-[9px] text-text-muted font-mono">{label}</span>}
    </span>
  );
}
