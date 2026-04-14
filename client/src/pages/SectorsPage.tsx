import { useScorecard } from '../hooks/use-scorecard';
import { SECTOR_COLORS } from '../lib/constants';
import { formatPct, numColor } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export function SectorsPage() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) return <Spinner />;

  const sectors = data.bySector
    .filter(s => s.totalCompanies > 0)
    .sort((a, b) => b.avgEpsGrowthYoy - a.avgEpsGrowthYoy);

  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-text-muted mb-3">Sector Analysis</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {sectors.map(s => {
          const isReported = s.reportedCompanies > 0;
          const marginDir = s.avgGrossMargin > 0 ? (s.avgGrossMargin > (s.avgGrossMargin * 0.98) ? 'up' : 'down') : null;
          const MarginIcon = marginDir === 'up' ? ArrowUp : marginDir === 'down' ? ArrowDown : Minus;

          return (
            <Link
              key={s.sector}
              to={`/sectors/${encodeURIComponent(s.sector)}`}
              className="bg-bg-card border border-border rounded-lg p-3 hover:border-border-light transition-colors relative overflow-hidden"
              style={{ borderLeftColor: SECTOR_COLORS[s.sector] || '#666', borderLeftWidth: 3 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-primary">{s.sector}</span>
                <span className="text-[10px] font-mono text-text-muted">
                  {s.reportedCompanies}/{s.totalCompanies}
                </span>
              </div>

              {isReported ? (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div>
                      <span className="text-[9px] text-text-muted uppercase">EPS YoY</span>
                      <p className={`font-mono text-sm font-semibold ${numColor(s.avgEpsGrowthYoy)}`}>
                        {formatPct(s.avgEpsGrowthYoy)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted uppercase">Rev YoY</span>
                      <p className={`font-mono text-sm font-semibold ${numColor(s.avgRevenueGrowthYoy)}`}>
                        {formatPct(s.avgRevenueGrowthYoy)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted uppercase">Beat Rate</span>
                      <p className={`font-mono text-[11px] ${numColor(s.pctBeatingEps - 50)}`}>
                        {formatPct(s.pctBeatingEps, 0)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted uppercase">Margin</span>
                      <div className="flex items-center gap-0.5">
                        {s.avgGrossMargin > 0 && <MarginIcon className="h-2.5 w-2.5 text-text-muted" />}
                        <p className="font-mono text-[11px] text-text-secondary">
                          {s.avgGrossMargin > 0 ? `${s.avgGrossMargin.toFixed(1)}%` : '--'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border">
                    <span className={numColor(s.avgStockReaction)}>
                      Rxn {formatPct(s.avgStockReaction)}
                    </span>
                    <span className="text-text-muted">
                      {s.pctGuidanceRaised > 0 && <span className="text-accent-green">{s.pctGuidanceRaised.toFixed(0)}% raised</span>}
                      {s.pctGuidanceLowered > 0 && <span className="text-accent-red ml-1">{s.pctGuidanceLowered.toFixed(0)}% lowered</span>}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-text-muted py-2">No reports yet</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
