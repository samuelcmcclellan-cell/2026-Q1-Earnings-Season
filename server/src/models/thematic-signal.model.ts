import { getDb, saveDb } from '../db/connection.ts';

export interface ThematicSignal {
  id: number;
  company_id: number;
  fiscal_quarter: string;
  theme: string;
  signal_direction: string;
  detail: string | null;
}

export interface ThematicSignalWithCompany extends ThematicSignal {
  ticker: string;
  name: string;
  sector: string;
}

export async function getThematicSignals(filters?: {
  quarter?: string;
  theme?: string;
}): Promise<ThematicSignalWithCompany[]> {
  const db = await getDb();
  let sql = `SELECT ts.*, c.ticker, c.name, c.sector
             FROM thematic_signals ts
             JOIN companies c ON ts.company_id = c.id`;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.quarter) {
    conditions.push('ts.fiscal_quarter = ?');
    params.push(filters.quarter);
  }
  if (filters?.theme) {
    conditions.push('ts.theme = ?');
    params.push(filters.theme);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY ts.theme, c.ticker';

  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  const results: ThematicSignalWithCompany[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as ThematicSignalWithCompany);
  }
  stmt.free();
  return results;
}

export async function upsertThematicSignal(data: Omit<ThematicSignal, 'id'>): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT INTO thematic_signals (company_id, fiscal_quarter, theme, signal_direction, detail)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(company_id, fiscal_quarter, theme) DO UPDATE SET
       signal_direction = excluded.signal_direction,
       detail = excluded.detail`,
    [data.company_id, data.fiscal_quarter, data.theme, data.signal_direction, data.detail]
  );
}

export async function bulkUpsertThematicSignals(signals: Omit<ThematicSignal, 'id'>[]): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare(
    `INSERT INTO thematic_signals (company_id, fiscal_quarter, theme, signal_direction, detail)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(company_id, fiscal_quarter, theme) DO UPDATE SET
       signal_direction = excluded.signal_direction,
       detail = excluded.detail`
  );
  for (const s of signals) {
    stmt.run([s.company_id, s.fiscal_quarter, s.theme, s.signal_direction, s.detail]);
  }
  stmt.free();
  saveDb();
}
