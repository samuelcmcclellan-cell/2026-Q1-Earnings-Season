import { useGeographic, type TracedValue } from '../hooks/use-canonical';
import { TierBadge } from '../components/ui/TierBadge';
import { Spinner } from '../components/ui/Spinner';

function fmtPct(v: TracedValue | undefined) {
  if (!v || v.value === null) return '—';
  return `${v.value.toFixed(1)}%`;
}

function StackedBar({ us, intl }: { us: number; intl: number }) {
  const total = us + intl || 100;
  const usPct = (us / total) * 100;
  const intlPct = (intl / total) * 100;
  return (
    <div className="flex h-4 w-full rounded overflow-hidden bg-bg-secondary border border-border">
      <div className="bg-accent-blue/70 flex items-center justify-center text-[9px] font-mono" style={{ width: `${usPct}%` }}>
        {us.toFixed(0)}%
      </div>
      <div className="bg-accent-amber/70 flex items-center justify-center text-[9px] font-mono" style={{ width: `${intlPct}%` }}>
        {intl.toFixed(0)}%
      </div>
    </div>
  );
}

export function GeographicPage() {
  const { data, isLoading } = useGeographic();

  if (isLoading) return <Spinner />;
  if (!data) return <div className="text-text-muted text-sm">No geographic data.</div>;

  const us = data.sp500_revenue_us?.value ?? 0;
  const intl = data.sp500_revenue_intl?.value ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Geographic Revenue Exposure</h1>
        <p className="text-xs text-text-muted mt-1">
          S&amp;P 500 revenue split between United States and international — FactSet Earnings Insight.
        </p>
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">S&amp;P 500 Aggregate</h2>
          <TierBadge
            tier={data.sp500_revenue_us?.source_tier}
            page={data.sp500_revenue_us?.source_page}
            asOf={data.sp500_revenue_us?.as_of}
          />
        </div>
        <StackedBar us={us} intl={intl} />
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-accent-blue/70" />
            <span className="text-text-secondary">US {fmtPct(data.sp500_revenue_us)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-accent-amber/70" />
            <span className="text-text-secondary">International {fmtPct(data.sp500_revenue_intl)}</span>
          </span>
        </div>

        {data.growth_by_region && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Growth — Companies &gt;50% US Revenue</div>
              <div className="font-mono text-lg text-text-primary">{fmtPct(data.growth_by_region.us)}</div>
              <TierBadge
                tier={data.growth_by_region.us?.source_tier}
                page={data.growth_by_region.us?.source_page}
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Growth — Companies &gt;50% Intl Revenue</div>
              <div className="font-mono text-lg text-text-primary">{fmtPct(data.growth_by_region.intl)}</div>
              <TierBadge
                tier={data.growth_by_region.intl?.source_tier}
                page={data.growth_by_region.intl?.source_page}
              />
            </div>
          </div>
        )}
      </div>

      {data.by_sector && data.by_sector.length > 0 && (
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-[11px] font-medium uppercase tracking-wider text-text-muted">
            By Sector
          </div>
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="text-left px-3 py-2">Sector</th>
                <th className="text-right px-3 py-2 w-20">US</th>
                <th className="text-right px-3 py-2 w-20">Intl</th>
                <th className="px-3 py-2 w-64">Split</th>
                <th className="text-right px-3 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {data.by_sector.map((s) => {
                const u = s.us_revenue_pct?.value ?? 0;
                const i = s.intl_revenue_pct?.value ?? 0;
                return (
                  <tr key={s.sector} className="border-t border-border hover:bg-bg-hover">
                    <td className="px-3 py-2 text-text-primary">{s.sector}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtPct(s.us_revenue_pct)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtPct(s.intl_revenue_pct)}</td>
                    <td className="px-3 py-2">
                      <StackedBar us={u} intl={i} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <TierBadge tier={s.us_revenue_pct?.source_tier} page={s.us_revenue_pct?.source_page} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
