import { useSegments } from '../hooks/use-segments';
import { Spinner } from '../components/ui/Spinner';
import { formatPct, numColor } from '../lib/utils';
import { Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SegmentData } from '../hooks/use-segments';

function segmentToEarningsFilter(segment: SegmentData, category: 'marketCap' | 'style'): string {
  const name = segment.segment.toLowerCase().replace(/\s+cap$/, '');
  if (category === 'marketCap') return `/earnings?market_cap_category=${encodeURIComponent(name)}`;
  return `/earnings?style=${encodeURIComponent(name)}`;
}

function SegmentCard({ segment, category }: { segment: SegmentData; category: 'marketCap' | 'style' }) {
  const hasData = segment.reportedCompanies > 0;
  const href = segmentToEarningsFilter(segment, category);

  return (
    <Link to={href} className="block bg-bg-card border border-border rounded-lg p-3 hover:border-border-light transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-primary">{segment.segment}</span>
        <span className="text-[10px] font-mono text-text-muted">
          {segment.reportedCompanies}/{segment.totalCompanies}
        </span>
      </div>
      {hasData ? (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[9px] text-text-muted uppercase">EPS YoY</span>
              <p className={`font-mono text-sm font-semibold ${numColor(segment.avgEpsGrowthYoy)}`}>
                {formatPct(segment.avgEpsGrowthYoy)}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-text-muted uppercase">Rev YoY</span>
              <p className={`font-mono text-sm font-semibold ${numColor(segment.avgRevenueGrowthYoy)}`}>
                {formatPct(segment.avgRevenueGrowthYoy)}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-text-muted uppercase">Margin</span>
              <p className="font-mono text-[11px] text-text-secondary">
                {segment.avgGrossMargin > 0 ? `${segment.avgGrossMargin.toFixed(1)}%` : '--'}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-text-muted uppercase">Guidance</span>
              <p className={`font-mono text-[11px] ${numColor(segment.pctGuidanceRaised - segment.pctGuidanceLowered)}`}>
                {segment.pctGuidanceRaised.toFixed(0)}% raised
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border">
            <span className={numColor(segment.avgStockReaction)}>
              Rxn {formatPct(segment.avgStockReaction)}
            </span>
            <span className={numColor(segment.pctBeatingEps - 50)}>
              {formatPct(segment.pctBeatingEps, 0)} beat
            </span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-text-muted py-2">No reports yet</p>
      )}
    </Link>
  );
}

export function SegmentsPage() {
  const { data, isLoading } = useSegments();

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-text-muted" />
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-text-muted">Market Segments</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">By Market Cap</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(data?.byMarketCap || []).map(s => (
              <SegmentCard key={s.segment} segment={s} category="marketCap" />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">By Style</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(data?.byStyle || []).map(s => (
              <SegmentCard key={s.segment} segment={s} category="style" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
