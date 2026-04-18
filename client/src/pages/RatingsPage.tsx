import { useRatings, useGuidance, type TracedValue } from '../hooks/use-canonical';
import { TierBadge } from '../components/ui/TierBadge';
import { Spinner } from '../components/ui/Spinner';
import { StatCard } from '../components/ui/StatCard';

function fmtPct(v: TracedValue | undefined) {
  if (!v || v.value === null) return '—';
  return `${v.value.toFixed(1)}%`;
}

function fmtNum(v: TracedValue | undefined) {
  if (!v || v.value === null) return '—';
  return v.value.toLocaleString();
}

function RatingsBar({ buy, hold, sell }: { buy: number; hold: number; sell: number }) {
  const total = buy + hold + sell || 100;
  return (
    <div className="flex h-4 w-full rounded overflow-hidden bg-bg-secondary border border-border">
      <div className="bg-accent-green/70 flex items-center justify-center text-[9px] font-mono text-white" style={{ width: `${(buy / total) * 100}%` }}>
        {buy.toFixed(0)}%
      </div>
      <div className="bg-accent-amber/70 flex items-center justify-center text-[9px] font-mono" style={{ width: `${(hold / total) * 100}%` }}>
        {hold.toFixed(0)}%
      </div>
      <div className="bg-accent-red/70 flex items-center justify-center text-[9px] font-mono text-white" style={{ width: `${(sell / total) * 100}%` }}>
        {sell.toFixed(0)}%
      </div>
    </div>
  );
}

export function RatingsPage() {
  const { data: ratings, isLoading: l1 } = useRatings();
  const { data: guidance, isLoading: l2 } = useGuidance();

  if (l1 || l2) return <Spinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Targets, Ratings &amp; Guidance</h1>
        <p className="text-xs text-text-muted mt-1">
          Bottom-up price targets, analyst rating distribution, and company guidance counts.
        </p>
      </div>

      {ratings && (
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wider text-text-muted">Price Target</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Bottom-Up Target Price"
              value={ratings.bottom_up_target_price?.value !== null && ratings.bottom_up_target_price?.value !== undefined
                ? `$${ratings.bottom_up_target_price.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : '—'}
              subtitle={ratings.bottom_up_target_price?.as_of}
            />
            <StatCard
              label="Upside vs Closing"
              value={fmtPct(ratings.upside_vs_closing_pct)}
              deltaColor="green"
            />
          </div>
          <p className="text-[10px] text-text-muted flex items-center gap-2">
            <TierBadge tier={ratings.bottom_up_target_price?.source_tier} page={ratings.bottom_up_target_price?.source_page} />
            <span>FactSet bottom-up consensus target</span>
          </p>
        </section>
      )}

      {ratings?.ratings && (
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wider text-text-muted">Analyst Ratings Distribution</h2>
          <div className="bg-bg-card border border-border rounded-lg p-4 space-y-3">
            <RatingsBar
              buy={ratings.ratings.buy_pct?.value ?? 0}
              hold={ratings.ratings.hold_pct?.value ?? 0}
              sell={ratings.ratings.sell_pct?.value ?? 0}
            />
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-accent-green/70" /> Buy {fmtPct(ratings.ratings.buy_pct)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-accent-amber/70" /> Hold {fmtPct(ratings.ratings.hold_pct)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-accent-red/70" /> Sell {fmtPct(ratings.ratings.sell_pct)}
              </span>
              <TierBadge tier={ratings.ratings.buy_pct?.source_tier} page={ratings.ratings.buy_pct?.source_page} />
            </div>
          </div>
        </section>
      )}

      {ratings?.by_sector && ratings.by_sector.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wider text-text-muted">Ratings by Sector</h2>
          <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="text-left px-3 py-2">Sector</th>
                  <th className="text-right px-3 py-2 w-16">Buy</th>
                  <th className="text-right px-3 py-2 w-16">Hold</th>
                  <th className="text-right px-3 py-2 w-16">Sell</th>
                  <th className="px-3 py-2 w-64">Distribution</th>
                  <th className="text-right px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {ratings.by_sector.map((s) => (
                  <tr key={s.sector} className="border-t border-border hover:bg-bg-hover">
                    <td className="px-3 py-2 text-text-primary">{s.sector}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtPct(s.buy_pct)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtPct(s.hold_pct)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtPct(s.sell_pct)}</td>
                    <td className="px-3 py-2">
                      <RatingsBar
                        buy={s.buy_pct?.value ?? 0}
                        hold={s.hold_pct?.value ?? 0}
                        sell={s.sell_pct?.value ?? 0}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <TierBadge tier={s.buy_pct?.source_tier} page={s.buy_pct?.source_page} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {guidance && (
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wider text-text-muted">Guidance Counts</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Positive EPS Guidance" value={fmtNum(guidance.eps_positive_count)} deltaColor="green" />
            <StatCard label="Negative EPS Guidance" value={fmtNum(guidance.eps_negative_count)} deltaColor="red" />
            {guidance.eps_positive_5yr_avg && (
              <StatCard label="5yr Avg Positive" value={fmtNum(guidance.eps_positive_5yr_avg)} />
            )}
            {guidance.revenue_positive_count && (
              <StatCard label="Positive Rev Guidance" value={fmtNum(guidance.revenue_positive_count)} deltaColor="green" />
            )}
          </div>
          <p className="text-[10px] text-text-muted flex items-center gap-2">
            <TierBadge tier={guidance.eps_positive_count?.source_tier} page={guidance.eps_positive_count?.source_page} />
            <span>Company-issued EPS guidance for the next quarter</span>
          </p>
        </section>
      )}
    </div>
  );
}
