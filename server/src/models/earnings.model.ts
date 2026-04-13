import { getDb, saveDb } from '../db/connection.ts';

export interface EarningsReport {
  id: number;
  company_id: number;
  fiscal_quarter: string;
  report_date: string | null;
  time_of_day: string;
  eps_estimate: number | null;
  eps_actual: number | null;
  revenue_estimate: number | null;
  revenue_actual: number | null;
  eps_surprise_pct: number | null;
  revenue_surprise_pct: number | null;
  guidance_direction: string | null;
  stock_reaction_pct: number | null;
  status: string;
}

export interface EarningsWithCompany extends EarningsReport {
  ticker: string;
  name: string;
  sector: string;
  region: string;
  industry: string;
  market_cap_category: string;
}

export async function getEarnings(filters?: {
  status?: string;
  sector?: string;
  region?: string;
  quarter?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
}): Promise<EarningsWithCompany[]> {
  const db = await getDb();
  let sql = `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.industry, c.market_cap_category
             FROM earnings_reports e
             JOIN companies c ON e.company_id = c.id`;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.status) {
    conditions.push('e.status = ?');
    params.push(filters.status);
  }
  if (filters?.sector) {
    conditions.push('c.sector = ?');
    params.push(filters.sector);
  }
  if (filters?.region) {
    conditions.push('c.region = ?');
    params.push(filters.region);
  }
  if (filters?.quarter) {
    conditions.push('e.fiscal_quarter = ?');
    params.push(filters.quarter);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  const sortCol = filters?.sort || 'report_date';
  const sortOrder = filters?.order === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY e.${sortCol} ${sortOrder}`;

  if (filters?.limit) {
    sql += ` LIMIT ${filters.limit}`;
    if (filters?.offset) {
      sql += ` OFFSET ${filters.offset}`;
    }
  }

  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  const results: EarningsWithCompany[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as EarningsWithCompany);
  }
  stmt.free();
  return results;
}

export async function getEarningsByTicker(ticker: string): Promise<EarningsWithCompany[]> {
  const db = await getDb();
  const stmt = db.prepare(
    `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.industry, c.market_cap_category
     FROM earnings_reports e
     JOIN companies c ON e.company_id = c.id
     WHERE c.ticker = ?
     ORDER BY e.report_date DESC`
  );
  stmt.bind([ticker]);

  const results: EarningsWithCompany[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as EarningsWithCompany);
  }
  stmt.free();
  return results;
}

export async function getRecentEarnings(limit = 10): Promise<EarningsWithCompany[]> {
  return getEarnings({ status: 'reported', limit, sort: 'report_date', order: 'desc' });
}

export async function upsertEarningsReport(companyId: number, data: Partial<EarningsReport>): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT INTO earnings_reports (company_id, fiscal_quarter, report_date, time_of_day, eps_estimate, eps_actual, revenue_estimate, revenue_actual, eps_surprise_pct, revenue_surprise_pct, guidance_direction, stock_reaction_pct, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(company_id, fiscal_quarter) DO UPDATE SET
       report_date = COALESCE(excluded.report_date, earnings_reports.report_date),
       time_of_day = COALESCE(excluded.time_of_day, earnings_reports.time_of_day),
       eps_estimate = COALESCE(excluded.eps_estimate, earnings_reports.eps_estimate),
       eps_actual = COALESCE(excluded.eps_actual, earnings_reports.eps_actual),
       revenue_estimate = COALESCE(excluded.revenue_estimate, earnings_reports.revenue_estimate),
       revenue_actual = COALESCE(excluded.revenue_actual, earnings_reports.revenue_actual),
       eps_surprise_pct = COALESCE(excluded.eps_surprise_pct, earnings_reports.eps_surprise_pct),
       revenue_surprise_pct = COALESCE(excluded.revenue_surprise_pct, earnings_reports.revenue_surprise_pct),
       guidance_direction = COALESCE(excluded.guidance_direction, earnings_reports.guidance_direction),
       stock_reaction_pct = COALESCE(excluded.stock_reaction_pct, earnings_reports.stock_reaction_pct),
       status = COALESCE(excluded.status, earnings_reports.status),
       updated_at = datetime('now')`,
    [
      companyId,
      data.fiscal_quarter || 'Q1 2026',
      data.report_date || null,
      data.time_of_day || 'bmo',
      data.eps_estimate ?? null,
      data.eps_actual ?? null,
      data.revenue_estimate ?? null,
      data.revenue_actual ?? null,
      data.eps_surprise_pct ?? null,
      data.revenue_surprise_pct ?? null,
      data.guidance_direction || null,
      data.stock_reaction_pct ?? null,
      data.status || 'upcoming',
    ]
  );
}
