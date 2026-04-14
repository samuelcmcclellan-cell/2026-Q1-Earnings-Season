import { StatCard } from '../ui/StatCard';
import { useScorecard } from '../../hooks/use-scorecard';
import { formatPct } from '../../lib/utils';
import { Target, TrendingUp, BarChart3, ArrowUpDown, DollarSign, Activity } from 'lucide-react';

export function ScoreboardStrip() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-card border border-border rounded-lg p-3 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <StatCard
        label="Season Progress"
        value={`${data.totalReported} / ${data.totalCompanies}`}
        subtitle={formatPct(data.pctReported, 0) + ' complete'}
        icon={<Target className="h-3.5 w-3.5" />}
      />
      <StatCard
        label="YoY EPS Growth"
        value={formatPct(data.avgEpsGrowthYoy)}
        deltaColor={data.avgEpsGrowthYoy >= 0 ? 'green' : 'red'}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
      />
      <StatCard
        label="YoY Rev Growth"
        value={formatPct(data.avgRevenueGrowthYoy)}
        deltaColor={data.avgRevenueGrowthYoy >= 0 ? 'green' : 'red'}
        icon={<BarChart3 className="h-3.5 w-3.5" />}
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
