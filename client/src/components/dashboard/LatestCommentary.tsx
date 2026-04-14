import { useCommentary } from '../../hooks/use-commentary';
import { CommentaryList } from '../commentary/CommentaryList';
import { Spinner } from '../ui/Spinner';
import { Link } from 'react-router-dom';

export function LatestCommentary() {
  const { data, isLoading } = useCommentary({ limit: 6 });

  if (isLoading) return <Spinner size="sm" />;

  return (
    <div className="bg-bg-card border border-border rounded-lg">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Latest Commentary</h3>
        <Link to="/themes" className="text-[10px] text-accent-blue hover:underline">View all</Link>
      </div>
      <div className="px-3 py-2">
        <CommentaryList entries={data || []} maxItems={6} showTicker compact />
      </div>
    </div>
  );
}
