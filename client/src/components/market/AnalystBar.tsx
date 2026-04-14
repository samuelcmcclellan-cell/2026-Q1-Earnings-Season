import { useRecommendations } from '../../hooks/use-market-data';

interface AnalystBarProps {
  symbol: string;
}

const segments = [
  { key: 'strongBuy', label: 'Strong Buy', color: '#15803d' },
  { key: 'buy', label: 'Buy', color: '#22c55e' },
  { key: 'hold', label: 'Hold', color: '#f59e0b' },
  { key: 'sell', label: 'Sell', color: '#ef4444' },
  { key: 'strongSell', label: 'Strong Sell', color: '#991b1b' },
] as const;

export function AnalystBar({ symbol }: AnalystBarProps) {
  const { data, isLoading } = useRecommendations(symbol);

  if (isLoading) {
    return <div className="w-[200px] h-4 bg-bg-hover rounded animate-pulse" />;
  }

  if (!data) return null;

  const total = data.strongBuy + data.buy + data.hold + data.sell + data.strongSell;
  if (total === 0) return null;

  return (
    <div className="inline-block">
      <div className="flex rounded overflow-hidden h-4" style={{ width: 200 }}>
        {segments.map(({ key, color }) => {
          const count = data[key as keyof typeof data] as number;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={key}
              style={{ width: `${pct}%`, backgroundColor: color }}
              title={`${key}: ${count}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-0.5" style={{ width: 200 }}>
        {segments.map(({ key, label, color }) => {
          const count = data[key as keyof typeof data] as number;
          if (count === 0) return null;
          return (
            <span key={key} className="text-[8px] font-mono" style={{ color }}>
              {count}
            </span>
          );
        })}
      </div>
      <p className="text-[8px] text-text-muted mt-0.5 font-mono">Analyst Consensus</p>
    </div>
  );
}
