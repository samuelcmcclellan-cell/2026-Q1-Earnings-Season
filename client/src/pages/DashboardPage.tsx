import { ScoreboardStrip } from '../components/dashboard/ScoreboardStrip';
import { RecentReporters } from '../components/dashboard/RecentReporters';
import { WeeklyPreview } from '../components/dashboard/WeeklyPreview';
import { SectorSummary } from '../components/dashboard/SectorSummary';
import { BeatMissBar } from '../components/charts/BeatMissBar';
import { ReactionScatter } from '../components/charts/ReactionScatter';

export function DashboardPage() {
  return (
    <div className="space-y-4">
      <ScoreboardStrip />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentReporters />
        <WeeklyPreview />
      </div>

      <SectorSummary />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BeatMissBar />
        <ReactionScatter />
      </div>
    </div>
  );
}
