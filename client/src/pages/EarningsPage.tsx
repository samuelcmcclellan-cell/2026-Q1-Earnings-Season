import { useState } from 'react';
import { useEarnings } from '../hooks/use-earnings';
import { EarningsTable } from '../components/tables/EarningsTable';
import { BeatMissBar } from '../components/charts/BeatMissBar';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { SECTORS, REGIONS, STYLES, MARKET_CAPS } from '../lib/constants';
import { Activity } from 'lucide-react';

export function EarningsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [styleFilter, setStyleFilter] = useState<string>('');
  const [capFilter, setCapFilter] = useState<string>('');
  const [showLive, setShowLive] = useState(false);

  const { data, isLoading } = useEarnings({
    status: statusFilter || undefined,
    sector: sectorFilter || undefined,
    region: regionFilter || undefined,
    style: styleFilter || undefined,
    market_cap_category: capFilter || undefined,
  });

  const selectClass = 'bg-bg-card border border-border rounded px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent-blue';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-text-muted">All Earnings</h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">All Status</option>
            <option value="reported">Reported</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className={selectClass}>
            <option value="">All Sectors</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className={selectClass}>
            <option value="">All Regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </select>
          <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)} className={selectClass}>
            <option value="">All Styles</option>
            {STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={capFilter} onChange={e => setCapFilter(e.target.value)} className={selectClass}>
            <option value="">All Caps</option>
            {MARKET_CAPS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
          <button
            onClick={() => setShowLive(!showLive)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-colors ${
              showLive
                ? 'bg-accent-green/10 border-accent-green/40 text-accent-green'
                : 'bg-bg-card border-border text-text-muted hover:text-text-secondary'
            }`}
          >
            <Activity className="h-3 w-3" />
            Live Prices
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : data && data.length > 0 ? (
        <>
          <EarningsTable data={data} showLive={showLive} />
          <div className="mt-4">
            <BeatMissBar />
          </div>
        </>
      ) : (
        <EmptyState message="No earnings match your filters" />
      )}
    </div>
  );
}
