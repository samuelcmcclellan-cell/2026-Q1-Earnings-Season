import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanies } from '../../hooks/use-companies';
import { Search, ArrowRight } from 'lucide-react';
import { SECTOR_COLORS } from '../../lib/constants';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: companies } = useCompanies();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const filtered = q.length > 0
    ? (companies || []).filter(c =>
        c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      ).slice(0, 12)
    : [];

  const handleSelect = (ticker: string) => {
    navigate(`/company/${ticker}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-bg-secondary border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <Search className="h-3.5 w-3.5 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search companies by ticker or name..."
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && filtered.length > 0) {
                handleSelect(filtered[0].ticker);
              }
            }}
          />
          <kbd className="font-mono text-[9px] px-1 py-0.5 rounded bg-bg-card border border-border text-text-muted">ESC</kbd>
        </div>
        {filtered.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
            {filtered.map(c => (
              <button
                key={c.ticker}
                onClick={() => handleSelect(c.ticker)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-bg-hover transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: SECTOR_COLORS[c.sector] || '#666' }}
                  />
                  <span className="font-mono text-xs font-semibold text-text-primary">{c.ticker}</span>
                  <span className="text-[11px] text-text-muted truncate max-w-[200px]">{c.name}</span>
                </div>
                <ArrowRight className="h-3 w-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
        {q.length > 0 && filtered.length === 0 && (
          <div className="px-3 py-4 text-center text-[11px] text-text-muted">
            No companies found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
