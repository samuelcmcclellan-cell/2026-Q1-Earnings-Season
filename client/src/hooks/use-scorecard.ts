import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface ScorecardData {
  quarter: string;
  totalCompanies: number;
  totalReported: number;
  pctReported: number;
  epsBeatCount: number;
  epsMissCount: number;
  epsMeetCount: number;
  pctBeatingEps: number;
  revBeatCount: number;
  revMissCount: number;
  revMeetCount: number;
  pctBeatingRev: number;
  avgEpsSurprisePct: number;
  avgRevSurprisePct: number;
  avgStockReaction: number;
  guidanceRaisedCount: number;
  guidanceLoweredCount: number;
  guidanceMaintainedCount: number;
  netGuidance: number;
  avgEpsGrowthYoy: number;
  avgRevenueGrowthYoy: number;
  avgGrossMargin: number;
  avgOperatingMargin: number;
  forwardEpsRevisionPct: number;
  // Expected: estimates for ALL companies vs prior-year actuals (pre-season benchmark)
  expectedEpsGrowthYoy: number;
  expectedRevGrowthYoy: number;
  expectedCompaniesIncluded: number;
  // Blended: actuals for reported + estimates for upcoming (running season aggregate)
  blendedEpsGrowthYoy: number;
  blendedRevGrowthYoy: number;
  blendedCompaniesIncluded: number;
  // ISO timestamp (UTC) of the most recent reported-record update; null if nothing reported yet.
  lastRefreshedAt: string | null;
  bySector: SectorScorecard[];
  byRegion: RegionScorecard[];
}

export interface SectorScorecard {
  sector: string;
  totalCompanies: number;
  reportedCompanies: number;
  pctBeatingEps: number;
  pctBeatingRev: number;
  avgEpsSurprisePct: number;
  avgStockReaction: number;
  avgEpsGrowthYoy: number;
  avgRevenueGrowthYoy: number;
  avgGrossMargin: number;
  avgOperatingMargin: number;
  pctGuidanceRaised: number;
  pctGuidanceLowered: number;
  forwardEpsRevisionPct: number;
  expectedEpsGrowthYoy: number;
  expectedRevGrowthYoy: number;
  blendedEpsGrowthYoy: number;
  blendedRevGrowthYoy: number;
}

export interface RegionScorecard {
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
  expectedEpsGrowthYoy: number;
  expectedRevGrowthYoy: number;
  blendedEpsGrowthYoy: number;
  blendedRevGrowthYoy: number;
}

export function useScorecard(quarter = 'Q1 2026') {
  return useQuery({
    queryKey: ['scorecard', quarter],
    queryFn: () => apiFetch<ScorecardData>(`/api/scorecard?quarter=${quarter}`),
  });
}
