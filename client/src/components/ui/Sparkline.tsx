import { usePriceHistory } from '../../hooks/use-market-data';

interface SparklineProps {
  symbol: string;
  width?: number;
  height?: number;
}

export function Sparkline({ symbol, width = 80, height = 24 }: SparklineProps) {
  const { data, isLoading } = usePriceHistory(symbol);

  if (isLoading || !data || data.prices.length === 0) {
    return (
      <svg width={width} height={height} className="inline-block">
        <rect x={0} y={0} width={width} height={height} rx={2} fill="currentColor" className="text-bg-hover opacity-40" />
      </svg>
    );
  }

  const prices = data.prices.map(p => p.close);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const padding = 2;
  const plotH = height - padding * 2;
  const plotW = width - padding * 2;

  const points = prices.map((p, i) => {
    const x = padding + (i / (prices.length - 1)) * plotW;
    const y = padding + plotH - ((p - min) / range) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const isUp = prices[prices.length - 1] >= prices[0];
  const strokeColor = isUp ? 'var(--color-accent-green)' : 'var(--color-accent-red)';

  // Gradient fill polygon: line + bottom edge
  const fillPoints = `${points.join(' ')} ${(padding + plotW).toFixed(1)},${(height - padding).toFixed(1)} ${padding.toFixed(1)},${(height - padding).toFixed(1)}`;
  const gradientId = `spark-${symbol}`;

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gradientId})`} />
      <polyline points={points.join(' ')} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
