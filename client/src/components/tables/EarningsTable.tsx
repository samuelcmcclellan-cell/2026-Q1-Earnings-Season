import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { EarningsEntry } from '../../hooks/use-earnings';
import { useQuotes } from '../../hooks/use-market-data';
import { Badge } from '../ui/Badge';
import { DataSourceDot } from '../ui/DataSourceDot';
import { LivePrice } from '../ui/LivePrice';
import { Sparkline } from '../ui/Sparkline';
import { formatPct, formatEps, formatCurrency, formatDate, classifyResult, numColor, cn } from '../../lib/utils';
import { SECTOR_COLORS } from '../../lib/constants';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface EarningsTableProps {
  data: EarningsEntry[];
  compact?: boolean;
  showLive?: boolean;
}

export function EarningsTable({ data, compact, showLive }: EarningsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'report_date', desc: true }]);

  const columns = useMemo<ColumnDef<EarningsEntry, any>[]>(() => {
    const cols: ColumnDef<EarningsEntry, any>[] = [
      {
        accessorKey: 'ticker',
        header: 'Ticker',
        size: 70,
        cell: ({ row }) => (
          <Link to={`/company/${row.original.ticker}`} className="font-mono text-[11px] font-semibold text-accent-blue hover:underline">
            {row.original.ticker}
          </Link>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Company',
        size: 130,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: SECTOR_COLORS[row.original.sector] || '#666' }}
            />
            <span className="text-text-secondary truncate block max-w-[120px] text-[11px]">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'report_date',
        header: 'Date',
        size: 65,
        cell: ({ getValue }) => <span className="font-mono text-text-secondary text-[11px]">{formatDate(getValue() as string)}</span>,
      },
      {
        id: 'eps_result',
        header: 'EPS',
        size: 85,
        cell: ({ row }) => {
          const { eps_actual, eps_estimate } = row.original;
          const result = classifyResult(eps_actual, eps_estimate);
          return (
            <div className="flex items-center gap-1">
              <span className="font-mono text-[11px]">{formatEps(eps_actual)}</span>
              {result !== 'pending' && <Badge variant={result} />}
            </div>
          );
        },
      },
      {
        accessorKey: 'eps_surprise_pct',
        header: 'EPS Surp',
        size: 65,
        cell: ({ getValue }) => {
          const v = getValue() as number | null;
          if (v === null) return <span className="text-text-muted text-[11px]">--</span>;
          return <span className={cn('font-mono text-[11px]', numColor(v))}>{formatPct(v)}</span>;
        },
      },
      {
        accessorKey: 'eps_growth_yoy',
        header: 'EPS YoY',
        size: 65,
        cell: ({ getValue, row }) => {
          const v = getValue() as number | null;
          if (v === null) return <span className="text-text-muted text-[11px]">--</span>;
          return (
            <span className={cn('font-mono text-[11px]', numColor(v), row.original.data_source === 'seed' && 'data-seed')} title={row.original.data_source === 'seed' ? 'Estimated data' : undefined}>
              {formatPct(v)}
            </span>
          );
        },
      },
      {
        accessorKey: 'revenue_growth_yoy',
        header: 'Rev YoY',
        size: 65,
        cell: ({ getValue, row }) => {
          const v = getValue() as number | null;
          if (v === null) return <span className="text-text-muted text-[11px]">--</span>;
          return (
            <span className={cn('font-mono text-[11px]', numColor(v), row.original.data_source === 'seed' && 'data-seed')} title={row.original.data_source === 'seed' ? 'Estimated data' : undefined}>
              {formatPct(v)}
            </span>
          );
        },
      },
      {
        accessorKey: 'gross_margin',
        header: 'Gross M',
        size: 60,
        cell: ({ getValue, row }) => {
          const v = getValue() as number | null;
          if (v === null) {
            const isFinancial = row.original.sector === 'Financials';
            return (
              <span
                className="text-text-muted text-[11px]"
                title={isFinancial ? 'Not applicable for financial-sector companies' : 'No data'}
              >
                —
              </span>
            );
          }
          return (
            <span className={cn('font-mono text-[11px] text-text-secondary', row.original.data_source === 'seed' && 'data-seed')} title={row.original.data_source === 'seed' ? 'Estimated data' : undefined}>
              {v.toFixed(1)}%
            </span>
          );
        },
      },
      {
        accessorKey: 'operating_margin',
        header: 'Op M',
        size: 55,
        cell: ({ getValue, row }) => {
          const v = getValue() as number | null;
          if (v === null) return <span className="text-text-muted text-[11px]">--</span>;
          return (
            <span className={cn('font-mono text-[11px] text-text-secondary', row.original.data_source === 'seed' && 'data-seed')} title={row.original.data_source === 'seed' ? 'Estimated data' : undefined}>
              {v.toFixed(1)}%
            </span>
          );
        },
      },
      {
        accessorKey: 'guidance_direction',
        header: 'Guid',
        size: 70,
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          if (!v) return <span className="text-text-muted text-[11px]">--</span>;
          return <Badge variant={v as any} />;
        },
      },
      {
        accessorKey: 'stock_reaction_pct',
        header: 'Rxn',
        size: 55,
        cell: ({ getValue }) => {
          const v = getValue() as number | null;
          if (v === null) return <span className="text-text-muted text-[11px]">--</span>;
          return <span className={cn('font-mono text-[11px] font-medium', numColor(v))}>{formatPct(v)}</span>;
        },
      },
      {
        accessorKey: 'data_source',
        header: '',
        size: 20,
        cell: ({ getValue }) => <DataSourceDot source={getValue() as string} />,
      },
    ];

    if (showLive) {
      cols.splice(3, 0, {
        id: 'live_price',
        header: 'Price',
        size: 110,
        cell: ({ row }) => <LivePrice symbol={row.original.ticker} compact />,
      });
      cols.splice(4, 0, {
        id: 'sparkline_30d',
        header: '30d',
        size: 70,
        cell: ({ row }) => <Sparkline symbol={row.original.ticker} width={60} height={20} />,
      });
    }

    if (compact) {
      // Remove some columns for compact view
      return cols.filter(c => !['gross_margin', 'operating_margin', 'data_source'].includes((c as any).accessorKey || ''));
    }
    return cols;
  }, [compact, showLive]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  return (
    <div>
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-[11px]">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-border bg-bg-secondary">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-left py-2 px-2 text-[10px] text-text-muted font-medium cursor-pointer hover:text-text-primary select-none uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-0.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row, i) => (
              <tr key={row.id} className={cn(
                'hover:bg-bg-hover transition-colors',
                i % 2 === 1 ? 'bg-bg-card' : 'bg-bg-secondary/10'
              )}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-1.5 px-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-[10px] text-text-muted font-mono">
          {table.getRowModel().rows.length} of {data.length}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-0.5 rounded hover:bg-bg-hover disabled:opacity-30 text-text-muted"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-text-muted font-mono">
            {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-0.5 rounded hover:bg-bg-hover disabled:opacity-30 text-text-muted"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
