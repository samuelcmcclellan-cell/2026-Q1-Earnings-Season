import { useState } from 'react';
import { useEarnings } from '../hooks/use-earnings';
import { EarningsTable } from '../components/tables/EarningsTable';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { SECTORS, REGIONS } from '../lib/constants';

export function EarningsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');

  const { data, isLoading } = useEarnings({
    status: statusFilter || undefined,
    sector: sectorFilter || undefined,
    region: regionFilter || undefined,
  });

  const selectClass = 'bg-bg-card border border-border rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">All Earnings</h2>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : data && data.length > 0 ? (
        <EarningsTable data={data} />
      ) : (
        <EmptyState message="No earnings match your filters" />
      )}
    </div>
  );
}
