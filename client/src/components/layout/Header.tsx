import { useScorecard } from '../../hooks/use-scorecard';

export function Header() {
  const { data } = useScorecard();
  const reported = data?.totalReported ?? 0;
  const total = data?.totalCompanies ?? 0;
  const pct = total > 0 ? ((reported / total) * 100).toFixed(0) : '0';

  return (
    <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10 px-6 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Q1 2026 Earnings Season</h2>
          <p className="text-xs text-text-muted font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase tracking-wider">Season Progress</p>
            <p className="text-sm font-mono font-semibold text-text-primary">
              {reported} / {total} <span className="text-text-muted">reported</span>
            </p>
          </div>
          <div className="w-32 h-2 bg-bg-card rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-accent-blue rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
