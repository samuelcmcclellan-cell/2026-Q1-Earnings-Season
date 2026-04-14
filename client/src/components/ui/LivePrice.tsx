import { useQuote } from '../../hooks/use-market-data';

interface LivePriceProps {
  symbol: string;
  showChange?: boolean;
  showPercent?: boolean;
  compact?: boolean;
}

export function LivePrice({ symbol, showChange = true, showPercent = true, compact }: LivePriceProps) {
  const { data, isLoading, isError } = useQuote(symbol);

  if (isLoading) {
    return <span className="inline-block w-20 h-3.5 bg-bg-hover rounded animate-pulse" />;
  }

  if (isError || !data) {
    return (
      <span className="text-text-muted text-xs font-mono" title="No API key configured">
        —
      </span>
    );
  }

  const isUp = data.change > 0;
  const isDown = data.change < 0;
  const arrow = isUp ? '▲' : isDown ? '▼' : '';
  const colorClass = isUp ? 'text-accent-green' : isDown ? 'text-accent-red' : 'text-text-muted';

  if (compact) {
    return (
      <span className="font-mono tabular-nums text-xs inline-flex items-center gap-1">
        <span className="text-text-primary">${data.price.toFixed(2)}</span>
        <span className={colorClass}>
          {arrow}{showPercent && `${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%`}
        </span>
      </span>
    );
  }

  return (
    <span className="font-mono tabular-nums text-xs inline-flex items-center gap-1.5">
      <span className="text-text-muted font-semibold text-[10px]">{symbol}</span>
      <span className="text-text-primary font-medium">${data.price.toFixed(2)}</span>
      {showChange && (
        <span className={colorClass}>
          {arrow}{data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}
        </span>
      )}
      {showPercent && (
        <span className={colorClass}>
          ({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
        </span>
      )}
    </span>
  );
}
