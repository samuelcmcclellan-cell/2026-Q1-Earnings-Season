import { getDb, saveDb } from '../db/connection.ts';

export interface Commentary {
  id: number;
  company_id: number;
  fiscal_quarter: string;
  quote_text: string;
  theme_tags: string;
  sentiment: string;
  source: string | null;
}

export interface CommentaryWithCompany extends Commentary {
  ticker: string;
  name: string;
  sector: string;
}

export async function getCommentary(filters?: {
  quarter?: string;
  theme?: string;
  sentiment?: string;
  sector?: string;
  region?: string;
  limit?: number;
}): Promise<CommentaryWithCompany[]> {
  const db = await getDb();
  let sql = `SELECT cm.*, c.ticker, c.name, c.sector
             FROM commentary cm
             JOIN companies c ON cm.company_id = c.id`;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.quarter) {
    conditions.push('cm.fiscal_quarter = ?');
    params.push(filters.quarter);
  }
  if (filters?.theme) {
    conditions.push("cm.theme_tags LIKE '%' || ? || '%'");
    params.push(filters.theme);
  }
  if (filters?.sentiment) {
    conditions.push('cm.sentiment = ?');
    params.push(filters.sentiment);
  }
  if (filters?.sector) {
    conditions.push('c.sector = ?');
    params.push(filters.sector);
  }
  if (filters?.region) {
    conditions.push('c.region = ?');
    params.push(filters.region);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY cm.created_at DESC';
  if (filters?.limit) {
    sql += ` LIMIT ${filters.limit}`;
  }

  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  const results: CommentaryWithCompany[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as CommentaryWithCompany);
  }
  stmt.free();
  return results;
}

export async function insertCommentary(data: Omit<Commentary, 'id'>): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT INTO commentary (company_id, fiscal_quarter, quote_text, theme_tags, sentiment, source)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.company_id, data.fiscal_quarter, data.quote_text, data.theme_tags, data.sentiment, data.source]
  );
}

export async function bulkInsertCommentary(items: Omit<Commentary, 'id'>[]): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare(
    `INSERT INTO commentary (company_id, fiscal_quarter, quote_text, theme_tags, sentiment, source)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (const item of items) {
    stmt.run([item.company_id, item.fiscal_quarter, item.quote_text, item.theme_tags, item.sentiment, item.source]);
  }
  stmt.free();
  saveDb();
}
