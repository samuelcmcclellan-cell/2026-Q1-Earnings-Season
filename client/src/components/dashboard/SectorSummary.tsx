import { useScorecard } from '../../hooks/use-scorecard';
import { Spinner } from '../ui/Spinner';
import { SECTOR_COLORS } from '../../lib/constants';
import { formatPct } from '../../lib/utils';

export function SectorSummary() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) return <Spinner size="sm" />;

  const sectors = data.bySector.filter(s => s.totalCompanies > 0).sort((a, b) => b.totalCompanies - a.totalCompanies);

  return (
    <div className="bg-bg-card border border-border rounded-lg">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Sector Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-4 text-text-muted font-medium">Sector</th>
              <th className="text-right py-2 px-3 text-text-muted font-medium">Cos</th>
              <th className="text-right py-2 px-3 text-text-muted font-medium">Rptd</th>
              <th className="text-right py-2 px-3 text-text-muted font-medium">EPS Beat</th>
              <th className="text-right py-2 px-3 text-text-muted font-medium">Rev Beat</th>
              <th className="text-right py-2 px-3 text-text-muted font-medium">Avg Surprise</th>
              <th className="text-right py-2 px-4 text-text-muted font-medium">Avg Rxn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sectors.map((s) => (
              <tr key={s.sector} className="hover:bg-bg-hover transition-colors">
                <td className="py-2 px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: SECTOR_COLORS[s.sector] || '#666' }}
                    />
                    <span className="text-text-primary font-medium">{s.sector}</span>
                  </div>
                </td>
                <td className="text-right py-2 px-3 font-mono text-text-secondary">{s.totalCompanies}</td>
                <td className="text-right py-2 px-3 font-mono text-text-secondary">{s.reportedCompanies}</td>
                <td className="text-right py-2 px-3 font-mono">
                  {s.reportedCompanies > 0 ? (
                    <span className={s.pctBeatingEps >= 50 ? 'text-accent-green' : 'text-accent-red'}>
                      {formatPct(s.pctBeatingEps, 0)}
                    </span>
                  ) : (
                    <span className="text-text-muted">--</span>
                  )}
                </td>
                <td className="text-right py-2 px-3 font-mono">
                  {s.reportedCompanies > 0 ? (
                    <span className={s.pctBeatingRev >= 50 ? 'text-accent-green' : 'text-accent-red'}>
                      {formatPct(s.pctBeatingRev, 0)}
                    </span>
                  ) : (
                    <span className="text-text-muted">--</span>
                  )}
                </td>
                <td className="text-right py-2 px-3 font-mono">
                  {s.reportedCompanies > 0 ? (
                    <span className={s.avgEpsSurprisePct > 0 ? 'text-accent-green' : 'text-accent-red'}>
                      {formatPct(s.avgEpsSurprisePct)}
                    </span>
                  ) : (
                    <span className="text-text-muted">--</span>
                  )}
                </td>
                <td className="text-right py-2 px-4 font-mono">
                  {s.reportedCompanies > 0 ? (
                    <span className={s.avgStockReaction > 0 ? 'text-accent-green' : 'text-accent-red'}>
                      {formatPct(s.avgStockReaction)}
                    </span>
                  ) : (
                    <span className="text-text-muted">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
