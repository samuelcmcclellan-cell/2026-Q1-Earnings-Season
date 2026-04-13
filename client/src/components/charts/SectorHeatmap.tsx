import { useScorecard } from '../../hooks/use-scorecard';
import { SECTOR_COLORS } from '../../lib/constants';
import { formatPct } from '../../lib/utils';
import { Spinner } from '../ui/Spinner';

export function SectorHeatmap() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) return <Spinner size="sm" />;

  const sectors = data.bySector
    .filter(s => s.reportedCompanies > 0)
    .sort((a, b) => b.avgEpsSurprisePct - a.avgEpsSurprisePct);

  if (sectors.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-6 text-center text-text-muted text-sm">
        No sector data available yet
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Sector Performance</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {sectors.map((s) => {
          const bgOpacity = Math.min(Math.abs(s.avgEpsSurprisePct) / 20, 0.4);
          const isPositive = s.avgEpsSurprisePct > 0;
          return (
            <div
              key={s.sector}
              className="rounded-lg p-3 border border-border"
              style={{
                backgroundColor: isPositive
                  ? `rgba(34, 197, 94, ${bgOpacity})`
                  : `rgba(239, 68, 68, ${bgOpacity})`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SECTOR_COLORS[s.sector] }}
                />
                <span className="text-[11px] font-medium text-text-primary truncate">{s.sector}</span>
              </div>
              <p className={`font-mono text-lg font-bold ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                {formatPct(s.avgEpsSurprisePct)}
              </p>
              <p className="text-[10px] text-text-muted font-mono">
                {s.reportedCompanies}/{s.totalCompanies} reported
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
