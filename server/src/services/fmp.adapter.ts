import type { DataSourceAdapter, CalendarEntry, CompanyProfile, StockQuote } from './data-source.interface.ts';
import { getMarketDataService } from './market-data.service.ts';

export class FmpAdapter implements DataSourceAdapter {
  async getEarningsCalendar(from: string, to: string): Promise<CalendarEntry[]> {
    const svc = getMarketDataService();
    const entries = await svc.getEarningsCalendar(from, to);
    return entries.map(e => ({
      ticker: e.symbol,
      date: e.date,
      time_of_day: 'bmo',
      eps_estimate: e.epsEstimate,
      eps_actual: e.epsActual,
      revenue_estimate: e.revenueEstimate,
      revenue_actual: e.revenueActual,
      status: e.epsActual !== null ? 'reported' : 'upcoming',
    }));
  }

  async getCompanyProfile(ticker: string): Promise<CompanyProfile | null> {
    const svc = getMarketDataService();
    // FMP doesn't have profile on free tier via market-data service, try Finnhub fallback
    const profile = await svc.getCompanyProfile(ticker);
    if (!profile) return null;
    return {
      ticker: profile.ticker || ticker,
      name: profile.name || '',
      sector: profile.finnhubIndustry || '',
      industry: profile.finnhubIndustry || '',
      country: profile.country || '',
      region: 'us',
      market_cap_category: 'large',
      index_membership: null,
    };
  }

  async getQuote(ticker: string): Promise<StockQuote | null> {
    const svc = getMarketDataService();
    const quote = await svc.getQuote(ticker);
    if (!quote) return null;
    return {
      ticker: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePct: quote.changePercent,
    };
  }
}
