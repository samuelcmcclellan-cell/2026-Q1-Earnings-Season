import { useSurprises, type Surprise } from '../hooks/use-canonical';
import { TierBadge } from '../components/ui/TierBadge';
import { Spinner } from '../components/ui/Spinner';

function fmtPct(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function SurpriseTable({ title, rows }: { title: string; rows: Surprise[] | undefined }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-border text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {title}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-muted">
          <tr>
            <th className="text-left px-3 py-2">Ticker</th>
            <th className="text-left px-3 py-2">Company</th>
            <th className="text-right px-3 py-2">Surprise</th>
            <th className="text-right px-3 py-2">Stock Reaction</th>
            <th className="text-right px-3 py-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.ticker}-${i}`} className="border-t border-border hover:bg-bg-hover">
              <td className="px-3 py-2 font-mono text-accent-blue">{r.ticker}</td>
              <td className="px-3 py-2 text-text-secondary">{r.name || '—'}</td>
              <td className={`px-3 py-2 text-right font-mono ${(r.surprise_pct.value ?? 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {fmtPct(r.surprise_pct.value)}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${(r.stock_reaction_pct?.value ?? 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {fmtPct(r.stock_reaction_pct?.value ?? null)}
              </td>
              <td className="px-3 py-2 text-right">
                <TierBadge tier={r.surprise_pct.source_tier} page={r.surprise_pct.source_page} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SurprisesPage() {
  const { data, isLoading } = useSurprises();
  if (isLoading) return <Spinner />;
  if (!data) return <div className="text-text-muted text-sm">No surprise data.</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Top &amp; Bottom Surprises</h1>
        <p className="text-xs text-text-muted mt-1">Largest positive and negative EPS and revenue surprises this quarter.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SurpriseTable title="Top Positive EPS Surprises" rows={data.eps_top} />
        <SurpriseTable title="Top Negative EPS Surprises" rows={data.eps_bottom} />
        <SurpriseTable title="Top Positive Revenue Surprises" rows={data.revenue_top} />
        <SurpriseTable title="Top Negative Revenue Surprises" rows={data.revenue_bottom} />
      </div>
    </div>
  );
}
