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
  eps_actual_prior_year: number | null;
  revenue_actual_prior_year: number | null;
  eps_actual_prior_quarter: number | null;
  revenue_actual_prior_quarter: number | null;
  eps_growth_yoy: number | null;
  revenue_growth_yoy: number | null;
  eps_growth_qoq: number | null;
  revenue_growth_qoq: number | null;
  gross_margin: number | null;
  operating_margin: number | null;
  gross_margin_prior: number | null;
  operating_margin_prior: number | null;
  forward_eps_current: number | null;
  forward_eps_30d_ago: number | null;
  forward_revenue_current: number | null;
  forward_revenue_30d_ago: number | null;
  data_source: string;
}

export interface EarningsWithCompany extends EarningsReport {
  ticker: string;
  name: string;
  sector: string;
  region: string;
  country: string;
  industry: string;
  market_cap_category: string;
  style: string;
}

export async function getEarnings(filters?: {
  status?: string;
  sector?: string;
  region?: string;
  quarter?: string;
  style?: string;
  market_cap_category?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
}): Promise<EarningsWithCompany[]> {
  const db = await getDb();
  let sql = `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.country, c.industry, c.market_cap_category, c.style
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
  if (filters?.style) {
    conditions.push('c.style = ?');
    params.push(filters.style);
  }
  if (filters?.market_cap_category) {
    conditions.push('c.market_cap_category = ?');
    params.push(filters.market_cap_category);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  const allowedSorts = new Set(['report_date', 'ticker', 'sector', 'eps_surprise_pct', 'revenue_surprise_pct', 'stock_reaction_pct', 'eps_growth_yoy', 'revenue_growth_yoy', 'gross_margin', 'operating_margin']);
  const sortCol = allowedSorts.has(filters?.sort || '') ? filters!.sort : 'report_date';
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
    `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.country, c.industry, c.market_cap_category, c.style
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
    `INSERT INTO earnings_reports (company_id, fiscal_quarter, report_date, time_of_day,
       eps_estimate, eps_actual, revenue_estimate, revenue_actual,
       eps_surprise_pct, revenue_surprise_pct, guidance_direction, stock_reaction_pct, status,
       eps_actual_prior_year, revenue_actual_prior_year, eps_actual_prior_quarter, revenue_actual_prior_quarter,
       eps_growth_yoy, revenue_growth_yoy, eps_growth_qoq, revenue_growth_qoq,
       gross_margin, operating_margin, gross_margin_prior, operating_margin_prior,
       forward_eps_current, forward_eps_30d_ago, forward_revenue_current, forward_revenue_30d_ago,
       data_source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(company_id, fiscal_quarter) DO UPDATE SET
       report_date = COALESCE(excluded.report_date, earnings_reports.report_date),
       eps_estimate = COALESCE(excluded.eps_estimate, earnings_reports.eps_estimate),
       eps_actual = COALESCE(excluded.eps_actual, earnings_reports.eps_actual),
       revenue_estimate = COALESCE(excluded.revenue_estimate, earnings_reports.revenue_estimate),
       revenue_actual = COALESCE(excluded.revenue_actual, earnings_reports.revenue_actual),
       eps_surprise_pct = COALESCE(excluded.eps_surprise_pct, earnings_reports.eps_surprise_pct),
       revenue_surprise_pct = COALESCE(excluded.revenue_surprise_pct, earnings_reports.revenue_surprise_pct),
       guidance_direction = COALESCE(excluded.guidance_direction, earnings_reports.guidance_direction),
       stock_reaction_pct = COALESCE(excluded.stock_reaction_pct, earnings_reports.stock_reaction_pct),
       status = COALESCE(excluded.status, earnings_reports.status),
       eps_growth_yoy = COALESCE(excluded.eps_growth_yoy, earnings_reports.eps_growth_yoy),
       revenue_growth_yoy = COALESCE(excluded.revenue_growth_yoy, earnings_reports.revenue_growth_yoy),
       gross_margin = COALESCE(excluded.gross_margin, earnings_reports.gross_margin),
       operating_margin = COALESCE(excluded.operating_margin, earnings_reports.operating_margin),
       data_source = COALESCE(excluded.data_source, earnings_reports.data_source),
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
      data.eps_actual_prior_year ?? null,
      data.revenue_actual_prior_year ?? null,
      data.eps_actual_prior_quarter ?? null,
      data.revenue_actual_prior_quarter ?? null,
      data.eps_growth_yoy ?? null,
      data.revenue_growth_yoy ?? null,
      data.eps_growth_qoq ?? null,
      data.revenue_growth_qoq ?? null,
      data.gross_margin ?? null,
      data.operating_margin ?? null,
      data.gross_margin_prior ?? null,
      data.operating_margin_prior ?? null,
      data.forward_eps_current ?? null,
      data.forward_eps_30d_ago ?? null,
      data.forward_revenue_current ?? null,
      data.forward_revenue_30d_ago ?? null,
      data.data_source || 'seed',
    ]
  );
}
