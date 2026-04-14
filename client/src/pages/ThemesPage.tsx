import { useState, useMemo } from 'react';
import { useCommentary, type CommentaryEntry } from '../hooks/use-commentary';
import { CommentaryList } from '../components/commentary/CommentaryList';
import { Spinner } from '../components/ui/Spinner';
import { THEME_LABELS } from '../lib/constants';
import { cn } from '../lib/utils';

const THEMES = Object.keys(THEME_LABELS);

interface ThemeStats {
  theme: string;
  count: number;
  positive: number;
  neutral: number;
  negative: number;
  sectors: string[];
}

function computeThemeStats(entries: CommentaryEntry[]): ThemeStats[] {
  const map = new Map<string, ThemeStats>();
  for (const theme of THEMES) {
    map.set(theme, { theme, count: 0, positive: 0, neutral: 0, negative: 0, sectors: [] });
  }
  for (const c of entries) {
    let tags: string[] = [];
    try { tags = JSON.parse(c.theme_tags); } catch {}
    for (const t of tags) {
      const stat = map.get(t);
      if (!stat) continue;
      stat.count++;
      if (c.sentiment === 'positive') stat.positive++;
      else if (c.sentiment === 'negative') stat.negative++;
      else stat.neutral++;
      if (!stat.sectors.includes(c.sector)) stat.sectors.push(c.sector);
    }
  }
  return Array.from(map.values())
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = positive + neutral + negative;
  if (total === 0) return null;
  const pP = (positive / total) * 100;
  const pN = (neutral / total) * 100;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-bg-secondary">
      {pP > 0 && <div className="bg-accent-green" style={{ width: `${pP}%` }} />}
      {pN > 0 && <div className="bg-text-muted/30" style={{ width: `${pN}%` }} />}
      {negative > 0 && <div className="bg-accent-red" style={{ width: `${100 - pP - pN}%` }} />}
    </div>
  );
}

export function ThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const { data: allCommentary, isLoading: loadingAll } = useCommentary({ limit: 200 });
  const { data: filteredCommentary, isLoading: loadingFiltered } = useCommentary({
    theme: selectedTheme || undefined,
    limit: 100,
  });

  const themeStats = useMemo(() => computeThemeStats(allCommentary || []), [allCommentary]);

  const displayData = selectedTheme ? filteredCommentary : allCommentary;
  const isLoading = selectedTheme ? loadingFiltered : loadingAll;

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Thematic Narratives</h2>

      {/* Theme summary cards */}
      {loadingAll ? (
        <Spinner size="sm" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-4">
          {themeStats.map(s => (
            <button
              key={s.theme}
              onClick={() => setSelectedTheme(selectedTheme === s.theme ? '' : s.theme)}
              className={cn(
                'text-left bg-bg-card border rounded-lg p-3 transition-colors hover:border-border-light',
                selectedTheme === s.theme ? 'border-accent-blue/50 bg-accent-blue/5' : 'border-border'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-text-primary">{THEME_LABELS[s.theme]}</span>
                <span className="text-[10px] font-mono text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">{s.count}</span>
              </div>
              <SentimentBar positive={s.positive} neutral={s.neutral} negative={s.negative} />
              <div className="flex items-center gap-1 mt-1.5 text-[9px] text-text-muted">
                <span className="text-accent-green">{s.positive}+</span>
                <span>{s.neutral}~</span>
                <span className="text-accent-red">{s.negative}-</span>
              </div>
              <p className="text-[9px] text-text-muted mt-1 truncate">
                {s.sectors.slice(0, 3).join(', ')}{s.sectors.length > 3 && ` +${s.sectors.length - 3}`}
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedTheme && (
        <button
          onClick={() => setSelectedTheme('')}
          className="text-[10px] text-accent-blue hover:underline mb-3 block"
        >
          Clear filter
        </button>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <CommentaryList entries={displayData || []} showTicker />
          {(!displayData || displayData.length === 0) && (
            <div className="text-center py-12 text-text-muted text-sm">
              No commentary available{selectedTheme ? ` for ${THEME_LABELS[selectedTheme]}` : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
}
