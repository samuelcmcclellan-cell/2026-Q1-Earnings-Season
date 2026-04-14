import { getDb, saveDb } from '../db/connection.ts';

export interface Company {
  id: number;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  region: string;
  country: string;
  market_cap_category: string;
  style: string;
  index_membership: string | null;
}

export async function getAllCompanies(filters?: { sector?: string; region?: string; style?: string; market_cap_category?: string }): Promise<Company[]> {
  const db = await getDb();
  let sql = 'SELECT * FROM companies';
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.sector) {
    conditions.push('sector = ?');
    params.push(filters.sector);
  }
  if (filters?.region) {
    conditions.push('region = ?');
    params.push(filters.region);
  }
  if (filters?.style) {
    conditions.push('style = ?');
    params.push(filters.style);
  }
  if (filters?.market_cap_category) {
    conditions.push('market_cap_category = ?');
    params.push(filters.market_cap_category);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY ticker';

  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  const results: Company[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as Company);
  }
  stmt.free();
  return results;
}

export async function getCompanyByTicker(ticker: string): Promise<Company | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM companies WHERE ticker = ?');
  stmt.bind([ticker]);
  const result = stmt.step() ? (stmt.getAsObject() as unknown as Company) : null;
  stmt.free();
  return result;
}

export async function getCompanyById(id: number): Promise<Company | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
  stmt.bind([id]);
  const result = stmt.step() ? (stmt.getAsObject() as unknown as Company) : null;
  stmt.free();
  return result;
}

export async function upsertCompany(data: Omit<Company, 'id'>): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT INTO companies (ticker, name, sector, industry, region, country, market_cap_category, style, index_membership)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(ticker) DO UPDATE SET
       name = excluded.name,
       sector = excluded.sector,
       industry = excluded.industry,
       region = excluded.region,
       country = excluded.country,
       market_cap_category = excluded.market_cap_category,
       style = excluded.style,
       index_membership = excluded.index_membership,
       updated_at = datetime('now')`,
    [data.ticker, data.name, data.sector, data.industry, data.region, data.country, data.market_cap_category, data.style || 'blend', data.index_membership]
  );
}

export async function bulkUpsertCompanies(companies: Omit<Company, 'id'>[]): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare(
    `INSERT INTO companies (ticker, name, sector, industry, region, country, market_cap_category, style, index_membership)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(ticker) DO UPDATE SET
       name = excluded.name,
       sector = excluded.sector,
       industry = excluded.industry,
       region = excluded.region,
       country = excluded.country,
       market_cap_category = excluded.market_cap_category,
       style = excluded.style,
       index_membership = excluded.index_membership,
       updated_at = datetime('now')`
  );

  for (const c of companies) {
    stmt.run([c.ticker, c.name, c.sector, c.industry, c.region, c.country, c.market_cap_category, c.style || 'blend', c.index_membership]);
  }
  stmt.free();
  saveDb();
}
