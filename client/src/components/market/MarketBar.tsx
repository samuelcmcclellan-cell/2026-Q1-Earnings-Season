import { useQuotes } from '../../hooks/use-market-data';

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' });
}

export function MarketBar() {
  const { data, isLoading } = useQuotes(['SPY', 'QQQ']);

  const quoteMap = new Map((data?.quotes || []).map(q => [q.symbol, q]));
  const spy = quoteMap.get('SPY');
  const qqq = quoteMap.get('QQQ');
  const hasData = spy || qqq;

  return (
    <div className="h-7 bg-bg-primary border-b border-border flex items-center px-4 text-[10px] font-mono tabular-nums gap-4 shrink-0">
      {isLoading ? (
        <span className="text-text-muted">Loading market data...</span>
      ) : hasData ? (
        <>
          {spy && <IndexDisplay label="S&P 500" quote={spy} />}
          {spy && qqq && <span className="text-border">│</span>}
          {qqq && <IndexDisplay label="Nasdaq" quote={qqq} />}
          <span className="text-border">│</span>
          <span className="text-text-muted">Updated {formatTime(new Date())}</span>
        </>
      ) : (
        <span className="text-text-muted">Market data unavailable — configure API keys in .env</span>
      )}
    </div>
  );
}

function IndexDisplay({ label, quote }: { label: string; quote: { price: number; change: number; changePercent: number } }) {
  const isUp = quote.change > 0;
  const isDown = quote.change < 0;
  const colorClass = isUp ? 'text-accent-green' : isDown ? 'text-accent-red' : 'text-text-muted';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-text-secondary font-medium">{label}</span>
      <span className="text-text-primary">{quote.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span className={colorClass}>
        ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
      </span>
    </span>
  );
}
