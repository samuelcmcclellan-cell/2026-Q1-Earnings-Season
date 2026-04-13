export interface CalendarEntry {
  ticker: string;
  name?: string;
  date: string;
  time_of_day: string;
  eps_estimate: number | null;
  eps_actual: number | null;
  revenue_estimate: number | null;
  revenue_actual: number | null;
  status: string;
}

export interface CompanyProfile {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  country: string;
  region: string;
  market_cap_category: string;
  index_membership: string | null;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
}

export interface DataSourceAdapter {
  getEarningsCalendar(from: string, to: string): Promise<CalendarEntry[]>;
  getCompanyProfile(ticker: string): Promise<CompanyProfile | null>;
  getQuote(ticker: string): Promise<StockQuote | null>;
}
