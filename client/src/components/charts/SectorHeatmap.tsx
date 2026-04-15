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
    const r = 239, g = Math.round(68 + (100 * t * 2)), b = Math.round(68 + (100 * t * 2));
    return `rgba(${r}, ${g}, ${b}, ${0.15 + (0.5 - t) * 0.4})`;
  } else {
    const factor = (t - 0.5) * 2;
    const r = Math.round(34 + (200 * (1 - factor))), g = Math.round(197), b = Math.round(94 + (140 * (1 - factor)));
    return `rgba(${r}, ${g}, ${b}, ${0.15 + factor * 0.3})`;
  }
}

export function SectorHeatmap() {
  const { data, isLoading } = useScorecard();

  if (isLoading || !data) return <Spinner size="sm" />;

  // Show ALL sectors — use blended when available, fall back to expected, then reported-only
  const sectors = data.bySector
    .filter(s => s.totalCompanies > 0)
    .map(s => {
      const hasBlended = s.blendedEpsGrowthYoy !== 0;
      const hasExpected = s.expectedEpsGrowthYoy !== 0;
      const hasReported = s.reportedCompanies > 0;

      // Pick best available growth figure for color scale
      const displayValue = hasBlended ? s.blendedEpsGrowthYoy
        : hasExpected ? s.expectedEpsGrowthYoy
        : s.avgEpsGrowthYoy;

      const label = hasBlended ? 'Blended'
        : hasExpected ? 'Expected'
        : hasReported ? 'Reported' : 'Est.';

      return { ...s, displayValue, label, isEstimateOnly: !hasReported };
    })
    .sort((a, b) => b.displayValue - a.displayValue);

  if (sectors.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-4 text-center text-text-muted text-[11px]">
        No sector data available yet
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Sector Performance</h3>
        <div className="flex items-center gap-2 text-[9px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-border inline-block border border-dashed border-text-muted" />
            Est. only
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
        {sectors.map((s) => (
          <Link
            key={s.sector}
            to={`/sectors/${encodeURIComponent(s.sector)}`}
            className={`rounded-lg p-2.5 hover:opacity-90 transition-opacity ${
              s.isEstimateOnly
                ? 'border border-dashed border-border-light'
                : 'border border-border'
            }`}
            style={{ backgroundColor: heatColor(s.displayValue) }}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[s.sector] }} />
              <span className="text-[10px] font-medium text-text-primary truncate">{s.sector}</span>
            </div>
            <p className={`font-mono text-base font-bold ${numColor(s.displayValue)}`}>
              {formatPct(s.displayValue)}
            </p>
            <p className="text-[9px] text-text-muted font-mono">
              {s.reportedCompanies}/{s.totalCompanies} · {s.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
