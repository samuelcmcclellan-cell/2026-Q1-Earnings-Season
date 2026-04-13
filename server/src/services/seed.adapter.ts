import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.ts';
import type { DataSourceAdapter, CalendarEntry, CompanyProfile, StockQuote } from './data-source.interface.ts';

interface SeedCompany {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  region: string;
  country: string;
  market_cap_category: string;
  index_membership: string | null;
}

interface SeedEarnings {
  ticker: string;
  report_date: string;
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

export class SeedAdapter implements DataSourceAdapter {
  private companies: SeedCompany[];
  private earnings: SeedEarnings[];

  constructor() {
    this.companies = this.loadJson('companies.json');
    this.earnings = this.loadJson('earnings-q1-2026.json');
  }

  private loadJson(filename: string): any {
    const filepath = path.join(config.seedDir, filename);
    if (!fs.existsSync(filepath)) {
      console.warn(`Seed file not found: ${filepath}`);
      return [];
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }

  async getEarningsCalendar(from: string, to: string): Promise<CalendarEntry[]> {
    return this.earnings
      .filter(e => e.report_date >= from && e.report_date <= to)
      .map(e => ({
        ticker: e.ticker,
        date: e.report_date,
        time_of_day: e.time_of_day,
        eps_estimate: e.eps_estimate,
        eps_actual: e.eps_actual,
        revenue_estimate: e.revenue_estimate,
        revenue_actual: e.revenue_actual,
        status: e.status,
      }));
  }

  async getCompanyProfile(ticker: string): Promise<CompanyProfile | null> {
    const c = this.companies.find(c => c.ticker === ticker);
    return c ? { ...c } : null;
  }

  async getQuote(_ticker: string): Promise<StockQuote | null> {
    return null; // Seed data doesn't have live quotes
  }

  getCompanies(): SeedCompany[] {
    return this.companies;
  }

  getEarnings(): SeedEarnings[] {
    return this.earnings;
  }

  getCommentary(): any[] {
    return this.loadJson('commentary-q1-2026.json');
  }
}
