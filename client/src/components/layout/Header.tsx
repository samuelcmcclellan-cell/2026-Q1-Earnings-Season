import { useScorecard } from '../../hooks/use-scorecard';
import { formatPct } from '../../lib/utils';
import { CommandPalette } from '../ui/CommandPalette';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export function Header() {
  const { data } = useScorecard();
  const reported = data?.totalReported ?? 0;
  const total = data?.totalCompanies ?? 0;
  const pct = total > 0 ? ((reported / total) * 100).toFixed(0) : '0';
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-[13px] font-semibold text-text-primary">Q1 2026 Earnings Season</h2>
              <p className="text-[10px] text-text-muted font-mono">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            {/* Season progress — prominent */}
            <div className="flex items-center gap-2">
              <div className="w-40 h-1.5 bg-bg-card rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-accent-blue rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-text-secondary">
                {reported}/{total} <span className="text-text-muted">({pct}%)</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded border border-border text-text-muted hover:text-text-secondary hover:border-border-light transition-colors text-[10px]"
            >
              <Search className="h-3 w-3" />
              <span>Search</span>
              <kbd className="font-mono text-[9px] px-1 py-0.5 rounded bg-bg-card border border-border">Ctrl+K</kbd>
            </button>
            {data && (
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="text-text-muted">EPS Beat</span>
                <span className="text-accent-green font-medium">{formatPct(data.pctBeatingEps, 0)}</span>
                <span className="text-text-muted">YoY EPS</span>
                <span className={data.avgEpsGrowthYoy >= 0 ? 'text-accent-green font-medium' : 'text-accent-red font-medium'}>
                  {formatPct(data.avgEpsGrowthYoy)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
