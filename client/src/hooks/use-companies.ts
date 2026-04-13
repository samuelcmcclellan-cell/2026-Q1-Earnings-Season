import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface Company {
  id: number;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  region: string;
  country: string;
  market_cap_category: string;
  index_membership: string | null;
}

export function useCompanies(filters?: { sector?: string; region?: string }) {
  const params = new URLSearchParams();
  if (filters?.sector) params.set('sector', filters.sector);
  if (filters?.region) params.set('region', filters.region);
  const qs = params.toString();

  return useQuery({
    queryKey: ['companies', qs],
    queryFn: () => apiFetch<Company[]>(`/api/companies${qs ? '?' + qs : ''}`),
  });
}

export function useCompany(ticker: string) {
  return useQuery({
    queryKey: ['company', ticker],
    queryFn: () => apiFetch<Company>(`/api/companies/${ticker}`),
    enabled: !!ticker,
  });
}
