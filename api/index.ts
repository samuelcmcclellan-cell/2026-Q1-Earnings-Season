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

async function getApp() {
  if (app) return app;

  const SQL = await initSqlJs();
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
    let sql = `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.market_cap_category
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
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.market_cap_category
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
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.market_cap_category
       FROM earnings_reports e JOIN companies c ON e.company_id = c.id
       WHERE e.report_date >= ? AND e.report_date <= ?
       ORDER BY e.report_date, c.ticker`,
      [mon.toISOString().split('T')[0], fri.toISOString().split('T')[0]]
    ));
  });

  // Earnings
  app.get('/api/earnings', (req, res) => {
    let sql = `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.industry, c.market_cap_category
               FROM earnings_reports e JOIN companies c ON e.company_id = c.id WHERE 1=1`;
    const params: any[] = [];
    if (req.query.status) { sql += ' AND e.status = ?'; params.push(req.query.status); }
    if (req.query.sector) { sql += ' AND c.sector = ?'; params.push(req.query.sector); }
    if (req.query.region) { sql += ' AND c.region = ?'; params.push(req.query.region); }
    const sort = req.query.sort || 'report_date';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY e.${sort === 'ticker' ? 'report_date' : sort} ${order}`;
    const limit = parseInt(req.query.limit as string) || 200;
    const offset = parseInt(req.query.offset as string) || 0;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    res.json(queryAll(sql, params));
  });

  app.get('/api/earnings/recent', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(queryAll(
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.industry, c.market_cap_category
       FROM earnings_reports e JOIN companies c ON e.company_id = c.id
       WHERE e.status = 'reported' ORDER BY e.report_date DESC, c.ticker LIMIT ?`, [limit]
    ));
  });

  app.get('/api/earnings/:ticker', (req, res) => {
    res.json(queryAll(
      `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.industry, c.market_cap_category
       FROM earnings_reports e JOIN companies c ON e.company_id = c.id
       WHERE c.ticker = ? ORDER BY e.report_date DESC`, [req.params.ticker.toUpperCase()]
    ));
  });

  // Scorecard
  app.get('/api/scorecard', (req, res) => {
    const quarter = (req.query.quarter as string) || 'Q1 2026';
    const all = queryAll(
      `SELECT e.*, c.sector, c.region FROM earnings_reports e
       JOIN companies c ON e.company_id = c.id WHERE e.fiscal_quarter = ?`, [quarter]
    );
    const reported = all.filter((e: any) => e.status === 'reported');
    let epsBeat = 0, epsMiss = 0, epsMeet = 0, revBeat = 0, revMiss = 0, revMeet = 0;
    let epsSum = 0, revSum = 0, rxnSum = 0, epsN = 0, revN = 0, rxnN = 0, gUp = 0, gDown = 0;
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
    }
    const sectorMap = new Map<string, any[]>();
    for (const e of all) { const l = sectorMap.get(e.sector) || []; l.push(e); sectorMap.set(e.sector, l); }
    const bySector = Array.from(sectorMap.entries()).map(([sector, entries]) => {
      const sr = entries.filter((e: any) => e.status === 'reported');
      const sEB = sr.filter((e: any) => e.eps_surprise_pct != null && e.eps_surprise_pct > 0.5).length;
      const sRB = sr.filter((e: any) => e.revenue_surprise_pct != null && e.revenue_surprise_pct > 0.5).length;
      return {
        sector, totalCompanies: entries.length, reportedCompanies: sr.length,
        pctBeatingEps: sr.length ? (sEB / sr.length) * 100 : 0,
        pctBeatingRev: sr.length ? (sRB / sr.length) * 100 : 0,
        avgEpsSurprisePct: sr.length ? sr.reduce((a: number, e: any) => a + (e.eps_surprise_pct || 0), 0) / sr.length : 0,
        avgStockReaction: sr.length ? sr.reduce((a: number, e: any) => a + (e.stock_reaction_pct || 0), 0) / sr.length : 0,
      };
    }).sort((a, b) => a.sector.localeCompare(b.sector));
    const regionMap = new Map<string, any[]>();
    for (const e of all) { const l = regionMap.get(e.region) || []; l.push(e); regionMap.set(e.region, l); }
    const byRegion = Array.from(regionMap.entries()).map(([region, entries]) => {
      const rr = entries.filter((e: any) => e.status === 'reported');
      return {
        region, totalCompanies: entries.length, reportedCompanies: rr.length,
        pctBeatingEps: rr.length ? (rr.filter((e: any) => e.eps_surprise_pct != null && e.eps_surprise_pct > 0.5).length / rr.length) * 100 : 0,
        pctBeatingRev: rr.length ? (rr.filter((e: any) => e.revenue_surprise_pct != null && e.revenue_surprise_pct > 0.5).length / rr.length) * 100 : 0,
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
      guidanceRaisedCount: gUp, guidanceLoweredCount: gDown, bySector, byRegion,
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
      `SELECT e.*, c.ticker, c.name FROM earnings_reports e
       JOIN companies c ON e.company_id = c.id
       WHERE c.sector = ? AND e.fiscal_quarter = ? ORDER BY e.report_date`, [req.params.sector, quarter]
    );
    res.json({ score, earnings });
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

  // AI (returns error in serverless — requires ANTHROPIC_API_KEY)
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
