import { config } from '../config.ts';

// --- Rate Limiter (token bucket) ---

class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(private maxPerMinute: number) {
    this.tokens = maxPerMinute;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }
    // Wait until next token is available
    const waitMs = (60_000 / this.maxPerMinute) + 50;
    await new Promise(resolve => setTimeout(resolve, waitMs));
    this.refill();
    this.tokens = Math.max(0, this.tokens - 1);
  }

  get available(): number {
    this.refill();
    return this.tokens;
  }

  get isLimited(): boolean {
    this.refill();
    return this.tokens <= 0;
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = (elapsed / 60_000) * this.maxPerMinute;
    this.tokens = Math.min(this.maxPerMinute, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

// --- Cache with stale-data fallback ---

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  storedAt: number;
}

class APICache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) return null;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs, storedAt: Date.now() });
  }

  getStale<T>(key: string): T | null {
    const entry = this.store.get(key);
    return entry ? (entry.data as T) : null;
  }

  get size(): number {
    return this.store.size;
  }
}

// --- Response types ---

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
  source: 'finnhub' | 'fmp';
}

export interface MarketCalendarEntry {
  symbol: string;
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  revenueActual: number | null;
  revenueEstimate: number | null;
  hour: string | null;
}

export interface CompanyNews {
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
  image: string;
}

export interface BasicFinancials {
  grossMarginTTM: number | null;
  operatingMarginTTM: number | null;
  epsGrowthTTMYoy: number | null;
  revenueGrowthTTMYoy: number | null;
  [key: string]: number | null | undefined;
}

