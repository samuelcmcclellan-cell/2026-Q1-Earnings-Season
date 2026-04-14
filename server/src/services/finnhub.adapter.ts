import type { DataSourceAdapter, CalendarEntry, CompanyProfile, StockQuote } from './data-source.interface.ts';
import { getMarketDataService } from './market-data.service.ts';

export class FinnhubAdapter implements DataSourceAdapter {
  async getEarningsCalendar(from: string, to: string): Promise<CalendarEntry[]> {
    const svc = getMarketDataService();
    const entries = await svc.getEarningsCalendar(from, to);
    return entries.map(e => ({
      ticker: e.symbol,
      date: e.date,
      time_of_day: e.hour === 'amc' ? 'amc' : 'bmo',
      eps_estimate: e.epsEstimate,
      eps_actual: e.epsActual,
      revenue_estimate: e.revenueEstimate,
      revenue_actual: e.revenueActual,
      status: e.epsActual !== null ? 'reported' : 'upcoming',
    }));
  }

  async getCompanyProfile(ticker: string): Promise<CompanyProfile | null> {
    const svc = getMarketDataService();
    const profile = await svc.getCompanyProfile(ticker);
    if (!profile) return null;
    return {
      ticker: profile.ticker || ticker,
      name: profile.name || '',
      sector: profile.finnhubIndustry || '',
      industry: profile.finnhubIndustry || '',
      country: profile.country || '',
      region: mapCountryToRegion(profile.country),
      market_cap_category: classifyMarketCap(profile.marketCapitalization),
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

function mapCountryToRegion(country: string | undefined): string {
  if (!country) return 'us';
  const c = country.toUpperCase();
  if (c === 'US' || c === 'UNITED STATES') return 'us';
  const european = ['GB', 'UK', 'DE', 'FR', 'CH', 'NL', 'IE', 'IT', 'ES', 'SE', 'NO', 'DK', 'FI'];
  if (european.includes(c)) return 'europe';
  return 'asia';
}

function classifyMarketCap(mcap: number | undefined): string {
  if (!mcap) return 'large';
  const b = mcap / 1000; // Finnhub returns in millions
  if (b >= 200) return 'mega';
  if (b >= 10) return 'large';
  return 'mid';
}
