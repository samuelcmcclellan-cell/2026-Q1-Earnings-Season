import { useUpcomingEarnings } from '../../hooks/use-calendar';
import { Spinner } from '../ui/Spinner';
import { formatEps, formatDate, formatCurrency } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { SECTOR_COLORS } from '../../lib/constants';

export function WeeklyPreview() {
  const { data, isLoading } = useUpcomingEarnings(14);

  if (isLoading) return <Spinner size="sm" />;

  // Group by date
  const grouped = new Map<string, typeof data>();
  for (const e of data || []) {
    if (!e.report_date) continue;
    const list = grouped.get(e.report_date) || [];
    list.push(e);
    grouped.set(e.report_date, list);
  }

  const dates = [...grouped.keys()].sort().slice(0, 5);

  return (
    <div className="bg-bg-card border border-border rounded-lg">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Upcoming Reports</h3>
      </div>
      <div className="divide-y divide-border">
        {dates.map((date) => (
          <div key={date} className="px-4 py-2">
            <p className="text-[10px] font-mono text-accent-blue uppercase tracking-wider mb-1.5">
              {formatDate(date)}
            </p>
            <div className="space-y-1">
              {grouped.get(date)!.slice(0, 8).map((e) => (
                <Link
                  key={e.id}
                  to={`/company/${e.ticker}`}
                  className="flex items-center justify-between py-1 hover:bg-bg-hover -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-text-primary w-12">{e.ticker}</span>
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: SECTOR_COLORS[e.sector] || '#666' }}
                    />
                    <span className="text-[11px] text-text-muted truncate max-w-[120px]">{e.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-text-muted font-mono uppercase">{e.time_of_day}</span>
                    <span className="font-mono text-xs text-text-secondary">Est {formatEps(e.eps_estimate)}</span>
                  </div>
                </Link>
              ))}
              {(grouped.get(date)!.length > 8) && (
                <p className="text-[10px] text-text-muted pl-2">+{grouped.get(date)!.length - 8} more</p>
              )}
            </div>
          </div>
        ))}
        {dates.length === 0 && (
          <p className="text-sm text-text-muted px-4 py-6 text-center">No upcoming reports</p>
        )}
      </div>
    </div>
  );
}
