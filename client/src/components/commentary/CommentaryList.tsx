import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { THEME_LABELS } from '../../lib/constants';
import type { CommentaryEntry } from '../../hooks/use-commentary';

interface CommentaryListProps {
  entries: CommentaryEntry[];
  maxItems?: number;
  showTicker?: boolean;
  compact?: boolean;
}

export function CommentaryList({ entries, maxItems, showTicker, compact }: CommentaryListProps) {
  const items = maxItems ? entries.slice(0, maxItems) : entries;

  if (items.length === 0) {
    return <p className="text-[11px] text-text-muted py-4 text-center">No commentary available</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((c) => {
        let tags: string[] = [];
        try { tags = JSON.parse(c.theme_tags); } catch {}
        const quote = compact && c.quote_text.length > 120
          ? c.quote_text.slice(0, 120) + '...'
          : c.quote_text;

        return (
          <div key={c.id} className={compact ? 'py-2 border-b border-border last:border-0' : 'bg-bg-card border border-border rounded-lg p-3'}>
            {showTicker && (
              <div className="flex items-center gap-2 mb-1">
                <Link to={`/company/${c.ticker}`} className="font-mono font-semibold text-[11px] text-accent-blue hover:underline">
                  {c.ticker}
                </Link>
                <span className="text-[10px] text-text-muted">{c.name}</span>
                <span className="text-[10px] text-text-muted">&bull;</span>
                <span className="text-[10px] text-text-muted">{c.sector}</span>
              </div>
            )}
            <p className={`text-text-secondary italic leading-relaxed ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
              &ldquo;{quote}&rdquo;
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge variant={c.sentiment === 'positive' ? 'beat' : c.sentiment === 'negative' ? 'miss' : 'meet'} label={c.sentiment.toUpperCase()} />
              {tags.map(t => (
                <span key={t} className="text-[9px] font-mono text-accent-cyan bg-accent-cyan/10 px-1 py-0.5 rounded border border-accent-cyan/20">
                  {THEME_LABELS[t] || t}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
