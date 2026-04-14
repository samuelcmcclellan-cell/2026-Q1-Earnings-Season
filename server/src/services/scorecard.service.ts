import { getDb } from '../db/connection.ts';

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
}

function queryAll(db: any, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export async function computeScorecard(quarter = 'Q1 2026'): Promise<ScorecardData> {
  const db = await getDb();

  const allEarnings = queryAll(db,
    `SELECT e.*, c.sector, c.region, c.style, c.market_cap_category FROM earnings_reports e
     JOIN companies c ON e.company_id = c.id
     WHERE e.fiscal_quarter = ?`, [quarter]);

  const total = allEarnings.length;
  const reported = allEarnings.filter(e => e.status === 'reported');
  const reportedCount = reported.length;

  let epsBeat = 0, epsMiss = 0, epsMeet = 0;
  let revBeat = 0, revMiss = 0, revMeet = 0;
  let epsSum = 0, revSum = 0, reactionSum = 0;
  let guidanceRaised = 0, guidanceLowered = 0, guidanceMaintained = 0;
  let epsCount = 0, revCount = 0, reactionCount = 0;
  const epsGrowthYoy: number[] = [];
  const revGrowthYoy: number[] = [];
  const grossMargins: number[] = [];
  const opMargins: number[] = [];
  const fwdRevisions: number[] = [];

  for (const e of reported) {
    if (e.eps_surprise_pct !== null) {
      if (e.eps_surprise_pct > 0.5) epsBeat++;
      else if (e.eps_surprise_pct < -0.5) epsMiss++;
      else epsMeet++;
      epsSum += e.eps_surprise_pct;
      epsCount++;
    }
    if (e.revenue_surprise_pct !== null) {
      if (e.revenue_surprise_pct > 0.5) revBeat++;
      else if (e.revenue_surprise_pct < -0.5) revMiss++;
      else revMeet++;
      revSum += e.revenue_surprise_pct;
      revCount++;
    }
    if (e.stock_reaction_pct !== null) {
      reactionSum += e.stock_reaction_pct;
      reactionCount++;
    }
    if (e.guidance_direction === 'raised') guidanceRaised++;
    if (e.guidance_direction === 'lowered') guidanceLowered++;
    if (e.guidance_direction === 'maintained') guidanceMaintained++;
    if (e.eps_growth_yoy !== null) epsGrowthYoy.push(e.eps_growth_yoy);
    if (e.revenue_growth_yoy !== null) revGrowthYoy.push(e.revenue_growth_yoy);
    if (e.gross_margin !== null) grossMargins.push(e.gross_margin);
    if (e.operating_margin !== null) opMargins.push(e.operating_margin);
    if (e.forward_eps_current !== null && e.forward_eps_30d_ago !== null && e.forward_eps_30d_ago !== 0) {
      fwdRevisions.push(((e.forward_eps_current - e.forward_eps_30d_ago) / Math.abs(e.forward_eps_30d_ago)) * 100);
    }
  }

  // Sector breakdown
  const sectorMap = new Map<string, typeof allEarnings>();
  for (const e of allEarnings) {
    const list = sectorMap.get(e.sector) || [];
    list.push(e);
    sectorMap.set(e.sector, list);
  }

  const bySector: SectorScorecard[] = [];
  for (const [sector, entries] of sectorMap) {
    const sReported = entries.filter(e => e.status === 'reported');
    const sEpsBeat = sReported.filter(e => e.eps_surprise_pct !== null && e.eps_surprise_pct > 0.5).length;
    const sRevBeat = sReported.filter(e => e.revenue_surprise_pct !== null && e.revenue_surprise_pct > 0.5).length;
    const sEpsGrowth = sReported.filter(e => e.eps_growth_yoy !== null).map(e => e.eps_growth_yoy as number);
    const sRevGrowth = sReported.filter(e => e.revenue_growth_yoy !== null).map(e => e.revenue_growth_yoy as number);
    const sGrossM = sReported.filter(e => e.gross_margin !== null).map(e => e.gross_margin as number);
    const sOpM = sReported.filter(e => e.operating_margin !== null).map(e => e.operating_margin as number);
    const sGuidanceR = sReported.filter(e => e.guidance_direction === 'raised').length;
    const sGuidanceL = sReported.filter(e => e.guidance_direction === 'lowered').length;
    const sFwdRev = sReported.filter(e => e.forward_eps_current !== null && e.forward_eps_30d_ago !== null && e.forward_eps_30d_ago !== 0)
      .map(e => ((e.forward_eps_current - e.forward_eps_30d_ago) / Math.abs(e.forward_eps_30d_ago)) * 100);

    bySector.push({
      sector,
      totalCompanies: entries.length,
      reportedCompanies: sReported.length,
      pctBeatingEps: sReported.length > 0 ? (sEpsBeat / sReported.length) * 100 : 0,
      pctBeatingRev: sReported.length > 0 ? (sRevBeat / sReported.length) * 100 : 0,
      avgEpsSurprisePct: avg(sReported.filter(e => e.eps_surprise_pct !== null).map(e => e.eps_surprise_pct)),
      avgStockReaction: avg(sReported.filter(e => e.stock_reaction_pct !== null).map(e => e.stock_reaction_pct)),
      avgEpsGrowthYoy: avg(sEpsGrowth),
      avgRevenueGrowthYoy: avg(sRevGrowth),
      avgGrossMargin: avg(sGrossM),
      avgOperatingMargin: avg(sOpM),
      pctGuidanceRaised: sReported.length > 0 ? (sGuidanceR / sReported.length) * 100 : 0,
      pctGuidanceLowered: sReported.length > 0 ? (sGuidanceL / sReported.length) * 100 : 0,
      forwardEpsRevisionPct: avg(sFwdRev),
    });
  }
  bySector.sort((a, b) => a.sector.localeCompare(b.sector));

  // Region breakdown
  const regionMap = new Map<string, typeof allEarnings>();
  for (const e of allEarnings) {
    const list = regionMap.get(e.region) || [];
    list.push(e);
    regionMap.set(e.region, list);
  }

  const byRegion: RegionScorecard[] = [];
  for (const [region, entries] of regionMap) {
    const rReported = entries.filter(e => e.status === 'reported');
    const rEpsBeat = rReported.filter(e => e.eps_surprise_pct !== null && e.eps_surprise_pct > 0.5).length;
    const rRevBeat = rReported.filter(e => e.revenue_surprise_pct !== null && e.revenue_surprise_pct > 0.5).length;
    const rGrowthEps = rReported.filter(e => e.eps_growth_yoy !== null).map(e => e.eps_growth_yoy as number);
    const rGrowthRev = rReported.filter(e => e.revenue_growth_yoy !== null).map(e => e.revenue_growth_yoy as number);
    const rReaction = rReported.filter(e => e.stock_reaction_pct !== null).map(e => e.stock_reaction_pct as number);
    const rGuidanceR = rReported.filter(e => e.guidance_direction === 'raised').length;
    const rGuidanceL = rReported.filter(e => e.guidance_direction === 'lowered').length;

    byRegion.push({
      region,
      totalCompanies: entries.length,
      reportedCompanies: rReported.length,
      pctBeatingEps: rReported.length > 0 ? (rEpsBeat / rReported.length) * 100 : 0,
      pctBeatingRev: rReported.length > 0 ? (rRevBeat / rReported.length) * 100 : 0,
      avgEpsGrowthYoy: avg(rGrowthEps),
      avgRevenueGrowthYoy: avg(rGrowthRev),
      avgStockReaction: avg(rReaction),
      pctGuidanceRaised: rReported.length > 0 ? (rGuidanceR / rReported.length) * 100 : 0,
      pctGuidanceLowered: rReported.length > 0 ? (rGuidanceL / rReported.length) * 100 : 0,
    });
  }

  return {
    quarter,
    totalCompanies: total,
    totalReported: reportedCount,
    pctReported: total > 0 ? (reportedCount / total) * 100 : 0,
    epsBeatCount: epsBeat,
    epsMissCount: epsMiss,
    epsMeetCount: epsMeet,
    pctBeatingEps: epsCount > 0 ? (epsBeat / epsCount) * 100 : 0,
    revBeatCount: revBeat,
    revMissCount: revMiss,
    revMeetCount: revMeet,
    pctBeatingRev: revCount > 0 ? (revBeat / revCount) * 100 : 0,
    avgEpsSurprisePct: epsCount > 0 ? epsSum / epsCount : 0,
    avgRevSurprisePct: revCount > 0 ? revSum / revCount : 0,
    avgStockReaction: reactionCount > 0 ? reactionSum / reactionCount : 0,
    guidanceRaisedCount: guidanceRaised,
    guidanceLoweredCount: guidanceLowered,
    guidanceMaintainedCount: guidanceMaintained,
    netGuidance: guidanceRaised - guidanceLowered,
    avgEpsGrowthYoy: avg(epsGrowthYoy),
    avgRevenueGrowthYoy: avg(revGrowthYoy),
    avgGrossMargin: avg(grossMargins),
    avgOperatingMargin: avg(opMargins),
    forwardEpsRevisionPct: avg(fwdRevisions),
    bySector,
    byRegion,
  };
}
