import { useParams, Link } from 'react-router-dom';
import { useRegionDetail } from '../hooks/use-regions';
import { useCommentary } from '../hooks/use-commentary';
import { EarningsTable } from '../components/tables/EarningsTable';
import { CommentaryList } from '../components/commentary/CommentaryList';
import { StatCard } from '../components/ui/StatCard';
import { Spinner } from '../components/ui/Spinner';
import { formatPct, numColor } from '../lib/utils';
import { ArrowLeft } from 'lucide-react';

export function RegionDetailPage() {
  const { regionName } = useParams<{ regionName: string }>();
  const region = decodeURIComponent(regionName || '');
  const { data, isLoading } = useRegionDetail(region);
  const { data: allCommentary } = useCommentary({ limit: 50 });

  if (isLoading) return <Spinner />;

  // Filter commentary client-side by tickers in this region
  const regionTickers = new Set((data?.companies || []).map((c: any) => c.ticker));
  const regionCommentary = (allCommentary || []).filter(c => regionTickers.has(c.ticker));

  // Growth leaders and top movers from reported companies
  const reported = (data?.companies || []).filter((e: any) => e.status === 'reported');
  const growthLeaders = [...reported]
    .filter(e => e.eps_growth_yoy !== null)
    .sort((a, b) => (b.eps_growth_yoy || 0) - (a.eps_growth_yoy || 0))
    .slice(0, 5);
  const topMovers = [...reported]
    .filter(e => e.stock_reaction_pct !== null)
    .sort((a, b) => (b.stock_reaction_pct || 0) - (a.stock_reaction_pct || 0))
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Link to="/regions" className="text-text-muted hover:text-text-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-[13px] font-semibold text-text-primary">{region}</h2>
        {data && (
          <span className="text-[10px] font-mono text-text-muted">
            {data.reportedCompanies}/{data.totalCompanies} reported
          </span>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          <StatCard
            label="EPS Growth YoY"
            value={formatPct(data.avgEpsGrowthYoy)}
            deltaColor={data.avgEpsGrowthYoy >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Rev Growth YoY"
            value={formatPct(data.avgRevenueGrowthYoy)}
            deltaColor={data.avgRevenueGrowthYoy >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Gross Margin"
            value={data.avgGrossMargin > 0 ? `${data.avgGrossMargin.toFixed(1)}%` : '--'}
          />
          <StatCard
            label="Avg Rxn"
            value={formatPct(data.avgStockReaction)}
            deltaColor={data.avgStockReaction >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Guidance"
            value={`${data.pctGuidanceRaised.toFixed(0)}% raised`}
            subtitle={`${data.pctGuidanceLowered.toFixed(0)}% lowered`}
            deltaColor={data.pctGuidanceRaised > data.pctGuidanceLowered ? 'green' : 'red'}
          />
          <StatCard
            label="Reported"
            value={`${data.reportedCompanies}/${data.totalCompanies}`}
          />
        </div>
      )}

      {/* Growth Leaders + Top Movers */}
      {reported.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="bg-bg-card border border-border rounded-lg p-3">
            <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Growth Leaders</h3>
            <div className="space-y-1">
              {growthLeaders.map((e: any) => (
                <Link key={e.ticker} to={`/company/${e.ticker}`} className="flex items-center justify-between py-1 hover:bg-bg-hover -mx-2 px-2 rounded transition-colors">
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
          <div className="bg-bg-card border border-border rounded-lg p-3">
            <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Top Movers (Best Rxn)</h3>
            <div className="space-y-1">
              {topMovers.map((e: any) => (
                <Link key={e.ticker} to={`/company/${e.ticker}`} className="flex items-center justify-between py-1 hover:bg-bg-hover -mx-2 px-2 rounded transition-colors">
                  <span className="font-mono text-[11px] font-medium text-text-primary">{e.ticker}</span>
                  <span className={`font-mono text-[11px] font-medium ${numColor(e.stock_reaction_pct)}`}>
                    {formatPct(e.stock_reaction_pct)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Commentary */}
      {regionCommentary.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Management Commentary</h3>
            <Link to="/themes" className="text-[10px] text-accent-blue hover:underline">All themes</Link>
          </div>
          <CommentaryList entries={regionCommentary} showTicker maxItems={5} />
        </div>
      )}

      {data?.companies && (
        <>
          <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Companies</h3>
          <EarningsTable data={data.companies} />
        </>
      )}
    </div>
  );
}
