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
import { Badge } from '../ui/Badge';
import { formatPct, formatEps, formatCurrency, formatDate, classifyResult } from '../../lib/utils';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface EarningsTableProps {
  data: EarningsEntry[];
}

export function EarningsTable({ data }: EarningsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'report_date', desc: true }]);

  const columns = useMemo<ColumnDef<EarningsEntry, any>[]>(() => [
    {
      accessorKey: 'ticker',
      header: 'Ticker',
      size: 80,
      cell: ({ row }) => (
        <Link to={`/company/${row.original.ticker}`} className="font-mono font-semibold text-accent-blue hover:underline">
          {row.original.ticker}
        </Link>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Company',
      size: 160,
      cell: ({ getValue }) => <span className="text-text-secondary truncate block max-w-[160px]">{getValue() as string}</span>,
    },
    {
      accessorKey: 'sector',
      header: 'Sector',
      size: 120,
      cell: ({ getValue }) => <span className="text-text-muted text-xs">{getValue() as string}</span>,
    },
    {
      accessorKey: 'report_date',
      header: 'Date',
      size: 80,
      cell: ({ getValue }) => <span className="font-mono text-text-secondary">{formatDate(getValue() as string)}</span>,
    },
    {
      id: 'eps_result',
      header: 'EPS',
      size: 100,
      cell: ({ row }) => {
        const { eps_actual, eps_estimate } = row.original;
        const result = classifyResult(eps_actual, eps_estimate);
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono">{formatEps(eps_actual)}</span>
            {result !== 'pending' && <Badge variant={result} />}
          </div>
        );
      },
    },
    {
      accessorKey: 'eps_surprise_pct',
      header: 'EPS Surp.',
      size: 80,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        if (v === null) return <span className="text-text-muted">--</span>;
        return <span className={`font-mono ${v > 0 ? 'text-accent-green' : 'text-accent-red'}`}>{formatPct(v)}</span>;
      },
    },
    {
      accessorKey: 'revenue_actual',
      header: 'Revenue',
      size: 90,
      cell: ({ row }) => {
        const { revenue_actual, revenue_estimate } = row.original;
        return <span className="font-mono">{formatCurrency(revenue_actual || revenue_estimate)}</span>;
      },
    },
    {
      accessorKey: 'revenue_surprise_pct',
      header: 'Rev Surp.',
      size: 80,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        if (v === null) return <span className="text-text-muted">--</span>;
        return <span className={`font-mono ${v > 0 ? 'text-accent-green' : 'text-accent-red'}`}>{formatPct(v)}</span>;
      },
    },
    {
      accessorKey: 'guidance_direction',
      header: 'Guidance',
      size: 90,
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        if (!v) return <span className="text-text-muted">--</span>;
        return <Badge variant={v as any} />;
      },
    },
    {
      accessorKey: 'stock_reaction_pct',
      header: 'Rxn',
      size: 70,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        if (v === null) return <span className="text-text-muted">--</span>;
        return <span className={`font-mono font-medium ${v >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{formatPct(v)}</span>;
      },
    },
  ], []);

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
        <table className="w-full text-xs">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-border bg-bg-secondary">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-left py-2.5 px-3 text-text-muted font-medium cursor-pointer hover:text-text-primary select-none"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-bg-hover transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-2 px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-xs text-text-muted">
          Showing {table.getRowModel().rows.length} of {data.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1 rounded hover:bg-bg-hover disabled:opacity-30 text-text-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-text-muted font-mono">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1 rounded hover:bg-bg-hover disabled:opacity-30 text-text-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
