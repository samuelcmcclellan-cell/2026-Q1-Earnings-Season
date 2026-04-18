import { useTopicOfTheWeek } from '../hooks/use-canonical';
import { TierBadge } from '../components/ui/TierBadge';
import { Spinner } from '../components/ui/Spinner';

export function TopicOfTheWeekPage() {
  const { data, isLoading } = useTopicOfTheWeek();

  if (isLoading) return <Spinner />;
  if (!data) return <div className="text-text-muted text-sm">No topic data.</div>;

  const { topic, contributors } = data;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Topic of the Week</h1>
        <p className="text-xs text-text-muted mt-1">FactSet Earnings Insight — narrative focus of the current week.</p>
      </div>

      {topic && (
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-base font-semibold text-text-primary">{topic.title}</h2>
            <TierBadge tier={topic.source_tier} page={topic.source_page} asOf={topic.as_of} />
          </div>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{topic.summary}</p>
        </div>
      )}

      {contributors && contributors.length > 0 && (
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Top Contributors
          </div>
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="text-left px-3 py-2">Ticker</th>
                <th className="text-left px-3 py-2">Company</th>
                <th className="text-left px-3 py-2">Metric</th>
                <th className="text-right px-3 py-2">Value</th>
                <th className="text-right px-3 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map((c, i) => (
                <tr key={i} className="border-t border-border hover:bg-bg-hover">
                  <td className="px-3 py-2 font-mono text-accent-blue">{c.ticker}</td>
                  <td className="px-3 py-2 text-text-secondary">{c.name || '—'}</td>
                  <td className="px-3 py-2 text-text-secondary">{c.metric || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-text-primary">
                    {c.value === null || c.value === undefined ? '—' : String(c.value)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <TierBadge tier={c.source_tier} page={c.source_page} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
