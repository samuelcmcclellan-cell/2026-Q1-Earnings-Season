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
  country: string;
  industry: string;
  market_cap_category: string;
  style: string;
  eps_growth_yoy: number | null;
  revenue_growth_yoy: number | null;
  eps_growth_qoq: number | null;
  revenue_growth_qoq: number | null;
  gross_margin: number | null;
  operating_margin: number | null;
  gross_margin_prior: number | null;
  operating_margin_prior: number | null;
  forward_eps_current: number | null;
  forward_eps_30d_ago: number | null;
  forward_revenue_current: number | null;
  forward_revenue_30d_ago: number | null;
  data_source: string;
}

export function useEarnings(filters?: {
  status?: string;
  sector?: string;
  region?: string;
  style?: string;
  market_cap_category?: string;
  limit?: number;
  sort?: string;
  order?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.sector) params.set('sector', filters.sector);
  if (filters?.region) params.set('region', filters.region);
  if (filters?.style) params.set('style', filters.style);
  if (filters?.market_cap_category) params.set('market_cap_category', filters.market_cap_category);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.sort) params.set('sort', filters.sort);
  if (filters?.order) params.set('order', filters.order);

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
