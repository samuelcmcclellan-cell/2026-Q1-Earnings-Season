import { ScoreboardStrip } from '../components/dashboard/ScoreboardStrip';
import { RecentReporters } from '../components/dashboard/RecentReporters';
import { WeeklyPreview } from '../components/dashboard/WeeklyPreview';
import { SectorSummary } from '../components/dashboard/SectorSummary';
import { RegionalSnapshot } from '../components/dashboard/RegionalSnapshot';
import { LatestCommentary } from '../components/dashboard/LatestCommentary';
import { GrowthBySector } from '../components/charts/GrowthBySector';
import { MarginTrends } from '../components/charts/MarginTrends';

export function DashboardPage() {
  return (
    <div className="space-y-3">
      {/* Row 1: KPI strip */}
      <ScoreboardStrip />

      {/* Row 2: Growth by sector + Margin trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <GrowthBySector />
        <MarginTrends />
      </div>

      {/* Row 3: Regional snapshot + Sector summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RegionalSnapshot />
        <SectorSummary />
      </div>

      {/* Row 4: Latest commentary + This week's reporters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <LatestCommentary />
        <WeeklyPreview />
      </div>

      {/* Row 5: Recent reports */}
      <RecentReporters />
    </div>
  );
}
