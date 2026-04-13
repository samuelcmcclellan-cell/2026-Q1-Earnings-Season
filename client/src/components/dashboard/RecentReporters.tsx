import { useRecentEarnings } from '../../hooks/use-earnings';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { formatPct, formatEps, formatDate, classifyResult } from '../../lib/utils';
import { Link } from 'react-router-dom';

export function RecentReporters() {
  const { data, isLoading } = useRecentEarnings(10);

  if (isLoading) return <Spinner size="sm" />;

  return (
    <div className="bg-bg-card border border-border rounded-lg">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Recent Reports</h3>
      </div>
      <div className="divide-y divide-border">
        {data?.map((e) => {
          const epsResult = classifyResult(e.eps_actual, e.eps_estimate);
          return (
            <Link
              key={e.id}
              to={`/company/${e.ticker}`}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-bg-hover transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <span className="font-mono font-semibold text-sm text-text-primary">{e.ticker}</span>
                  <p className="text-[11px] text-text-muted truncate max-w-[140px]">{e.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="font-mono text-xs text-text-secondary">
                    {formatEps(e.eps_actual)} <span className="text-text-muted">vs</span> {formatEps(e.eps_estimate)}
                  </p>
                  <p className="font-mono text-xs text-text-muted">{formatDate(e.report_date)}</p>
                </div>
                <Badge variant={epsResult} />
                {e.stock_reaction_pct !== null && (
                  <span className={`font-mono text-xs font-medium ${e.stock_reaction_pct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {formatPct(e.stock_reaction_pct)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
