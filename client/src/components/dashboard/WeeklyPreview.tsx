import { useUpcomingEarnings } from '../../hooks/use-calendar';
import { Spinner } from '../ui/Spinner';
import { formatEps, formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { SECTOR_COLORS, MARKET_CAP_LABELS } from '../../lib/constants';

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
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Upcoming Reports</h3>
      </div>
      <div className="divide-y divide-border">
        {dates.map((date) => (
          <div key={date} className="px-3 py-1.5">
            <p className="text-[9px] font-mono text-accent-blue uppercase tracking-wider mb-1">
              {formatDate(date)}
            </p>
            <div className="space-y-0.5">
              {grouped.get(date)!.slice(0, 8).map((e) => (
                <Link
                  key={e.id}
                  to={`/company/${e.ticker}`}
                  className="flex items-center justify-between py-0.5 hover:bg-bg-hover -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-text-primary w-12">{e.ticker}</span>
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: SECTOR_COLORS[e.sector] || '#666' }}
                    />
                    <span className="text-[10px] text-text-muted truncate max-w-[100px]">{e.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-text-muted font-mono uppercase">{e.time_of_day}</span>
                    <span className="font-mono text-[11px] text-text-secondary">Est {formatEps(e.eps_estimate)}</span>
                    <span className="text-[9px] text-text-muted font-mono">{(e as any).market_cap_category?.charAt(0)?.toUpperCase()}</span>
                  </div>
                </Link>
              ))}
              {(grouped.get(date)!.length > 8) && (
                <p className="text-[9px] text-text-muted pl-2">+{grouped.get(date)!.length - 8} more</p>
              )}
            </div>
          </div>
        ))}
        {dates.length === 0 && (
          <p className="text-[11px] text-text-muted px-3 py-4 text-center">No upcoming reports</p>
        )}
      </div>
    </div>
  );
}
