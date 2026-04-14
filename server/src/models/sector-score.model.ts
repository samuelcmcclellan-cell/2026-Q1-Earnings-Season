import { getDb, saveDb } from '../db/connection.ts';

export interface SectorScore {
  id: number;
  sector: string;
  fiscal_quarter: string;
  total_companies: number;
  reported_companies: number;
  pct_beating_eps: number | null;
  pct_beating_revenue: number | null;
  avg_eps_growth: number | null;
  avg_revenue_growth: number | null;
  avg_gross_margin: number | null;
  avg_operating_margin: number | null;
  avg_gross_margin_prior: number | null;
  avg_operating_margin_prior: number | null;
  pct_guidance_raised: number | null;
  pct_guidance_lowered: number | null;
  pct_guidance_maintained: number | null;
  avg_stock_reaction: number | null;
  avg_eps_growth_yoy: number | null;
  avg_revenue_growth_yoy: number | null;
  forward_eps_revision_pct: number | null;
}

export async function getSectorScores(quarter = 'Q1 2026'): Promise<SectorScore[]> {
  const db = await getDb();
  const stmt = db.prepare(
    'SELECT * FROM sector_scores WHERE fiscal_quarter = ? ORDER BY sector'
  );
  stmt.bind([quarter]);

  const results: SectorScore[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as SectorScore);
  }
  stmt.free();
  return results;
}

export async function upsertSectorScore(data: Omit<SectorScore, 'id'>): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT INTO sector_scores (sector, fiscal_quarter, total_companies, reported_companies,
       pct_beating_eps, pct_beating_revenue, avg_eps_growth, avg_revenue_growth,
       avg_gross_margin, avg_operating_margin, avg_gross_margin_prior, avg_operating_margin_prior,
       pct_guidance_raised, pct_guidance_lowered, pct_guidance_maintained,
       avg_stock_reaction, avg_eps_growth_yoy, avg_revenue_growth_yoy, forward_eps_revision_pct)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(sector, fiscal_quarter) DO UPDATE SET
       total_companies = excluded.total_companies,
       reported_companies = excluded.reported_companies,
       pct_beating_eps = excluded.pct_beating_eps,
       pct_beating_revenue = excluded.pct_beating_revenue,
       avg_eps_growth = excluded.avg_eps_growth,
       avg_revenue_growth = excluded.avg_revenue_growth,
       avg_gross_margin = excluded.avg_gross_margin,
       avg_operating_margin = excluded.avg_operating_margin,
       avg_gross_margin_prior = excluded.avg_gross_margin_prior,
       avg_operating_margin_prior = excluded.avg_operating_margin_prior,
       pct_guidance_raised = excluded.pct_guidance_raised,
       pct_guidance_lowered = excluded.pct_guidance_lowered,
       pct_guidance_maintained = excluded.pct_guidance_maintained,
       avg_stock_reaction = excluded.avg_stock_reaction,
       avg_eps_growth_yoy = excluded.avg_eps_growth_yoy,
       avg_revenue_growth_yoy = excluded.avg_revenue_growth_yoy,
       forward_eps_revision_pct = excluded.forward_eps_revision_pct,
       updated_at = datetime('now')`,
    [data.sector, data.fiscal_quarter, data.total_companies, data.reported_companies,
     data.pct_beating_eps, data.pct_beating_revenue, data.avg_eps_growth, data.avg_revenue_growth,
     data.avg_gross_margin, data.avg_operating_margin, data.avg_gross_margin_prior, data.avg_operating_margin_prior,
     data.pct_guidance_raised, data.pct_guidance_lowered, data.pct_guidance_maintained,
     data.avg_stock_reaction, data.avg_eps_growth_yoy, data.avg_revenue_growth_yoy, data.forward_eps_revision_pct]
  );
  saveDb();
}
