interface NewsCardProps {
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
}

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts * 1000;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NewsCard({ headline, summary, url, source, datetime }: NewsCardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-lg p-2.5 hover:border-border-light transition-colors">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-medium text-text-primary hover:text-accent-blue leading-tight line-clamp-2"
      >
        {headline}
      </a>
      <p className="text-[10px] text-text-muted mt-1 line-clamp-2 leading-snug">{summary}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-bg-secondary text-text-muted">
          {source}
        </span>
        <span className="text-[9px] text-text-muted font-mono">{relativeTime(datetime)}</span>
      </div>
    </div>
  );
}