export interface AnalystRecommendation {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export interface PriceHistoryEntry {
  date: string;
  close: number;
}

// --- Fetch helper ---

async function fetchWithTimeout(url: string, headers: Record<string, string> = {}, timeoutMs = 5000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// --- MarketDataService ---

class MarketDataService {
  private cache = new APICache();
  private finnhubLimiter = new RateLimiter(60);
  private fmpLimiter = new RateLimiter(4); // ~250/day ≈ 4/min conservative
  private startTime = Date.now();

  private get finnhubKey(): string { return config.finnhubApiKey; }
  private get fmpKey(): string { return config.fmpApiKey; }

  constructor() {
    if (!this.finnhubKey && !this.fmpKey) {
      console.log('⚠ No market data API key configured. Live quotes, news, and price history will be unavailable. Set FINNHUB_API_KEY or FMP_API_KEY in .env.');
    }
  }

  // --- Finnhub methods ---

  private async finnhubFetch<T>(path: string, cacheKey: string, ttlMs: number): Promise<T | null> {
    if (!this.finnhubKey) return null;
    const cached = this.cache.get<T>(cacheKey);
    if (cached) return cached;

    try {
      await this.finnhubLimiter.acquire();
      const data = await fetchWithTimeout(
        `https://finnhub.io/api/v1${path}`,
        { 'X-Finnhub-Token': this.finnhubKey }
      );
      this.cache.set(cacheKey, data, ttlMs);
      return data as T;
    } catch {
      return this.cache.getStale<T>(cacheKey);
    }
  }

  private async fmpFetch<T>(path: string, cacheKey: string, ttlMs: number): Promise<T | null> {
    if (!this.fmpKey) return null;
    const cached = this.cache.get<T>(cacheKey);
    if (cached) return cached;

    try {
      await this.fmpLimiter.acquire();
      const sep = path.includes('?') ? '&' : '?';
      const data = await fetchWithTimeout(
        `https://financialmodelingprep.com/api/v3${path}${sep}apikey=${this.fmpKey}`
      );
      this.cache.set(cacheKey, data, ttlMs);
      return data as T;
    } catch {
      return this.cache.getStale<T>(cacheKey);
    }
  }

  // --- Public API ---

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    const sym = symbol.toUpperCase();

    // Try Finnhub first
    if (this.finnhubKey) {
      const data = await this.finnhubFetch<any>(`/quote?symbol=${sym}`, `fh:quote:${sym}`, 60_000);
      if (data && data.c > 0) {
        return {
          symbol: sym, price: data.c, change: data.d ?? 0, changePercent: data.dp ?? 0,
          high: data.h ?? 0, low: data.l ?? 0, open: data.o ?? 0, previousClose: data.pc ?? 0,
          timestamp: data.t ?? Math.floor(Date.now() / 1000), source: 'finnhub',
        };
      }
    }

    // Fallback to FMP
    if (this.fmpKey) {
      const data = await this.fmpFetch<any[]>(`/quote/${sym}`, `fmp:quote:${sym}`, 60_000);
      if (data && data.length > 0) {
        const q = data[0];
        return {
          symbol: sym, price: q.price ?? 0, change: q.change ?? 0, changePercent: q.changesPercentage ?? 0,
          high: q.dayHigh ?? 0, low: q.dayLow ?? 0, open: q.open ?? 0, previousClose: q.previousClose ?? 0,
          timestamp: q.timestamp ?? Math.floor(Date.now() / 1000), source: 'fmp',
        };
      }
    }

    return null;
  }

  async getQuotes(symbols: string[]): Promise<{ quotes: MarketQuote[]; errors: string[] }> {
    const results = await Promise.allSettled(symbols.map(s => this.getQuote(s)));
    const quotes: MarketQuote[] = [];
    const errors: string[] = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        quotes.push(r.value);
      } else {
        errors.push(symbols[i]);
      }
    });

    return { quotes, errors };
  }

  async getEarningsCalendar(from: string, to: string): Promise<MarketCalendarEntry[]> {
    if (this.finnhubKey) {
      const data = await this.finnhubFetch<any>(`/calendar/earnings?from=${from}&to=${to}`, `fh:cal:${from}:${to}`, 15 * 60_000);
      if (data?.earningsCalendar) {
        return data.earningsCalendar.map((e: any) => ({
          symbol: e.symbol, date: e.date, epsActual: e.epsActual ?? null,
          epsEstimate: e.epsEstimate ?? null, revenueActual: e.revenueActual ?? null,
          revenueEstimate: e.revenueEstimate ?? null, hour: e.hour ?? null,
        }));
      }
    }

    if (this.fmpKey) {
      const data = await this.fmpFetch<any[]>(`/earning_calendar?from=${from}&to=${to}`, `fmp:cal:${from}:${to}`, 15 * 60_000);
      if (data) {
        return data.map((e: any) => ({
          symbol: e.symbol, date: e.date, epsActual: e.eps ?? null,
          epsEstimate: e.epsEstimated ?? null, revenueActual: e.revenue ?? null,
          revenueEstimate: e.revenueEstimated ?? null, hour: null,
        }));
      }
    }

    return [];
  }

  async getCompanyNews(symbol: string, days = 7): Promise<CompanyNews[]> {
    if (!this.finnhubKey) return [];
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const data = await this.finnhubFetch<any[]>(
      `/company-news?symbol=${symbol.toUpperCase()}&from=${from}&to=${to}`,
      `fh:news:${symbol}`, 10 * 60_000
    );
    if (!data) return [];
    return data.slice(0, 10).map((n: any) => ({
      headline: n.headline, summary: n.summary, url: n.url,
      source: n.source, datetime: n.datetime, image: n.image,
    }));
  }

  async getBasicFinancials(symbol: string): Promise<BasicFinancials | null> {
    if (!this.finnhubKey) return null;
    const data = await this.finnhubFetch<any>(`/stock/metric?symbol=${symbol.toUpperCase()}&metric=all`, `fh:metrics:${symbol}`, 60 * 60_000);
    if (!data?.metric) return null;
    const m = data.metric;
    return {
      grossMarginTTM: m['grossMarginTTM'] ?? null,
      operatingMarginTTM: m['operatingMarginTTM'] ?? null,
      epsGrowthTTMYoy: m['epsGrowthTTMYoy'] ?? null,
      revenueGrowthTTMYoy: m['revenueGrowthTTMYoy'] ?? null,
    };
  }

  async getRecommendations(symbol: string): Promise<AnalystRecommendation | null> {
    if (!this.finnhubKey) return null;
    const data = await this.finnhubFetch<any[]>(`/stock/recommendation?symbol=${symbol.toUpperCase()}`, `fh:rec:${symbol}`, 60 * 60_000);
    if (!data || data.length === 0) return null;
    const latest = data[0];
    return {
      buy: latest.buy ?? 0, hold: latest.hold ?? 0, sell: latest.sell ?? 0,
      strongBuy: latest.strongBuy ?? 0, strongSell: latest.strongSell ?? 0,
      period: latest.period ?? '',
    };
  }

  async getCompanyProfile(symbol: string): Promise<any | null> {
    if (this.finnhubKey) {
      const data = await this.finnhubFetch<any>(`/stock/profile2?symbol=${symbol.toUpperCase()}`, `fh:profile:${symbol}`, 24 * 60 * 60_000);
      if (data?.name) return data;
    }
    return null;
  }

  async getPriceHistory(symbol: string, days = 30): Promise<PriceHistoryEntry[]> {
    if (this.fmpKey) {
      const data = await this.fmpFetch<any>(`/historical-price-full/${symbol.toUpperCase()}?timeseries=${days}`, `fmp:hist:${symbol}:${days}`, 60 * 60_000);
      if (data?.historical) {
        return data.historical.map((d: any) => ({ date: d.date, close: d.close })).reverse();
      }
    }

    // Finnhub doesn't have a simple daily endpoint on free tier, so skip
    return [];
  }

  async getIncomeStatement(symbol: string): Promise<any[]> {
    if (!this.fmpKey) return [];
    const data = await this.fmpFetch<any[]>(`/income-statement/${symbol.toUpperCase()}?period=quarter&limit=8`, `fmp:income:${symbol}`, 6 * 60 * 60_000);
    return data || [];
  }

  async getKeyMetrics(symbol: string): Promise<any[]> {
    if (!this.fmpKey) return [];
    const data = await this.fmpFetch<any[]>(`/key-metrics/${symbol.toUpperCase()}?period=quarter&limit=8`, `fmp:metrics:${symbol}`, 6 * 60 * 60_000);
    return data || [];
  }

  async getAnalystEstimates(symbol: string): Promise<any[]> {
    if (!this.fmpKey) return [];
    const data = await this.fmpFetch<any[]>(`/analyst-estimates/${symbol.toUpperCase()}?limit=4`, `fmp:est:${symbol}`, 60 * 60_000);
    return data || [];
  }

  // --- Status ---

  getStatus(): { finnhub: string; fmp: string; cacheSize: number; uptime: number } {
    let finnhubStatus = 'no_key';
    if (this.finnhubKey) {
      finnhubStatus = this.finnhubLimiter.isLimited ? 'rate_limited' : 'ok';
    }

    let fmpStatus = 'no_key';
    if (this.fmpKey) {
      fmpStatus = this.fmpLimiter.isLimited ? 'rate_limited' : 'ok';
    }

    return {
      finnhub: finnhubStatus,
      fmp: fmpStatus,
      cacheSize: this.cache.size,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}

// --- Singleton ---

let instance: MarketDataService | null = null;

export function getMarketDataService(): MarketDataService {
  if (!instance) {
    instance = new MarketDataService();
  }
  return instance;
}
