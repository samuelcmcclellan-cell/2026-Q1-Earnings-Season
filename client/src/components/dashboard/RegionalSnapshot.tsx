import { useScorecard } from '../../hooks/use-scorecard';
import { Spinner } from '../ui/Spinner';
import { formatPct, numColor } from '../../lib/utils';
import { REGION_LABELS } from '../../lib/constants';
import { Link } from 'react-router-dom';

export function RegionalSnapshot() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) return <Spinner size="sm" />;

  const regions = data.byRegion.filter(r => r.totalCompanies > 0);

  return (
    <div className="bg-bg-card border border-border rounded-lg">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Regional Snapshot</h3>
        <Link to="/regions" className="text-[10px] text-accent-blue hover:underline">View all</Link>
      </div>
      <div className="divide-y divide-border">
        {regions.map(r => (
          <Link
            key={r.region}
            to={`/regions/${encodeURIComponent(REGION_LABELS[r.region] || r.region)}`}
            className="flex items-center justify-between px-3 py-2 hover:bg-bg-hover transition-colors"
          >
            <div>
              <span className="text-xs font-medium text-text-primary">
                {REGION_LABELS[r.region] || r.region}
              </span>
              <span className="text-[10px] text-text-muted font-mono ml-2">
                {r.reportedCompanies}/{r.totalCompanies}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <div className="text-right">
                <span className="text-[9px] text-text-muted block">EPS YoY</span>
                <span className={numColor(r.avgEpsGrowthYoy)}>{formatPct(r.avgEpsGrowthYoy)}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-text-muted block">Rev YoY</span>
                <span className={numColor(r.avgRevenueGrowthYoy)}>{formatPct(r.avgRevenueGrowthYoy)}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-text-muted block">Rxn</span>
                <span className={numColor(r.avgStockReaction)}>{formatPct(r.avgStockReaction)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
