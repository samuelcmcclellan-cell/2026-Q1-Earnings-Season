import { getDb } from '../db/connection.ts';
import type { EarningsWithCompany } from './earnings.model.ts';

export async function getCalendarEntries(from: string, to: string): Promise<EarningsWithCompany[]> {
  const db = await getDb();
  const stmt = db.prepare(
    `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.industry, c.market_cap_category
     FROM earnings_reports e
     JOIN companies c ON e.company_id = c.id
     WHERE e.report_date >= ? AND e.report_date <= ?
     ORDER BY e.report_date ASC, e.time_of_day ASC, c.ticker ASC`
  );
  stmt.bind([from, to]);

  const results: EarningsWithCompany[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as EarningsWithCompany);
  }
  stmt.free();
  return results;
}

export async function getUpcomingEarnings(days = 7): Promise<EarningsWithCompany[]> {
  const db = await getDb();
  const stmt = db.prepare(
    `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.industry, c.market_cap_category
     FROM earnings_reports e
     JOIN companies c ON e.company_id = c.id
     WHERE e.status = 'upcoming' AND e.report_date >= date('now') AND e.report_date <= date('now', '+' || ? || ' days')
     ORDER BY e.report_date ASC, e.time_of_day ASC`
  );
  stmt.bind([days]);

  const results: EarningsWithCompany[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as EarningsWithCompany);
  }
  stmt.free();
  return results;
}
