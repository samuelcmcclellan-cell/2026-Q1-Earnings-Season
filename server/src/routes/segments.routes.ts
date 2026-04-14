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

function avgArr(a: number[]): number {
  return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
}

function mapCapCategory(cat: string): string {
  if (cat === 'mega') return 'Mega Cap';
  if (cat === 'large') return 'Large Cap';
  if (cat === 'mid') return 'Mid Cap';
  if (cat === 'small') return 'Small Cap';
  return cat;
}

function computeSegmentMetrics(entries: any[]) {
  const reported = entries.filter(e => e.status === 'reported');
  const epsBeat = reported.filter(e => e.eps_surprise_pct > 0.5).length;
  const revBeat = reported.filter(e => e.revenue_surprise_pct > 0.5).length;
  const epsGrowth = reported.filter(e => e.eps_growth_yoy !== null).map(e => e.eps_growth_yoy);
  const revGrowth = reported.filter(e => e.revenue_growth_yoy !== null).map(e => e.revenue_growth_yoy);
  const grossM = reported.filter(e => e.gross_margin !== null).map(e => e.gross_margin);
  const opM = reported.filter(e => e.operating_margin !== null).map(e => e.operating_margin);
  const reactions = reported.filter(e => e.stock_reaction_pct !== null).map(e => e.stock_reaction_pct);
  const guidR = reported.filter(e => e.guidance_direction === 'raised').length;
  const guidL = reported.filter(e => e.guidance_direction === 'lowered').length;

  return {
    totalCompanies: entries.length,
    reportedCompanies: reported.length,
    pctBeatingEps: reported.length > 0 ? (epsBeat / reported.length) * 100 : 0,
    pctBeatingRev: reported.length > 0 ? (revBeat / reported.length) * 100 : 0,
    avgEpsGrowthYoy: avgArr(epsGrowth),
    avgRevenueGrowthYoy: avgArr(revGrowth),
    avgGrossMargin: avgArr(grossM),
    avgOperatingMargin: avgArr(opM),
    avgStockReaction: avgArr(reactions),
    pctGuidanceRaised: reported.length > 0 ? (guidR / reported.length) * 100 : 0,
    pctGuidanceLowered: reported.length > 0 ? (guidL / reported.length) * 100 : 0,
  };
}

router.get('/', async (_req, res) => {
  const quarter = (_req.query.quarter as string) || 'Q1 2026';
  const db = await getDb();

  const all = queryAll(db,
    `SELECT e.*, c.market_cap_category, c.style FROM earnings_reports e
     JOIN companies c ON e.company_id = c.id
     WHERE e.fiscal_quarter = ?`, [quarter]);

  // By market cap
  const capMap = new Map<string, any[]>();
  for (const e of all) {
    const cat = mapCapCategory(e.market_cap_category);
    const list = capMap.get(cat) || [];
    list.push(e);
    capMap.set(cat, list);
  }
  const byMarketCap = [];
  for (const [segment, entries] of capMap) {
    byMarketCap.push({ segment, ...computeSegmentMetrics(entries) });
  }
  byMarketCap.sort((a, b) => b.totalCompanies - a.totalCompanies);

  // By style
  const styleMap = new Map<string, any[]>();
  for (const e of all) {
    const st = (e.style || 'blend').charAt(0).toUpperCase() + (e.style || 'blend').slice(1);
    const list = styleMap.get(st) || [];
    list.push(e);
    styleMap.set(st, list);
  }
  const byStyle = [];
  for (const [segment, entries] of styleMap) {
    byStyle.push({ segment, ...computeSegmentMetrics(entries) });
  }
  byStyle.sort((a, b) => b.totalCompanies - a.totalCompanies);

  res.json({ byMarketCap, byStyle });
});

export default router;
