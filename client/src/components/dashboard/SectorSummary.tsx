import { useScorecard } from '../../hooks/use-scorecard';
import { Spinner } from '../ui/Spinner';
import { SECTOR_COLORS } from '../../lib/constants';
import { formatPct, numColor } from '../../lib/utils';
import { Link } from 'react-router-dom';

export function SectorSummary() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) return <Spinner size="sm" />;

  const sectors = data.bySector.filter(s => s.totalCompanies > 0).sort((a, b) => b.totalCompanies - a.totalCompanies);

  return (
    <div className="bg-bg-card border border-border rounded-lg">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Sector Breakdown</h3>
        <Link to="/sectors" className="text-[10px] text-accent-blue hover:underline">Detail</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1.5 px-3 text-text-muted font-medium">Sector</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Rptd</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">EPS YoY</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Rev YoY</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Beat%</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Margin</th>
              <th className="text-right py-1.5 px-3 text-text-muted font-medium">Rxn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sectors.map((s, i) => (
              <tr key={s.sector} className={`hover:bg-bg-hover transition-colors ${i % 2 === 1 ? 'bg-bg-card' : 'bg-bg-secondary/20'}`}>
                <td className="py-1.5 px-3">
                  <Link to={`/sectors/${encodeURIComponent(s.sector)}`} className="flex items-center gap-1.5 hover:text-accent-blue">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: SECTOR_COLORS[s.sector] || '#666' }}
                    />
                    <span className="text-text-primary font-medium text-xs">{s.sector}</span>
                  </Link>
                </td>
                <td className="text-right py-1.5 px-2 font-mono text-text-secondary">
                  {s.reportedCompanies}/{s.totalCompanies}
                </td>
                <td className="text-right py-1.5 px-2 font-mono">
                  {s.reportedCompanies > 0 ? (
                    <span className={numColor(s.avgEpsGrowthYoy)}>{formatPct(s.avgEpsGrowthYoy)}</span>
                  ) : <span className="text-text-muted">--</span>}
                </td>
                <td className="text-right py-1.5 px-2 font-mono">
                  {s.reportedCompanies > 0 ? (
                    <span className={numColor(s.avgRevenueGrowthYoy)}>{formatPct(s.avgRevenueGrowthYoy)}</span>
                  ) : <span className="text-text-muted">--</span>}
                </td>
                <td className="text-right py-1.5 px-2 font-mono">
                  {s.reportedCompanies > 0 ? (
                    <span className={numColor(s.pctBeatingEps - 50)}>{formatPct(s.pctBeatingEps, 0)}</span>
                  ) : <span className="text-text-muted">--</span>}
                </td>
                <td className="text-right py-1.5 px-2 font-mono">
                  {s.avgGrossMargin > 0 ? (
                    <span className="text-text-secondary">{s.avgGrossMargin.toFixed(1)}%</span>
                  ) : <span className="text-text-muted">--</span>}
                </td>
                <td className="text-right py-1.5 px-3 font-mono">
                  {s.reportedCompanies > 0 ? (
                    <span className={numColor(s.avgStockReaction)}>{formatPct(s.avgStockReaction)}</span>
                  ) : <span className="text-text-muted">--</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
