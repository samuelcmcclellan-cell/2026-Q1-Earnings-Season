import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface SegmentData {
  segment: string;
  totalCompanies: number;
  reportedCompanies: number;
  pctBeatingEps: number;
  pctBeatingRev: number;
  avgEpsGrowthYoy: number;
  avgRevenueGrowthYoy: number;
  avgGrossMargin: number;
  avgOperatingMargin: number;
  avgStockReaction: number;
  pctGuidanceRaised: number;
  pctGuidanceLowered: number;
}

export interface SegmentsResponse {
  byMarketCap: SegmentData[];
  byStyle: SegmentData[];
}

export function useSegments() {
  return useQuery({
    queryKey: ['segments'],
    queryFn: () => apiFetch<SegmentsResponse>('/api/segments'),
  });
}
