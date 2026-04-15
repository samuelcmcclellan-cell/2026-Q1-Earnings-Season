import type { IncomingMessage, ServerResponse } from 'node:http';
import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';

let app: express.Express | null = null;
let db: any = null;

function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql: string, params: any[] = []): any | null {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

function avgArr(a: number[]): number {
  return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
}

function growthVsPrior(current: number | null, prior: number | null): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

function computeExpectedBlended(entries: any[]) {
  const expectedEps: number[] = [], expectedRev: number[] = [];
  const blendedEps: number[] = [], blendedRev: number[] = [];
  for (const e of entries) {
    const expEg = growthVsPrior(e.eps_estimate, e.eps_actual_prior_year);
    if (expEg !== null) expectedEps.push(expEg);
    const expRg = growthVsPrior(e.revenue_estimate, e.revenue_actual_prior_year);
    if (expRg !== null) expectedRev.push(expRg);
    const bEps = e.status === 'reported' ? (e.eps_actual ?? e.eps_estimate) : e.eps_estimate;
    const bRev = e.status === 'reported' ? (e.revenue_actual ?? e.revenue_estimate) : e.revenue_estimate;
    const bEg = growthVsPrior(bEps, e.eps_actual_prior_year);
    if (bEg !== null) blendedEps.push(bEg);
    const bRg = growthVsPrior(bRev, e.revenue_actual_prior_year);
    if (bRg !== null) blendedRev.push(bRg);
  }
  return { expectedEps, expectedRev, blendedEps, blendedRev };
}

async function getApp() {
  if (app) return app;

  const wasmPath = path.join(process.cwd(), 'server/data/sql-wasm.wasm');
  const initOptions: any = {};
  if (fs.existsSync(wasmPath)) {
    initOptions.wasmBinary = fs.readFileSync(wasmPath);
  }
  const SQL = await initSqlJs(initOptions);
  const dbPath = path.join(process.cwd(), 'server/data/earnings.db');
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
    const schemaPath = path.join(process.cwd(), 'server/src/db/schema.sql');
    if (fs.existsSync(schemaPath)) db.run(fs.readFileSync(schemaPath, 'utf-8'));
  }
  db.run('PRAGMA foreign_keys = ON');

  app = express();
  app.use(cors());
  app.use(express.json());

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: 'vercel' });
  });

  // Companies
  app.get('/api/companies', (req, res) => {
    let sql = 'SELECT * FROM companies WHERE 1=1';
    const params: any[] = [];
    if (req.query.sector) { sql += ' AND sector = ?'; params.push(req.query.sector); }
    if (req.query.region) { sql += ' AND region = ?'; params.push(req.query.region); }
    if (req.query.style) { sql += ' AND style = ?'; params.push(req.query.style); }
    if (req.query.market_cap_category) { sql += ' AND market_cap_category = ?'; params.push(req.query.market_cap_category); }
    sql += ' ORDER BY ticker';
    res.json(queryAll(sql, params));
  });

  app.get('/api/companies/:ticker', (req, res) => {
    const row = queryOne('SELECT * FROM companies WHERE ticker = ?', [req.params.ticker.toUpperCase()]);
    if (!row) return res.status(404).json({ error: 'Company not found' });
    res.json(row);
  });

  // Calendar
  app.get('/api/calendar', (req, res) => {
    let sql = `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.market_cap_category, c.style
               FROM earnings_reports e JOIN companies c ON e.company_id = c.id WHERE 1=1`;
    const params: any[] = [];
    if (req.query.from) { sql += ' AND e.report_date >= ?'; params.push(req.query.from); }
    if (req.query.to) { sql += ' AND e.report_date <= ?'; params.push(req.query.to); }
    sql += ' ORDER BY e.report_date, c.ticker';
    res.json(queryAll(sql, params));
  });

  app.get('/api/calendar/upcoming', (req, res) => {
    const days = parseInt(req.query.days as string) || 14;
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    res.json(queryAll(
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.market_cap_category, c.style
       FROM earnings_reports e JOIN companies c ON e.company_id = c.id
       WHERE e.report_date >= ? AND e.report_date <= ?
       ORDER BY e.report_date, c.ticker`, [today, future]
    ));
  });

  app.get('/api/calendar/week/:weekOf', (req, res) => {
    const d = new Date(req.params.weekOf);
    const day = d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
    res.json(queryAll(
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.market_cap_category, c.style
       FROM earnings_reports e JOIN companies c ON e.company_id = c.id
       WHERE e.report_date >= ? AND e.report_date <= ?
       ORDER BY e.report_date, c.ticker`,
      [mon.toISOString().split('T')[0], fri.toISOString().split('T')[0]]
    ));
  });

  // Earnings
  app.get('/api/earnings', (req, res) => {
    let sql = `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.country, c.industry, c.market_cap_category, c.style
               FROM earnings_reports e JOIN companies c ON e.company_id = c.id WHERE 1=1`;
    const params: any[] = [];
    if (req.query.status) { sql += ' AND e.status = ?'; params.push(req.query.status); }
    if (req.query.sector) { sql += ' AND c.sector = ?'; params.push(req.query.sector); }
    if (req.query.region) { sql += ' AND c.region = ?'; params.push(req.query.region); }
    if (req.query.style) { sql += ' AND c.style = ?'; params.push(req.query.style); }
    if (req.query.market_cap_category) { sql += ' AND c.market_cap_category = ?'; params.push(req.query.market_cap_category); }
    sql += ' ORDER BY e.report_date DESC';
    const limit = parseInt(req.query.limit as string) || 200;
    const offset = parseInt(req.query.offset as string) || 0;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    res.json(queryAll(sql, params));
  });

  app.get('/api/earnings/recent', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(queryAll(
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.country, c.industry, c.market_cap_category, c.style
       FROM earnings_reports e JOIN companies c ON e.company_id = c.id
       WHERE e.status = 'reported' ORDER BY e.report_date DESC, c.ticker LIMIT ?`, [limit]
    ));
  });

  app.get('/api/earnings/:ticker', (req, res) => {
    res.json(queryAll(
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.country, c.industry, c.market_cap_category, c.style
       FROM earnings_reports e JOIN companies c ON e.company_id = c.id
       WHERE c.ticker = ? ORDER BY e.report_date DESC`, [req.params.ticker.toUpperCase()]
    ));
  });

  // Scorecard
  app.get('/api/scorecard', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    const all = queryAll(
      `SELECT e.*, c.sector, c.region, c.style, c.market_cap_category FROM earnings_reports e
       JOIN companies c ON e.company_id = c.id WHERE e.fiscal_quarter = ?`, [quarter]
    );
    const reported = all.filter((e: any) => e.status === 'reported');
    let epsBeat = 0, epsMiss = 0, epsMeet = 0, revBeat = 0, revMiss = 0, revMeet = 0;
    let epsSum = 0, revSum = 0, rxnSum = 0, epsN = 0, revN = 0, rxnN = 0, gUp = 0, gDown = 0, gMaint = 0;
    const epsGrowthYoy: number[] = [], revGrowthYoy: number[] = [], grossMargins: number[] = [], opMargins: number[] = [], fwdRevisions: number[] = [];
    for (const e of reported) {
      if (e.eps_surprise_pct != null) {
        if (e.eps_surprise_pct > 0.5) epsBeat++; else if (e.eps_surprise_pct < -0.5) epsMiss++; else epsMeet++;
        epsSum += e.eps_surprise_pct; epsN++;
      }
      if (e.revenue_surprise_pct != null) {
        if (e.revenue_surprise_pct > 0.5) revBeat++; else if (e.revenue_surprise_pct < -0.5) revMiss++; else revMeet++;
        revSum += e.revenue_surprise_pct; revN++;
      }
      if (e.stock_reaction_pct != null) { rxnSum += e.stock_reaction_pct; rxnN++; }
      if (e.guidance_direction === 'raised') gUp++;
      if (e.guidance_direction === 'lowered') gDown++;
      if (e.guidance_direction === 'maintained') gMaint++;
      if (e.eps_growth_yoy != null) epsGrowthYoy.push(e.eps_growth_yoy);
      if (e.revenue_growth_yoy != null) revGrowthYoy.push(e.revenue_growth_yoy);
      if (e.gross_margin != null) grossMargins.push(e.gross_margin);
      if (e.operating_margin != null) opMargins.push(e.operating_margin);
      if (e.forward_eps_current != null && e.forward_eps_30d_ago != null && e.forward_eps_30d_ago !== 0)
        fwdRevisions.push(((e.forward_eps_current - e.forward_eps_30d_ago) / Math.abs(e.forward_eps_30d_ago)) * 100);
    }
    const sectorMap = new Map<string, any[]>();
    for (const e of all) { const l = sectorMap.get(e.sector) || []; l.push(e); sectorMap.set(e.sector, l); }
    const { expectedEps: allExpEps, expectedRev: allExpRev, blendedEps: allBlndEps, blendedRev: allBlndRev } = computeExpectedBlended(all);
    const bySector = Array.from(sectorMap.entries()).map(([sector, entries]) => {
      const sr = entries.filter((e: any) => e.status === 'reported');
      const sEB = sr.filter((e: any) => e.eps_surprise_pct != null && e.eps_surprise_pct > 0.5).length;
      const sRB = sr.filter((e: any) => e.revenue_surprise_pct != null && e.revenue_surprise_pct > 0.5).length;
      const sEpsGrowth = sr.filter((e: any) => e.eps_growth_yoy != null).map((e: any) => e.eps_growth_yoy);
      const sRevGrowth = sr.filter((e: any) => e.revenue_growth_yoy != null).map((e: any) => e.revenue_growth_yoy);
      const sGM = sr.filter((e: any) => e.gross_margin != null).map((e: any) => e.gross_margin);
      const sOM = sr.filter((e: any) => e.operating_margin != null).map((e: any) => e.operating_margin);
      const sGR = sr.filter((e: any) => e.guidance_direction === 'raised').length;
      const sGL = sr.filter((e: any) => e.guidance_direction === 'lowered').length;
      const sFwd = sr.filter((e: any) => e.forward_eps_current != null && e.forward_eps_30d_ago != null && e.forward_eps_30d_ago !== 0)
        .map((e: any) => ((e.forward_eps_current - e.forward_eps_30d_ago) / Math.abs(e.forward_eps_30d_ago)) * 100);
      const { expectedEps: sExpEps, expectedRev: sExpRev, blendedEps: sBlndEps, blendedRev: sBlndRev } = computeExpectedBlended(entries);
      return {
        sector, totalCompanies: entries.length, reportedCompanies: sr.length,
        pctBeatingEps: sr.length ? (sEB / sr.length) * 100 : 0,
        pctBeatingRev: sr.length ? (sRB / sr.length) * 100 : 0,
        avgEpsSurprisePct: avgArr(sr.filter((e: any) => e.eps_surprise_pct != null).map((e: any) => e.eps_surprise_pct)),
        avgStockReaction: avgArr(sr.filter((e: any) => e.stock_reaction_pct != null).map((e: any) => e.stock_reaction_pct)),
        avgEpsGrowthYoy: avgArr(sEpsGrowth), avgRevenueGrowthYoy: avgArr(sRevGrowth),
        avgGrossMargin: avgArr(sGM), avgOperatingMargin: avgArr(sOM),
        pctGuidanceRaised: sr.length ? (sGR / sr.length) * 100 : 0,
        pctGuidanceLowered: sr.length ? (sGL / sr.length) * 100 : 0,
        forwardEpsRevisionPct: avgArr(sFwd),
        expectedEpsGrowthYoy: avgArr(sExpEps), expectedRevGrowthYoy: avgArr(sExpRev),
        blendedEpsGrowthYoy: avgArr(sBlndEps), blendedRevGrowthYoy: avgArr(sBlndRev),
      };
    }).sort((a, b) => a.sector.localeCompare(b.sector));
    const regionMap = new Map<string, any[]>();
    for (const e of all) { const l = regionMap.get(e.region) || []; l.push(e); regionMap.set(e.region, l); }
    const byRegion = Array.from(regionMap.entries()).map(([region, entries]) => {
      const rr = entries.filter((e: any) => e.status === 'reported');
      const { expectedEps: rExpEps, expectedRev: rExpRev, blendedEps: rBlndEps, blendedRev: rBlndRev } = computeExpectedBlended(entries);
      return {
        region, totalCompanies: entries.length, reportedCompanies: rr.length,
        pctBeatingEps: rr.length ? (rr.filter((e: any) => e.eps_surprise_pct != null && e.eps_surprise_pct > 0.5).length / rr.length) * 100 : 0,
        pctBeatingRev: rr.length ? (rr.filter((e: any) => e.revenue_surprise_pct != null && e.revenue_surprise_pct > 0.5).length / rr.length) * 100 : 0,
        avgEpsGrowthYoy: avgArr(rr.filter((e: any) => e.eps_growth_yoy != null).map((e: any) => e.eps_growth_yoy)),
        avgRevenueGrowthYoy: avgArr(rr.filter((e: any) => e.revenue_growth_yoy != null).map((e: any) => e.revenue_growth_yoy)),
        avgStockReaction: avgArr(rr.filter((e: any) => e.stock_reaction_pct != null).map((e: any) => e.stock_reaction_pct)),
        pctGuidanceRaised: rr.length ? (rr.filter((e: any) => e.guidance_direction === 'raised').length / rr.length) * 100 : 0,
        pctGuidanceLowered: rr.length ? (rr.filter((e: any) => e.guidance_direction === 'lowered').length / rr.length) * 100 : 0,
        expectedEpsGrowthYoy: avgArr(rExpEps), expectedRevGrowthYoy: avgArr(rExpRev),
        blendedEpsGrowthYoy: avgArr(rBlndEps), blendedRevGrowthYoy: avgArr(rBlndRev),
      };
    });
    res.json({
      quarter, totalCompanies: all.length, totalReported: reported.length,
      pctReported: all.length ? (reported.length / all.length) * 100 : 0,
      epsBeatCount: epsBeat, epsMissCount: epsMiss, epsMeetCount: epsMeet,
      pctBeatingEps: epsN ? (epsBeat / epsN) * 100 : 0,
      revBeatCount: revBeat, revMissCount: revMiss, revMeetCount: revMeet,
      pctBeatingRev: revN ? (revBeat / revN) * 100 : 0,
      avgEpsSurprisePct: epsN ? epsSum / epsN : 0,
      avgRevSurprisePct: revN ? revSum / revN : 0,
      avgStockReaction: rxnN ? rxnSum / rxnN : 0,
      guidanceRaisedCount: gUp, guidanceLoweredCount: gDown,
      guidanceMaintainedCount: gMaint, netGuidance: gUp - gDown,
      avgEpsGrowthYoy: avgArr(epsGrowthYoy), avgRevenueGrowthYoy: avgArr(revGrowthYoy),
      avgGrossMargin: avgArr(grossMargins), avgOperatingMargin: avgArr(opMargins),
      forwardEpsRevisionPct: avgArr(fwdRevisions),
      expectedEpsGrowthYoy: avgArr(allExpEps), expectedRevGrowthYoy: avgArr(allExpRev),
      expectedCompaniesIncluded: allExpEps.length,
      blendedEpsGrowthYoy: avgArr(allBlndEps), blendedRevGrowthYoy: avgArr(allBlndRev),
      blendedCompaniesIncluded: allBlndEps.length,
      bySector, byRegion,
    });
  });

  app.get('/api/scorecard/sectors', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    res.json(queryAll('SELECT * FROM sector_scores WHERE fiscal_quarter = ? ORDER BY sector', [quarter]));
  });

  // Sectors
  app.get('/api/sectors', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    res.json(queryAll('SELECT * FROM sector_scores WHERE fiscal_quarter = ? ORDER BY sector', [quarter]));
  });

  app.get('/api/sectors/:sector', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    const score = queryOne('SELECT * FROM sector_scores WHERE sector = ? AND fiscal_quarter = ?', [req.params.sector, quarter]);
    const earnings = queryAll(
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.country, c.industry, c.market_cap_category, c.style FROM earnings_reports e
       JOIN companies c ON e.company_id = c.id
       WHERE c.sector = ? AND e.fiscal_quarter = ? ORDER BY e.report_date`, [req.params.sector, quarter]
    );
    res.json({ score, earnings });
  });

  // Regions
  app.get('/api/regions', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    const all = queryAll(`SELECT e.*, c.region, c.country FROM earnings_reports e JOIN companies c ON e.company_id = c.id WHERE e.fiscal_quarter = ?`, [quarter]);
    const mapR = (r: string, c: string) => r === 'us' ? 'United States' : r === 'europe' ? 'Europe' : c === 'JP' ? 'Japan' : (c === 'CN' || c === 'HK') ? 'China' : 'EM';
    const rm = new Map<string, any[]>();
    for (const e of all) { const rn = mapR(e.region, e.country); const l = rm.get(rn) || []; l.push(e); rm.set(rn, l); }
    const regions = Array.from(rm.entries()).map(([region, entries]) => {
      const rpt = entries.filter((e: any) => e.status === 'reported');
      return {
        region, totalCompanies: entries.length, reportedCompanies: rpt.length,
        pctBeatingEps: rpt.length ? (rpt.filter((e: any) => e.eps_surprise_pct > 0.5).length / rpt.length) * 100 : 0,
        pctBeatingRev: rpt.length ? (rpt.filter((e: any) => e.revenue_surprise_pct > 0.5).length / rpt.length) * 100 : 0,
        avgEpsGrowthYoy: avgArr(rpt.filter((e: any) => e.eps_growth_yoy != null).map((e: any) => e.eps_growth_yoy)),
        avgRevenueGrowthYoy: avgArr(rpt.filter((e: any) => e.revenue_growth_yoy != null).map((e: any) => e.revenue_growth_yoy)),
        avgStockReaction: avgArr(rpt.filter((e: any) => e.stock_reaction_pct != null).map((e: any) => e.stock_reaction_pct)),
        pctGuidanceRaised: rpt.length ? (rpt.filter((e: any) => e.guidance_direction === 'raised').length / rpt.length) * 100 : 0,
        pctGuidanceLowered: rpt.length ? (rpt.filter((e: any) => e.guidance_direction === 'lowered').length / rpt.length) * 100 : 0,
      };
    }).sort((a, b) => b.totalCompanies - a.totalCompanies);
    res.json(regions);
  });

  app.get('/api/regions/:regionName', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    const regionName = req.params.regionName;
    const mapR = (r: string, c: string) => r === 'us' ? 'United States' : r === 'europe' ? 'Europe' : c === 'JP' ? 'Japan' : (c === 'CN' || c === 'HK') ? 'China' : 'EM';
    const all = queryAll(
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.country, c.market_cap_category, c.style, c.industry FROM earnings_reports e
       JOIN companies c ON e.company_id = c.id WHERE e.fiscal_quarter = ?`, [quarter]);
    const filtered = all.filter((e: any) => mapR(e.region, e.country) === regionName);
    const rpt = filtered.filter((e: any) => e.status === 'reported');
    res.json({
      region: regionName, totalCompanies: filtered.length, reportedCompanies: rpt.length,
      avgEpsGrowthYoy: avgArr(rpt.filter((e: any) => e.eps_growth_yoy != null).map((e: any) => e.eps_growth_yoy)),
      avgRevenueGrowthYoy: avgArr(rpt.filter((e: any) => e.revenue_growth_yoy != null).map((e: any) => e.revenue_growth_yoy)),
      companies: filtered,
    });
  });

  // Segments
  app.get('/api/segments', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    const all = queryAll(`SELECT e.*, c.market_cap_category, c.style FROM earnings_reports e JOIN companies c ON e.company_id = c.id WHERE e.fiscal_quarter = ?`, [quarter]);
    const mapCap = (c: string) => c === 'mega' ? 'Mega Cap' : c === 'large' ? 'Large Cap' : c === 'mid' ? 'Mid Cap' : 'Small Cap';
    const computeMetrics = (entries: any[]) => {
      const rpt = entries.filter((e: any) => e.status === 'reported');
      return {
        totalCompanies: entries.length, reportedCompanies: rpt.length,
        pctBeatingEps: rpt.length ? (rpt.filter((e: any) => e.eps_surprise_pct > 0.5).length / rpt.length) * 100 : 0,
        pctBeatingRev: rpt.length ? (rpt.filter((e: any) => e.revenue_surprise_pct > 0.5).length / rpt.length) * 100 : 0,
        avgEpsGrowthYoy: avgArr(rpt.filter((e: any) => e.eps_growth_yoy != null).map((e: any) => e.eps_growth_yoy)),
        avgRevenueGrowthYoy: avgArr(rpt.filter((e: any) => e.revenue_growth_yoy != null).map((e: any) => e.revenue_growth_yoy)),
        avgGrossMargin: avgArr(rpt.filter((e: any) => e.gross_margin != null).map((e: any) => e.gross_margin)),
        avgOperatingMargin: avgArr(rpt.filter((e: any) => e.operating_margin != null).map((e: any) => e.operating_margin)),
        avgStockReaction: avgArr(rpt.filter((e: any) => e.stock_reaction_pct != null).map((e: any) => e.stock_reaction_pct)),
        pctGuidanceRaised: rpt.length ? (rpt.filter((e: any) => e.guidance_direction === 'raised').length / rpt.length) * 100 : 0,
        pctGuidanceLowered: rpt.length ? (rpt.filter((e: any) => e.guidance_direction === 'lowered').length / rpt.length) * 100 : 0,
      };
    };
    const cm = new Map<string, any[]>(), sm = new Map<string, any[]>();
    for (const e of all) {
      const cap = mapCap(e.market_cap_category); (cm.get(cap) || (cm.set(cap, []), cm.get(cap)!)).push(e);
      const st = (e.style || 'blend').charAt(0).toUpperCase() + (e.style || 'blend').slice(1);
      (sm.get(st) || (sm.set(st, []), sm.get(st)!)).push(e);
    }
    const byMarketCap = Array.from(cm.entries()).map(([s, e]) => ({ segment: s, ...computeMetrics(e) })).sort((a, b) => b.totalCompanies - a.totalCompanies);
    const byStyle = Array.from(sm.entries()).map(([s, e]) => ({ segment: s, ...computeMetrics(e) })).sort((a, b) => b.totalCompanies - a.totalCompanies);
    res.json({ byMarketCap, byStyle });
  });

  // Themes
  app.get('/api/themes', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    const signals = queryAll('SELECT * FROM thematic_signals WHERE fiscal_quarter = ?', [quarter]);
    const grouped: Record<string, any[]> = {};
    for (const s of signals) { if (!grouped[s.theme]) grouped[s.theme] = []; grouped[s.theme].push(s); }
    res.json(grouped);
  });

  app.get('/api/themes/:theme', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    const signals = queryAll('SELECT * FROM thematic_signals WHERE fiscal_quarter = ? AND theme = ?', [quarter, req.params.theme]);
    const commentary = queryAll(
      `SELECT cm.*, c.ticker, c.name, c.sector FROM commentary cm
       JOIN companies c ON cm.company_id = c.id
       WHERE cm.fiscal_quarter = ? AND cm.theme_tags LIKE ?`, [quarter, `%${req.params.theme}%`]
    );
    res.json({ signals, commentary });
  });

  // Commentary
  app.get('/api/commentary', (req, res) => {
    let sql = `SELECT cm.*, c.ticker, c.name, c.sector FROM commentary cm
               JOIN companies c ON cm.company_id = c.id WHERE 1=1`;
    const params: any[] = [];
    if (req.query.quarter) { sql += ' AND cm.fiscal_quarter = ?'; params.push(req.query.quarter); }
    if (req.query.theme) { sql += ' AND cm.theme_tags LIKE ?'; params.push(`%${req.query.theme}%`); }
    if (req.query.sentiment) { sql += ' AND cm.sentiment = ?'; params.push(req.query.sentiment); }
    sql += ' ORDER BY c.ticker';
    const limit = parseInt(req.query.limit as string) || 100;
    sql += ' LIMIT ?'; params.push(limit);
    res.json(queryAll(sql, params));
  });

  // AI
  app.get('/api/ai/analyze', (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.write(`data: ${JSON.stringify({ error: 'AI analysis requires ANTHROPIC_API_KEY. Run locally with the API key configured.' })}\n\n`);
    res.end();
  });

  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const expressApp = await getApp();
  expressApp(req as any, res as any);
}
