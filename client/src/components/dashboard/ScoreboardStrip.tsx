import { StatCard } from '../ui/StatCard';
import { useScorecard } from '../../hooks/use-scorecard';
import { formatPct } from '../../lib/utils';
import { Target, TrendingUp, BarChart3, ArrowUpDown, DollarSign, Activity, Eye } from 'lucide-react';

export function ScoreboardStrip() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-bg-card border border-border rounded-lg p-3 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  const hasBlended = data.blendedCompaniesIncluded > 0;
  const hasExpected = data.expectedCompaniesIncluded > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
      <StatCard
        label="Season Progress"
        value={`${data.totalReported} / ${data.totalCompanies}`}
        subtitle={formatPct(data.pctReported, 0) + ' reported'}
        icon={<Target className="h-3.5 w-3.5" />}
      />

      {/* Blended EPS Growth — hero metric: actuals for reported + estimates for upcoming */}
      <StatCard
        label="Blended EPS Growth"
        value={hasBlended ? formatPct(data.blendedEpsGrowthYoy) : '--'}
        delta={data.totalReported > 0 ? `Reported: ${formatPct(data.avgEpsGrowthYoy)} (${data.totalReported})` : undefined}
        subtitle={hasBlended ? `${data.blendedCompaniesIncluded}/${data.totalCompanies} with prior data` : 'Awaiting prior-year data'}
        deltaColor={data.blendedEpsGrowthYoy >= 0 ? 'green' : 'red'}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
      />

      {/* Blended Revenue Growth */}
      <StatCard
        label="Blended Rev Growth"
        value={hasBlended ? formatPct(data.blendedRevGrowthYoy) : '--'}
        delta={data.totalReported > 0 ? `Reported: ${formatPct(data.avgRevenueGrowthYoy)}` : undefined}
        subtitle={hasBlended ? `${data.blendedCompaniesIncluded}/${data.totalCompanies} with prior data` : 'Awaiting prior-year data'}
        deltaColor={data.blendedRevGrowthYoy >= 0 ? 'green' : 'red'}
        icon={<BarChart3 className="h-3.5 w-3.5" />}
      />

      {/* Expected EPS Growth — pre-season consensus benchmark (estimates for all companies) */}
      <StatCard
        label="Expected EPS Growth"
        value={hasExpected ? formatPct(data.expectedEpsGrowthYoy) : '--'}
        subtitle={hasExpected ? `${data.expectedCompaniesIncluded} cos w/ prior data` : 'Run backfill for prior-year data'}
        deltaColor={data.expectedEpsGrowthYoy >= 0 ? 'green' : 'red'}
        icon={<Eye className="h-3.5 w-3.5" />}
      />

      <StatCard
        label="Net Guidance"
        value={data.netGuidance >= 0 ? `+${data.netGuidance}` : data.netGuidance}
        delta={`${data.guidanceRaisedCount} raised, ${data.guidanceLoweredCount} lowered`}
        deltaColor={data.netGuidance >= 0 ? 'green' : 'red'}
        icon={<ArrowUpDown className="h-3.5 w-3.5" />}
      />
      <StatCard
        label="Fwd EPS Revision"
        value={formatPct(data.forwardEpsRevisionPct)}
        deltaColor={data.forwardEpsRevisionPct >= 0 ? 'green' : 'red'}
        icon={<DollarSign className="h-3.5 w-3.5" />}
      />
      <StatCard
        label="Avg Stock Rxn"
        value={formatPct(data.avgStockReaction)}
        delta={`EPS Beat ${formatPct(data.pctBeatingEps, 0)}`}
        deltaColor={data.avgStockReaction >= 0 ? 'green' : 'red'}
        icon={<Activity className="h-3.5 w-3.5" />}
      />
    </div>
  );
}
