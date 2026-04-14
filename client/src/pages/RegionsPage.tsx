import { useRegions } from '../hooks/use-regions';
import { Spinner } from '../components/ui/Spinner';
import { formatPct, numColor } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';

const REGION_ICONS: Record<string, string> = {
  'United States': '🇺🇸',
  'Europe': '🇪🇺',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'EM': '🌍',
};

export function RegionsPage() {
  const { data, isLoading } = useRegions();

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-text-muted" />
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-text-muted">Regional Breakdown</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {(data || []).map(r => (
          <Link
            key={r.region}
            to={`/regions/${encodeURIComponent(r.region)}`}
            className="bg-bg-card border border-border rounded-lg p-3 hover:border-border-light transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{REGION_ICONS[r.region] || '🌐'}</span>
                <span className="text-xs font-medium text-text-primary">{r.region}</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                {r.reportedCompanies}/{r.totalCompanies}
              </span>
            </div>

            {r.reportedCompanies > 0 ? (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-text-muted uppercase">EPS YoY</span>
                    <p className={`font-mono text-sm font-semibold ${numColor(r.avgEpsGrowthYoy)}`}>
                      {formatPct(r.avgEpsGrowthYoy)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-muted uppercase">Rev YoY</span>
                    <p className={`font-mono text-sm font-semibold ${numColor(r.avgRevenueGrowthYoy)}`}>
                      {formatPct(r.avgRevenueGrowthYoy)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border">
                  <span className={numColor(r.pctBeatingEps - 50)}>
                    Beat {formatPct(r.pctBeatingEps, 0)}
                  </span>
                  <span className={numColor(r.avgStockReaction)}>
                    Rxn {formatPct(r.avgStockReaction)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-text-muted py-2">No reports yet</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
