import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

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
  source: string;
}

export interface CompanyNewsItem {
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
  image: string;
}

export interface PriceHistoryData {
  symbol: string;
  prices: { date: string; close: number }[];
}

export interface AnalystRec {
  symbol: string;
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export interface MarketStatus {
  finnhub: string;
  fmp: string;
  cacheSize: number;
  uptime: number;
}

export function useQuote(symbol: string, enabled = true) {
  return useQuery({
    queryKey: ['market', 'quote', symbol],
    queryFn: () => apiFetch<MarketQuote>(`/api/market/quote/${symbol}`),
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: enabled && !!symbol,
    retry: false,
  });
}

export function useQuotes(symbols: string[]) {
  const key = symbols.slice().sort().join(',');
  return useQuery({
    queryKey: ['market', 'quotes', key],
    queryFn: () => apiFetch<{ quotes: MarketQuote[]; errors: string[] }>('/api/market/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    }),
    refetchInterval: 60_000,
    enabled: symbols.length > 0,
    retry: false,
  });
}

export function useCompanyNews(symbol: string) {
  return useQuery({
    queryKey: ['market', 'news', symbol],
    queryFn: () => apiFetch<CompanyNewsItem[]>(`/api/market/news/${symbol}`),
    staleTime: 5 * 60_000,
    enabled: !!symbol,
    retry: false,
  });
}

export function usePriceHistory(symbol: string, days = 30) {
  return useQuery({
    queryKey: ['market', 'priceHistory', symbol, days],
    queryFn: () => apiFetch<PriceHistoryData>(`/api/market/price-history/${symbol}?days=${days}`),
    staleTime: 60 * 60_000,
    enabled: !!symbol,
    retry: false,
  });
}

export function useRecommendations(symbol: string) {
  return useQuery({
    queryKey: ['market', 'recommendations', symbol],
    queryFn: () => apiFetch<AnalystRec | null>(`/api/market/recommendations/${symbol}`),
    staleTime: 60 * 60_000,
    enabled: !!symbol,
    retry: false,
  });
}

export function useMarketStatus() {
  return useQuery({
    queryKey: ['market', 'status'],
    queryFn: () => apiFetch<MarketStatus>('/api/market/status'),
    refetchInterval: 5 * 60_000,
    retry: false,
  });
}
