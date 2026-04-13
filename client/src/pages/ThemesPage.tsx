import { useState } from 'react';
import { useCommentary } from '../hooks/use-commentary';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { THEME_LABELS } from '../lib/constants';
import { Link } from 'react-router-dom';

const THEMES = Object.keys(THEME_LABELS);

export function ThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const { data, isLoading } = useCommentary({ theme: selectedTheme || undefined, limit: 100 });

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Thematic Narratives</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedTheme('')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            !selectedTheme ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-bg-card border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          All Themes
        </button>
        {THEMES.map(t => (
          <button
            key={t}
            onClick={() => setSelectedTheme(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedTheme === t ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-bg-card border border-border text-text-muted hover:text-text-primary'
            }`}
          >
            {THEME_LABELS[t]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {data?.map((c) => {
            let tags: string[] = [];
            try { tags = JSON.parse(c.theme_tags); } catch {}
            return (
              <div key={c.id} className="bg-bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link to={`/company/${c.ticker}`} className="font-mono font-semibold text-sm text-accent-blue hover:underline">
                    {c.ticker}
                  </Link>
                  <span className="text-xs text-text-muted">{c.name}</span>
                  <span className="text-[10px] text-text-muted">&bull;</span>
                  <span className="text-[10px] text-text-muted">{c.sector}</span>
                </div>
                <p className="text-sm text-text-secondary italic leading-relaxed mb-2">"{c.quote_text}"</p>
                <div className="flex items-center gap-2">
                  <Badge variant={c.sentiment === 'positive' ? 'beat' : c.sentiment === 'negative' ? 'miss' : 'meet'} label={c.sentiment.toUpperCase()} />
                  {tags.map(t => (
                    <span key={t} className="text-[10px] font-mono text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded border border-accent-cyan/20">
                      {THEME_LABELS[t] || t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {(!data || data.length === 0) && (
            <div className="text-center py-12 text-text-muted text-sm">
              No commentary available{selectedTheme ? ` for ${THEME_LABELS[selectedTheme]}` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
