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
  bySector: SectorScorecard[];
  byRegion: { region: string; totalCompanies: number; reportedCompanies: number; pctBeatingEps: number; pctBeatingRev: number }[];
}

export interface SectorScorecard {
  sector: string;
  totalCompanies: number;
  reportedCompanies: number;
  pctBeatingEps: number;
  pctBeatingRev: number;
  avgEpsSurprisePct: number;
  avgStockReaction: number;
}

export function useScorecard(quarter = 'Q1 2026') {
  return useQuery({
    queryKey: ['scorecard', quarter],
    queryFn: () => apiFetch<ScorecardData>(`/api/scorecard?quarter=${quarter}`),
  });
}
