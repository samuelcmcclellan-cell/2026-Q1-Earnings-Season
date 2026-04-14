import { useScorecard } from '../../hooks/use-scorecard';
import { SECTOR_COLORS } from '../../lib/constants';
import { formatPct, numColor } from '../../lib/utils';
import { Spinner } from '../ui/Spinner';
import { Link } from 'react-router-dom';

/** Continuous red → gray → green color scale */
function heatColor(value: number): string {
  const clamped = Math.max(-20, Math.min(20, value));
  const t = (clamped + 20) / 40; // 0..1, 0.5 = neutral
  if (t < 0.5) {
    // red side
    const r = 239, g = Math.round(68 + (100 * t * 2)), b = Math.round(68 + (100 * t * 2));
    return `rgba(${r}, ${g}, ${b}, ${0.15 + (0.5 - t) * 0.4})`;
  } else {
    // green side
    const factor = (t - 0.5) * 2;
    const r = Math.round(34 + (200 * (1 - factor))), g = Math.round(197), b = Math.round(94 + (140 * (1 - factor)));
    return `rgba(${r}, ${g}, ${b}, ${0.15 + factor * 0.3})`;
  }
}

export function SectorHeatmap() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) return <Spinner size="sm" />;

  const sectors = data.bySector
    .filter(s => s.reportedCompanies > 0)
    .sort((a, b) => b.avgEpsGrowthYoy - a.avgEpsGrowthYoy);

  if (sectors.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-4 text-center text-text-muted text-[11px]">
        No sector data available yet
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Sector Performance</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
        {sectors.map((s) => (
          <Link
            key={s.sector}
            to={`/sectors/${encodeURIComponent(s.sector)}`}
            className="rounded-lg p-2.5 border border-border hover:border-border-light transition-colors"
            style={{ backgroundColor: heatColor(s.avgEpsGrowthYoy) }}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[s.sector] }} />
              <span className="text-[10px] font-medium text-text-primary truncate">{s.sector}</span>
            </div>
            <p className={`font-mono text-base font-bold ${numColor(s.avgEpsGrowthYoy)}`}>
              {formatPct(s.avgEpsGrowthYoy)}
            </p>
            <p className="text-[9px] text-text-muted font-mono">
              {s.reportedCompanies}/{s.totalCompanies} · EPS YoY
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
