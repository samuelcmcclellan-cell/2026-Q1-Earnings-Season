import { runMigrations } from '../db/migrate.ts';
import { getDb, saveDb, closeDb } from '../db/connection.ts';
import { SeedAdapter } from '../services/seed.adapter.ts';

async function seedDatabase() {
  console.log('Running migrations...');
  await runMigrations();

  const db = await getDb();
  const adapter = new SeedAdapter();

  // Clear existing data
  db.run('DELETE FROM estimate_revisions');
  db.run('DELETE FROM thematic_signals');
  db.run('DELETE FROM commentary');
  db.run('DELETE FROM sector_scores');
  db.run('DELETE FROM earnings_reports');
  db.run('DELETE FROM companies');

  // Seed companies
  const companies = adapter.getCompanies();
  console.log(`Seeding ${companies.length} companies...`);

  const insertCompany = db.prepare(
    `INSERT INTO companies (ticker, name, sector, industry, region, country, market_cap_category, style, index_membership)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const c of companies) {
    insertCompany.run([c.ticker, c.name, c.sector, c.industry, c.region, c.country, c.market_cap_category, c.style || 'blend', c.index_membership]);
  }
  insertCompany.free();

  // Build ticker -> id map
  const tickerMap = new Map<string, number>();
  const rows = db.prepare('SELECT id, ticker FROM companies');
  while (rows.step()) {
    const row = rows.getAsObject() as { id: number; ticker: string };
    tickerMap.set(row.ticker, row.id);
  }
  rows.free();

  // Seed earnings
  const earnings = adapter.getEarnings();
  console.log(`Seeding ${earnings.length} earnings records...`);

  const insertEarnings = db.prepare(
    `INSERT INTO earnings_reports (company_id, fiscal_quarter, report_date, time_of_day,
       eps_estimate, eps_actual, revenue_estimate, revenue_actual,
       eps_surprise_pct, revenue_surprise_pct, guidance_direction, stock_reaction_pct, status,
       eps_actual_prior_year, revenue_actual_prior_year, eps_actual_prior_quarter, revenue_actual_prior_quarter,
       eps_growth_yoy, revenue_growth_yoy, eps_growth_qoq, revenue_growth_qoq,
       gross_margin, operating_margin, gross_margin_prior, operating_margin_prior,
       forward_eps_current, forward_eps_30d_ago, forward_revenue_current, forward_revenue_30d_ago,
       data_source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const e of earnings) {
    const companyId = tickerMap.get(e.ticker);
    if (!companyId) {
      console.warn(`No company found for ticker: ${e.ticker}`);
      continue;
    }
    insertEarnings.run([
      companyId,
      'Q1 2026',
      e.report_date,
      e.time_of_day,
      e.eps_estimate ?? null,
      e.eps_actual ?? null,
      e.revenue_estimate ?? null,
      e.revenue_actual ?? null,
      e.eps_surprise_pct ?? null,
      e.revenue_surprise_pct ?? null,
      e.guidance_direction ?? null,
      e.stock_reaction_pct ?? null,
      e.status,
      e.eps_actual_prior_year ?? null,
      e.revenue_actual_prior_year ?? null,
      e.eps_actual_prior_quarter ?? null,
      e.revenue_actual_prior_quarter ?? null,
      e.eps_growth_yoy ?? null,
      e.revenue_growth_yoy ?? null,
      e.eps_growth_qoq ?? null,
      e.revenue_growth_qoq ?? null,
      e.gross_margin ?? null,
      e.operating_margin ?? null,
      e.gross_margin_prior ?? null,
      e.operating_margin_prior ?? null,
      e.forward_eps_current ?? null,
      e.forward_eps_30d_ago ?? null,
      e.forward_revenue_current ?? null,
      e.forward_revenue_30d_ago ?? null,
      e.data_source ?? 'seed',
    ]);
  }
  insertEarnings.free();

  // Seed commentary
  const commentary = adapter.getCommentary();
  console.log(`Seeding ${commentary.length} commentary records...`);

  const insertCommentary = db.prepare(
    `INSERT INTO commentary (company_id, fiscal_quarter, quote_text, theme_tags, sentiment, source)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (const cm of commentary) {
    const companyId = tickerMap.get(cm.ticker);
    if (!companyId) {
      console.warn(`No company found for commentary ticker: ${cm.ticker}`);
      continue;
    }
    insertCommentary.run([
      companyId,
      cm.fiscal_quarter,
      cm.quote_text,
      cm.theme_tags,
      cm.sentiment,
      cm.source,
    ]);
  }
  insertCommentary.free();

  // Compute and seed sector scores
  console.log('Computing sector scores...');
  const sectorData = db.prepare(`
    SELECT c.sector,
           COUNT(*) as total_companies,
           SUM(CASE WHEN e.status = 'reported' THEN 1 ELSE 0 END) as reported_companies,
           AVG(CASE WHEN e.eps_surprise_pct IS NOT NULL AND e.eps_surprise_pct > 0.5 THEN 1.0
                     WHEN e.eps_surprise_pct IS NOT NULL AND e.eps_surprise_pct < -0.5 THEN 0.0
                     ELSE NULL END) * 100 as pct_beating_eps,
           AVG(CASE WHEN e.revenue_surprise_pct IS NOT NULL AND e.revenue_surprise_pct > 0.5 THEN 1.0
                     WHEN e.revenue_surprise_pct IS NOT NULL AND e.revenue_surprise_pct < -0.5 THEN 0.0
                     ELSE NULL END) * 100 as pct_beating_revenue,
           AVG(e.eps_surprise_pct) as avg_eps_growth,
           AVG(e.revenue_surprise_pct) as avg_revenue_growth,
           AVG(CASE WHEN e.status = 'reported' THEN e.gross_margin ELSE NULL END) as avg_gross_margin,
           AVG(CASE WHEN e.status = 'reported' THEN e.operating_margin ELSE NULL END) as avg_operating_margin,
           AVG(CASE WHEN e.status = 'reported' THEN e.gross_margin_prior ELSE NULL END) as avg_gross_margin_prior,
           AVG(CASE WHEN e.status = 'reported' THEN e.operating_margin_prior ELSE NULL END) as avg_operating_margin_prior,
           AVG(CASE WHEN e.guidance_direction = 'raised' AND e.status = 'reported' THEN 1.0 ELSE 0.0 END) * 100 as pct_guidance_raised,
           AVG(CASE WHEN e.guidance_direction = 'lowered' AND e.status = 'reported' THEN 1.0 ELSE 0.0 END) * 100 as pct_guidance_lowered,
           AVG(CASE WHEN e.guidance_direction = 'maintained' AND e.status = 'reported' THEN 1.0 ELSE 0.0 END) * 100 as pct_guidance_maintained,
           AVG(CASE WHEN e.status = 'reported' THEN e.stock_reaction_pct ELSE NULL END) as avg_stock_reaction,
           AVG(CASE WHEN e.status = 'reported' THEN e.eps_growth_yoy ELSE NULL END) as avg_eps_growth_yoy,
           AVG(CASE WHEN e.status = 'reported' THEN e.revenue_growth_yoy ELSE NULL END) as avg_revenue_growth_yoy,
           AVG(CASE WHEN e.forward_eps_current IS NOT NULL AND e.forward_eps_30d_ago IS NOT NULL AND e.forward_eps_30d_ago != 0
                     THEN ((e.forward_eps_current - e.forward_eps_30d_ago) / ABS(e.forward_eps_30d_ago)) * 100
                     ELSE NULL END) as forward_eps_revision_pct
    FROM companies c
    JOIN earnings_reports e ON c.id = e.company_id
    WHERE e.fiscal_quarter = 'Q1 2026'
    GROUP BY c.sector
  `);

  const insertSector = db.prepare(
    `INSERT INTO sector_scores (sector, fiscal_quarter, total_companies, reported_companies,
       pct_beating_eps, pct_beating_revenue, avg_eps_growth, avg_revenue_growth,
       avg_gross_margin, avg_operating_margin, avg_gross_margin_prior, avg_operating_margin_prior,
       pct_guidance_raised, pct_guidance_lowered, pct_guidance_maintained,
       avg_stock_reaction, avg_eps_growth_yoy, avg_revenue_growth_yoy, forward_eps_revision_pct)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  while (sectorData.step()) {
    const row = sectorData.getAsObject() as any;
    insertSector.run([
      row.sector,
      'Q1 2026',
      row.total_companies,
      row.reported_companies,
      row.pct_beating_eps,
      row.pct_beating_revenue,
      row.avg_eps_growth,
      row.avg_revenue_growth,
      row.avg_gross_margin,
      row.avg_operating_margin,
      row.avg_gross_margin_prior,
      row.avg_operating_margin_prior,
      row.pct_guidance_raised,
      row.pct_guidance_lowered,
      row.pct_guidance_maintained,
      row.avg_stock_reaction,
      row.avg_eps_growth_yoy,
      row.avg_revenue_growth_yoy,
      row.forward_eps_revision_pct,
    ]);
  }
  sectorData.free();
  insertSector.free();

  saveDb();
  console.log('Database seeded successfully!');

  // Print summary
  const summary = db.prepare('SELECT COUNT(*) as count FROM companies');
  summary.step();
  const companyCount = (summary.getAsObject() as any).count;
  summary.free();

  const earningsSummary = db.prepare("SELECT COUNT(*) as count FROM earnings_reports WHERE status = 'reported'");
  earningsSummary.step();
  const reportedCount = (earningsSummary.getAsObject() as any).count;
  earningsSummary.free();

  const commentarySummary = db.prepare('SELECT COUNT(*) as count FROM commentary');
  commentarySummary.step();
  const commentaryCount = (commentarySummary.getAsObject() as any).count;
  commentarySummary.free();

  console.log(`\nSummary:`);
  console.log(`  Companies: ${companyCount}`);
  console.log(`  Earnings (reported): ${reportedCount}`);
  console.log(`  Commentary: ${commentaryCount}`);

  closeDb();
}

seedDatabase().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
