import { useBottomUpEps } from '../hooks/use-canonical';
import { TierBadge } from '../components/ui/TierBadge';
import { Spinner } from '../components/ui/Spinner';
import { BottomUpEpsTrend } from '../components/charts/BottomUpEpsTrend';

export function BottomUpEpsPage() {
  const { data, isLoading } = useBottomUpEps();

  if (isLoading) return <Spinner />;
  if (!data) return <div className="text-text-muted text-sm">No bottom-up EPS data.</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Bottom-Up EPS</h1>
        <p className="text-xs text-text-muted mt-1">
          Quarterly bottom-up EPS estimate and actual series — S&amp;P 500 aggregate.
        </p>
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-3">
        <BottomUpEpsTrend series={data.series} />
      </div>

      <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-muted">
            <tr>
              <th className="text-left px-3 py-2">Period</th>
              <th className="text-right px-3 py-2">Bottom-Up EPS</th>
              <th className="text-right px-3 py-2">Unit</th>
              <th className="text-right px-3 py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {data.series.map((p) => (
              <tr key={p.period} className="border-t border-border hover:bg-bg-hover">
                <td className="px-3 py-2 text-text-primary font-mono">{p.period}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {p.eps.value === null ? '—' : `$${p.eps.value.toFixed(2)}`}
                </td>
                <td className="px-3 py-2 text-right text-text-muted text-xs">{p.eps.unit}</td>
                <td className="px-3 py-2 text-right">
                  <TierBadge tier={p.eps.source_tier} page={p.eps.source_page} asOf={p.eps.as_of} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.notes && <p className="text-[11px] text-text-muted italic">{data.notes}</p>}
    </div>
  );
}
