import { useRecentEarnings } from '../../hooks/use-earnings';
import { Badge } from '../ui/Badge';
import { DataSourceDot } from '../ui/DataSourceDot';
import { Spinner } from '../ui/Spinner';
import { formatPct, formatEps, formatDate, classifyResult, numColor } from '../../lib/utils';
import { Link } from 'react-router-dom';

export function RecentReporters() {
  const { data, isLoading } = useRecentEarnings(10);

  if (isLoading) return <Spinner size="sm" />;

  return (
    <div className="bg-bg-card border border-border rounded-lg">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Recent Reports</h3>
      </div>
      <div className="divide-y divide-border">
        {data?.map((e, i) => {
          const epsResult = classifyResult(e.eps_actual, e.eps_estimate);
          return (
            <Link
              key={e.id}
              to={`/company/${e.ticker}`}
              className={`flex items-center justify-between px-3 py-2 hover:bg-bg-hover transition-colors ${i % 2 === 1 ? 'bg-bg-secondary/10' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <DataSourceDot source={e.data_source} />
                <div>
                  <span className="font-mono font-semibold text-[11px] text-text-primary">{e.ticker}</span>
                  <p className="text-[10px] text-text-muted truncate max-w-[120px]">{e.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {e.eps_growth_yoy !== null && (
                  <span className={`font-mono text-[10px] ${numColor(e.eps_growth_yoy)}`} title="EPS YoY">
                    {formatPct(e.eps_growth_yoy)}
                  </span>
                )}
                <div className="text-right">
                  <p className="font-mono text-[10px] text-text-secondary">
                    {formatEps(e.eps_actual)} <span className="text-text-muted">v</span> {formatEps(e.eps_estimate)}
                  </p>
                  <p className="font-mono text-[9px] text-text-muted">{formatDate(e.report_date)}</p>
                </div>
                <Badge variant={epsResult} />
                {e.stock_reaction_pct !== null && (
                  <span className={`font-mono text-[10px] font-medium min-w-[40px] text-right ${numColor(e.stock_reaction_pct)}`}>
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
