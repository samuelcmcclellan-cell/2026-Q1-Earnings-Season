import { SectorHeatmap } from '../components/charts/SectorHeatmap';
import { SectorSummary } from '../components/dashboard/SectorSummary';
import { ReactionScatter } from '../components/charts/ReactionScatter';

export function SectorsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">Sector Analysis</h2>
      <SectorHeatmap />
      <SectorSummary />
      <ReactionScatter />
    </div>
  );
}
