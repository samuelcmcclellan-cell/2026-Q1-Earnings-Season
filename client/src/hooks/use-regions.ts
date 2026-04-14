import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface RegionData {
  region: string;
  totalCompanies: number;
  reportedCompanies: number;
  pctBeatingEps: number;
  pctBeatingRev: number;
  avgEpsGrowthYoy: number;
  avgRevenueGrowthYoy: number;
  avgStockReaction: number;
  pctGuidanceRaised: number;
  pctGuidanceLowered: number;
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => apiFetch<RegionData[]>('/api/regions'),
  });
}

export interface RegionDetailData {
  region: string;
  totalCompanies: number;
  reportedCompanies: number;
  avgEpsGrowthYoy: number;
  avgRevenueGrowthYoy: number;
  pctBeatingEps: number;
  avgGrossMargin: number;
  avgOperatingMargin: number;
  avgStockReaction: number;
  pctGuidanceRaised: number;
  pctGuidanceLowered: number;
  forwardEpsRevisionPct: number;
  companies: any[];
}

export function useRegionDetail(regionName: string) {
  return useQuery({
    queryKey: ['regions', regionName],
    queryFn: () => apiFetch<RegionDetailData>(`/api/regions/${encodeURIComponent(regionName)}`),
    enabled: !!regionName,
  });
}
