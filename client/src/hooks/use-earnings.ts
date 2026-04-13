import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface EarningsEntry {
  id: number;
  company_id: number;
  fiscal_quarter: string;
  report_date: string | null;
  time_of_day: string;
  eps_estimate: number | null;
  eps_actual: number | null;
  revenue_estimate: number | null;
  revenue_actual: number | null;
  eps_surprise_pct: number | null;
  revenue_surprise_pct: number | null;
  guidance_direction: string | null;
  stock_reaction_pct: number | null;
  status: string;
  ticker: string;
  name: string;
  sector: string;
  region: string;
  industry: string;
  market_cap_category: string;
}

export function useEarnings(filters?: {
  status?: string;
  sector?: string;
  region?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.sector) params.set('sector', filters.sector);
  if (filters?.region) params.set('region', filters.region);
  if (filters?.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return useQuery({
    queryKey: ['earnings', qs],
    queryFn: () => apiFetch<EarningsEntry[]>(`/api/earnings${qs ? '?' + qs : ''}`),
  });
}

export function useRecentEarnings(limit = 10) {
  return useQuery({
    queryKey: ['earnings', 'recent', limit],
    queryFn: () => apiFetch<EarningsEntry[]>(`/api/earnings/recent?limit=${limit}`),
  });
}

export function useEarningsByTicker(ticker: string) {
  return useQuery({
    queryKey: ['earnings', 'ticker', ticker],
    queryFn: () => apiFetch<EarningsEntry[]>(`/api/earnings/${ticker}`),
    enabled: !!ticker,
  });
}
