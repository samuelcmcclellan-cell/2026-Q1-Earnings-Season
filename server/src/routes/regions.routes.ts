import { Router } from 'express';
import { getDb } from '../db/connection.ts';

const router = Router();

function queryAll(db: any, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

// Map regions to display names with sub-regions for Asia
function mapRegion(region: string, country: string): string {
  if (region === 'us') return 'United States';
  if (region === 'europe') return 'Europe';
  if (region === 'asia') {
    if (country === 'JP') return 'Japan';
    if (country === 'CN' || country === 'HK') return 'China';
    return 'EM';
  }
  return 'EM';
}

router.get('/', async (_req, res) => {
  const quarter = (_req.query.quarter as string) || 'Q1 2026';
  const db = await getDb();

  const all = queryAll(db,
    `SELECT e.*, c.region, c.country FROM earnings_reports e
     JOIN companies c ON e.company_id = c.id
     WHERE e.fiscal_quarter = ?`, [quarter]);

  const regionMap = new Map<string, any[]>();
  for (const e of all) {
    const rn = mapRegion(e.region, e.country);
    const list = regionMap.get(rn) || [];
    list.push(e);
    regionMap.set(rn, list);
  }

  const regions = [];
  for (const [region, entries] of regionMap) {
    const reported = entries.filter(e => e.status === 'reported');
    const epsBeat = reported.filter(e => e.eps_surprise_pct > 0.5).length;
    const revBeat = reported.filter(e => e.revenue_surprise_pct > 0.5).length;
    const epsGrowth = reported.filter(e => e.eps_growth_yoy !== null).map(e => e.eps_growth_yoy);
    const revGrowth = reported.filter(e => e.revenue_growth_yoy !== null).map(e => e.revenue_growth_yoy);
    const reactions = reported.filter(e => e.stock_reaction_pct !== null).map(e => e.stock_reaction_pct);
    const guidR = reported.filter(e => e.guidance_direction === 'raised').length;
    const guidL = reported.filter(e => e.guidance_direction === 'lowered').length;

    const avgArr = (a: number[]) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;

    regions.push({
      region,
      totalCompanies: entries.length,
      reportedCompanies: reported.length,
      pctBeatingEps: reported.length > 0 ? (epsBeat / reported.length) * 100 : 0,
      pctBeatingRev: reported.length > 0 ? (revBeat / reported.length) * 100 : 0,
      avgEpsGrowthYoy: avgArr(epsGrowth),
      avgRevenueGrowthYoy: avgArr(revGrowth),
      avgStockReaction: avgArr(reactions),
      pctGuidanceRaised: reported.length > 0 ? (guidR / reported.length) * 100 : 0,
      pctGuidanceLowered: reported.length > 0 ? (guidL / reported.length) * 100 : 0,
    });
  }

  regions.sort((a, b) => b.totalCompanies - a.totalCompanies);
  res.json(regions);
});

router.get('/:regionName', async (req, res) => {
  const regionName = req.params.regionName;
  const quarter = (req.query.quarter as string) || 'Q1 2026';
  const db = await getDb();

  const all = queryAll(db,
    `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.country, c.market_cap_category, c.style, c.industry
     FROM earnings_reports e
     JOIN companies c ON e.company_id = c.id
     WHERE e.fiscal_quarter = ?`, [quarter]);

  const filtered = all.filter(e => mapRegion(e.region, e.country) === regionName);

  if (filtered.length === 0) {
    res.status(404).json({ error: `Region not found: ${regionName}` });
    return;
  }

  const reported = filtered.filter(e => e.status === 'reported');
  const avgArr = (a: number[]) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;

  const epsBeat = reported.filter(e => e.eps_surprise_pct > 0.5).length;
  const grossMargins = reported.filter(e => e.gross_margin !== null).map(e => e.gross_margin);
  const opMargins = reported.filter(e => e.operating_margin !== null).map(e => e.operating_margin);
  const reactions = reported.filter(e => e.stock_reaction_pct !== null).map(e => e.stock_reaction_pct);
  const guidR = reported.filter(e => e.guidance_direction === 'raised').length;
  const guidL = reported.filter(e => e.guidance_direction === 'lowered').length;

  // Forward EPS revision
  const withRevision = reported.filter(e => e.forward_eps_current !== null && e.forward_eps_30d_ago !== null && e.forward_eps_30d_ago !== 0);
  const revisionPcts = withRevision.map(e => ((e.forward_eps_current - e.forward_eps_30d_ago) / Math.abs(e.forward_eps_30d_ago)) * 100);

  res.json({
    region: regionName,
    totalCompanies: filtered.length,
    reportedCompanies: reported.length,
    avgEpsGrowthYoy: avgArr(reported.filter(e => e.eps_growth_yoy !== null).map(e => e.eps_growth_yoy)),
    avgRevenueGrowthYoy: avgArr(reported.filter(e => e.revenue_growth_yoy !== null).map(e => e.revenue_growth_yoy)),
    pctBeatingEps: reported.length > 0 ? (epsBeat / reported.length) * 100 : 0,
    avgGrossMargin: avgArr(grossMargins),
    avgOperatingMargin: avgArr(opMargins),
    avgStockReaction: avgArr(reactions),
    pctGuidanceRaised: reported.length > 0 ? (guidR / reported.length) * 100 : 0,
    pctGuidanceLowered: reported.length > 0 ? (guidL / reported.length) * 100 : 0,
    forwardEpsRevisionPct: avgArr(revisionPcts),
    companies: filtered,
  });
});

export default router;
