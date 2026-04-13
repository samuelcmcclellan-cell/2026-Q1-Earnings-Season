import { runMigrations } from '../db/migrate.ts';
import { getDb, saveDb, closeDb } from '../db/connection.ts';
import { SeedAdapter } from '../services/seed.adapter.ts';

async function seedDatabase() {
  console.log('Running migrations...');
  await runMigrations();

  const db = await getDb();
  const adapter = new SeedAdapter();

  // Clear existing data
  db.run('DELETE FROM thematic_signals');
  db.run('DELETE FROM commentary');
  db.run('DELETE FROM sector_scores');
  db.run('DELETE FROM earnings_reports');
  db.run('DELETE FROM companies');

  // Seed companies
  const companies = adapter.getCompanies();
  console.log(`Seeding ${companies.length} companies...`);

  const insertCompany = db.prepare(
    `INSERT INTO companies (ticker, name, sector, industry, region, country, market_cap_category, index_membership)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const c of companies) {
    insertCompany.run([c.ticker, c.name, c.sector, c.industry, c.region, c.country, c.market_cap_category, c.index_membership]);
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
    `INSERT INTO earnings_reports (company_id, fiscal_quarter, report_date, time_of_day, eps_estimate, eps_actual, revenue_estimate, revenue_actual, eps_surprise_pct, revenue_surprise_pct, guidance_direction, stock_reaction_pct, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
           AVG(e.revenue_surprise_pct) as avg_revenue_growth
    FROM companies c
    JOIN earnings_reports e ON c.id = e.company_id
    WHERE e.fiscal_quarter = 'Q1 2026'
    GROUP BY c.sector
  `);

  const insertSector = db.prepare(
    `INSERT INTO sector_scores (sector, fiscal_quarter, total_companies, reported_companies, pct_beating_eps, pct_beating_revenue, avg_eps_growth, avg_revenue_growth)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
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
