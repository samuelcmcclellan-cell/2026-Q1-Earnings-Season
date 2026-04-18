import { useForwardOutlook, useValuation, useMargin, type TracedValue } from '../hooks/use-canonical';
import { TierBadge } from '../components/ui/TierBadge';
import { Spinner } from '../components/ui/Spinner';

function fmtPct(v: TracedValue | undefined) {
  if (!v || v.value === null) return '—';
  return `${v.value > 0 ? '+' : ''}${v.value.toFixed(1)}%`;
}

function fmtRatio(v: TracedValue | undefined) {
  if (!v || v.value === null) return '—';
  return v.value.toFixed(1) + 'x';
}

function OutlookCard({
  label,
  value,
  traced,
}: {
  label: string;
  value: string;
  traced: TracedValue | undefined;
}) {
  return (
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
        {traced && <TierBadge tier={traced.source_tier} page={traced.source_page} asOf={traced.as_of} />}
      </div>
      <div className="font-mono text-xl font-semibold text-text-primary">{value}</div>
    </div>
  );
}

export function ForwardOutlookPage() {
  const { data: outlook, isLoading: l1 } = useForwardOutlook();
  const { data: val, isLoading: l2 } = useValuation();
  const { data: mgn, isLoading: l3 } = useMargin();

  if (l1 || l2 || l3) return <Spinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Forward Outlook</h1>
        <p className="text-xs text-text-muted mt-1">
          Forward growth, valuation, and margin expectations per FactSet Earnings Insight.
        </p>
      </div>

      {outlook && (
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wider text-text-muted">Forward Growth</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <OutlookCard label="CY26 EPS Growth" value={fmtPct(outlook.cy_2026_eps_growth)} traced={outlook.cy_2026_eps_growth} />
            <OutlookCard label="CY26 Revenue Growth" value={fmtPct(outlook.cy_2026_revenue_growth)} traced={outlook.cy_2026_revenue_growth} />
            <OutlookCard label="Q2'26 EPS Growth" value={fmtPct(outlook.q2_2026_eps_growth)} traced={outlook.q2_2026_eps_growth} />
            <OutlookCard label="Q2'26 Revenue Growth" value={fmtPct(outlook.q2_2026_revenue_growth)} traced={outlook.q2_2026_revenue_growth} />
            {outlook.q3_2026_eps_growth && (
              <OutlookCard label="Q3'26 EPS Growth" value={fmtPct(outlook.q3_2026_eps_growth)} traced={outlook.q3_2026_eps_growth} />
            )}
            {outlook.q3_2026_revenue_growth && (
              <OutlookCard label="Q3'26 Rev Growth" value={fmtPct(outlook.q3_2026_revenue_growth)} traced={outlook.q3_2026_revenue_growth} />
            )}
            {outlook.q4_2026_eps_growth && (
              <OutlookCard label="Q4'26 EPS Growth" value={fmtPct(outlook.q4_2026_eps_growth)} traced={outlook.q4_2026_eps_growth} />
            )}
            {outlook.q4_2026_revenue_growth && (
              <OutlookCard label="Q4'26 Rev Growth" value={fmtPct(outlook.q4_2026_revenue_growth)} traced={outlook.q4_2026_revenue_growth} />
            )}
          </div>
        </section>
      )}

      {val && (
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wider text-text-muted">Valuation</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <OutlookCard label="Forward P/E (12m)" value={fmtRatio(val.forward_pe_12m)} traced={val.forward_pe_12m} />
            <OutlookCard label="Forward P/E 5yr avg" value={fmtRatio(val.forward_pe_5yr_avg)} traced={val.forward_pe_5yr_avg} />
            <OutlookCard label="Forward P/E 10yr avg" value={fmtRatio(val.forward_pe_10yr_avg)} traced={val.forward_pe_10yr_avg} />
            <OutlookCard label="Trailing P/E (12m)" value={fmtRatio(val.trailing_pe_12m)} traced={val.trailing_pe_12m} />
          </div>
          {val.by_sector && val.by_sector.length > 0 && (
            <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left px-3 py-2">Sector</th>
                    <th className="text-right px-3 py-2">Fwd P/E (12m)</th>
                    <th className="text-right px-3 py-2">5yr Avg</th>
                    <th className="text-right px-3 py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {val.by_sector.map((s) => (
                    <tr key={s.sector} className="border-t border-border hover:bg-bg-hover">
                      <td className="px-3 py-2 text-text-primary">{s.sector}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmtRatio(s.forward_pe_12m)}</td>
                      <td className="px-3 py-2 text-right font-mono text-text-muted">{fmtRatio(s.forward_pe_5yr_avg)}</td>
                      <td className="px-3 py-2 text-right">
                        <TierBadge tier={s.forward_pe_12m?.source_tier} page={s.forward_pe_12m?.source_page} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {mgn && (
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wider text-text-muted">Net Profit Margin</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <OutlookCard label="Net Profit Margin" value={fmtPct(mgn.net_profit_margin)} traced={mgn.net_profit_margin} />
            {mgn.net_profit_margin_5yr_avg && (
              <OutlookCard label="5yr Avg" value={fmtPct(mgn.net_profit_margin_5yr_avg)} traced={mgn.net_profit_margin_5yr_avg} />
            )}
          </div>
          {mgn.by_sector && mgn.by_sector.length > 0 && (
            <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left px-3 py-2">Sector</th>
                    <th className="text-right px-3 py-2">Net Profit Margin</th>
                    <th className="text-right px-3 py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {mgn.by_sector.map((s) => (
                    <tr key={s.sector} className="border-t border-border hover:bg-bg-hover">
                      <td className="px-3 py-2 text-text-primary">{s.sector}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmtPct(s.net_profit_margin)}</td>
                      <td className="px-3 py-2 text-right">
                        <TierBadge tier={s.net_profit_margin?.source_tier} page={s.net_profit_margin?.source_page} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
