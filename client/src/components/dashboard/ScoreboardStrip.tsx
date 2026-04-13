import { StatCard } from '../ui/StatCard';
import { useScorecard } from '../../hooks/use-scorecard';
import { formatPct } from '../../lib/utils';
import { Target, TrendingUp, TrendingDown, BarChart3, ArrowUpCircle, Percent } from 'lucide-react';

export function ScoreboardStrip() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-card border border-border rounded-lg p-4 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        label="Reported"
        value={`${data.totalReported} / ${data.totalCompanies}`}
        subtitle={formatPct(data.pctReported, 0) + ' complete'}
        icon={<Target className="h-4 w-4" />}
      />
      <StatCard
        label="EPS Beat Rate"
        value={formatPct(data.pctBeatingEps, 0)}
        delta={`${data.epsBeatCount} beats`}
        deltaColor="green"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        label="Rev Beat Rate"
        value={formatPct(data.pctBeatingRev, 0)}
        delta={`${data.revBeatCount} beats`}
        deltaColor="green"
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <StatCard
        label="Avg EPS Surprise"
        value={formatPct(data.avgEpsSurprisePct)}
        deltaColor={data.avgEpsSurprisePct > 0 ? 'green' : 'red'}
        icon={<Percent className="h-4 w-4" />}
      />
      <StatCard
        label="Avg Stock Reaction"
        value={formatPct(data.avgStockReaction)}
        deltaColor={data.avgStockReaction > 0 ? 'green' : 'red'}
        icon={<TrendingDown className="h-4 w-4" />}
      />
      <StatCard
        label="Guidance Raised"
        value={data.guidanceRaisedCount}
        delta={data.guidanceLoweredCount > 0 ? `${data.guidanceLoweredCount} lowered` : undefined}
        deltaColor="red"
        icon={<ArrowUpCircle className="h-4 w-4" />}
      />
    </div>
  );
}
