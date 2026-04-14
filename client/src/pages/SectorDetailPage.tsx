import { useParams, Link } from 'react-router-dom';
import { useScorecard } from '../hooks/use-scorecard';
import { useEarnings } from '../hooks/use-earnings';
import { useCommentary } from '../hooks/use-commentary';
import { EarningsTable } from '../components/tables/EarningsTable';
import { CommentaryList } from '../components/commentary/CommentaryList';
import { StatCard } from '../components/ui/StatCard';
import { Spinner } from '../components/ui/Spinner';
import { formatPct, numColor } from '../lib/utils';
import { SECTOR_COLORS } from '../lib/constants';
import { ArrowLeft } from 'lucide-react';

export function SectorDetailPage() {
  const { sectorName } = useParams<{ sectorName: string }>();
  const sector = decodeURIComponent(sectorName || '');
  const { data: scorecard, isLoading: loadingScore } = useScorecard();
  const { data: earnings, isLoading: loadingEarnings } = useEarnings({ sector });
  const { data: commentary } = useCommentary({ sector, limit: 5 });

  if (loadingScore || loadingEarnings) return <Spinner />;

  const sectorData = scorecard?.bySector.find(s => s.sector === sector);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Link to="/sectors" className="text-text-muted hover:text-text-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[sector] || '#666' }} />
          <h2 className="text-[13px] font-semibold text-text-primary">{sector}</h2>
        </div>
      </div>

      {sectorData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          <StatCard
            label="EPS Growth YoY"
            value={formatPct(sectorData.avgEpsGrowthYoy)}
            deltaColor={sectorData.avgEpsGrowthYoy >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Rev Growth YoY"
            value={formatPct(sectorData.avgRevenueGrowthYoy)}
            deltaColor={sectorData.avgRevenueGrowthYoy >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Fwd EPS Revision"
            value={formatPct(sectorData.forwardEpsRevisionPct)}
            deltaColor={sectorData.forwardEpsRevisionPct >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Gross Margin"
            value={sectorData.avgGrossMargin > 0 ? `${sectorData.avgGrossMargin.toFixed(1)}%` : '--'}
          />
          <StatCard
            label="Reported"
            value={`${sectorData.reportedCompanies}/${sectorData.totalCompanies}`}
            accentColor={SECTOR_COLORS[sector]}
          />
          <StatCard
            label="Avg Rxn"
            value={formatPct(sectorData.avgStockReaction)}
            deltaColor={sectorData.avgStockReaction >= 0 ? 'green' : 'red'}
          />
        </div>
      )}

      {/* Top movers */}
      {earnings && earnings.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            <div className="bg-bg-card border border-border rounded-lg p-3">
              <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Top Movers (Best Rxn)</h3>
              <div className="space-y-1">
                {earnings
                  .filter(e => e.stock_reaction_pct !== null)
                  .sort((a, b) => (b.stock_reaction_pct || 0) - (a.stock_reaction_pct || 0))
                  .slice(0, 5)
                  .map(e => (
                    <Link key={e.id} to={`/company/${e.ticker}`} className="flex items-center justify-between py-1 hover:bg-bg-hover -mx-2 px-2 rounded transition-colors">
                      <span className="font-mono text-[11px] font-medium text-text-primary">{e.ticker}</span>
                      <span className={`font-mono text-[11px] font-medium ${numColor(e.stock_reaction_pct)}`}>
                        {formatPct(e.stock_reaction_pct)}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
            <div className="bg-bg-card border border-border rounded-lg p-3">
              <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Growth Leaders</h3>
              <div className="space-y-1">
                {earnings
                  .filter(e => e.eps_growth_yoy !== null)
                  .sort((a, b) => (b.eps_growth_yoy || 0) - (a.eps_growth_yoy || 0))
                  .slice(0, 5)
                  .map(e => (
                    <Link key={e.id} to={`/company/${e.ticker}`} className="flex items-center justify-between py-1 hover:bg-bg-hover -mx-2 px-2 rounded transition-colors">
                      <span className="font-mono text-[11px] font-medium text-text-primary">{e.ticker}</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-[11px] font-medium ${numColor(e.eps_growth_yoy)}`}>
                          EPS {formatPct(e.eps_growth_yoy)}
                        </span>
                        <span className={`font-mono text-[10px] ${numColor(e.revenue_growth_yoy)}`}>
                          Rev {formatPct(e.revenue_growth_yoy)}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>

          {commentary && commentary.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Management Commentary</h3>
                <Link to="/themes" className="text-[10px] text-accent-blue hover:underline">All themes</Link>
              </div>
              <CommentaryList entries={commentary} showTicker maxItems={5} />
            </div>
          )}

          <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Companies</h3>
          <EarningsTable data={earnings} />
        </>
      )}
    </div>
  );
}
