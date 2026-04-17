import { useMemo } from 'react';
import { useCalendar } from '../hooks/use-calendar';
import { useUIStore } from '../stores/ui.store';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { formatEps, formatPct, classifyResult } from '../lib/utils';
import { SECTOR_COLORS } from '../lib/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, startOfWeek, addDays } from 'date-fns';
import { Link } from 'react-router-dom';

export function CalendarPage() {
  const { calendarWeekOffset, setCalendarWeekOffset } = useUIStore();

  const { monday, friday, fromStr, toStr } = useMemo(() => {
    const base = addWeeks(new Date(), calendarWeekOffset);
    const mon = startOfWeek(base, { weekStartsOn: 1 });
    const fri = addDays(mon, 4);
    return {
      monday: mon,
      friday: fri,
      fromStr: format(mon, 'yyyy-MM-dd'),
      toStr: format(fri, 'yyyy-MM-dd'),
    };
  }, [calendarWeekOffset]);

  const { data, isLoading } = useCalendar(fromStr, toStr);

  const days = useMemo(() => {
    // /api/calendar may return either a bare array or an object { entries: [...] }.
    // Defensively normalize to an array before filtering to avoid runtime crashes.
    const allEntries: any[] = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.entries)
        ? (data as any).entries
        : [];
    const result: { date: string; label: string; entries: any[] }[] = [];
    for (let i = 0; i < 5; i++) {
      const d = addDays(monday, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      result.push({
        date: dateStr,
        label: format(d, 'EEE, MMM d'),
        entries: allEntries.filter((e) => e.report_date === dateStr),
      });
    }
    return result;
  }, [monday, data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Earnings Calendar</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCalendarWeekOffset(calendarWeekOffset - 1)}
            className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-mono text-text-secondary min-w-[180px] text-center">
            {format(monday, 'MMM d')} - {format(friday, 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setCalendarWeekOffset(calendarWeekOffset + 1)}
            className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCalendarWeekOffset(0)}
            className="text-xs text-accent-blue hover:underline ml-2"
          >
            This Week
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {days.map(({ date, label, entries }) => (
            <div key={date} className="bg-bg-card border border-border rounded-lg min-h-[300px]">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-[11px] font-mono font-semibold text-text-secondary">{label}</p>
                <p className="text-[10px] text-text-muted">{entries.length} reports</p>
              </div>
              <div className="p-1.5 space-y-1">
                {entries.map((e) => {
                  const epsResult = classifyResult(e.eps_actual, e.eps_estimate);
                  const isReported = e.status === 'reported';
                  return (
                    <Link
                      key={e.id}
                      to={`/company/${e.ticker}`}
                      className={`block p-2 rounded-md text-xs transition-colors ${
                        isReported
                          ? epsResult === 'beat'
                            ? 'bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/20'
                            : epsResult === 'miss'
                            ? 'bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20'
                            : 'bg-bg-hover hover:bg-bg-hover/80 border border-border'
                          : 'bg-bg-secondary hover:bg-bg-hover border border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-mono font-bold text-text-primary">{e.ticker}</span>
                        <span className="text-[9px] text-text-muted font-mono uppercase">{e.time_of_day}</span>
                      </div>
                      <p className="text-[10px] text-text-muted truncate mb-1">{e.name}</p>
                      {isReported ? (
                        <div className="flex items-center justify-between">
                          <Badge variant={epsResult} />
                          {e.stock_reaction_pct !== null && (
                            <span className={`font-mono text-[10px] font-medium ${e.stock_reaction_pct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                              {formatPct(e.stock_reaction_pct)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="font-mono text-[10px] text-text-muted">Est {formatEps(e.eps_estimate)}</p>
                      )}
                    </Link>
                  );
                })}
                {entries.length === 0 && (
                  <p className="text-[10px] text-text-muted text-center py-4">No reports</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
