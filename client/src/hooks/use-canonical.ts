import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

// ---------- Shared provenance types ----------
export type SourceTier =
  | 'tier_1_factset_insight'
  | 'tier_2_company_filing'
  | 'tier_3_wire'
  | 'tier_4_aggregator'
  | 'tier_5_seed_legacy';

export interface TracedValue<T = number> {
  value: T | null;
  unit: string;
  source_tier: SourceTier;
  source_page: number | null;
  as_of: string;
  notes?: string;
  prior_value?: number | null;
}

// ---------- Endpoint payload types ----------
export interface CanonicalMeta {
  report_date: string;
  quarter: string;
  source_file: string;
  source_sha256: string | null;
  tier1_figure_count: number;
}

export interface Aggregates {
  quarter: string;
  report_date: string;
  source_file: string;
  aggregates: Record<string, TracedValue<number>>;
}

export interface CanonicalScorecard {
  pct_reported: TracedValue;
  pct_beat_eps: TracedValue;
  pct_beat_revenue: TracedValue;
  eps_surprise_pct_aggregate: TracedValue;
  revenue_surprise_pct_aggregate: TracedValue;
  companies_reporting_next_week: TracedValue;
  [k: string]: TracedValue | undefined;
}

export interface TopicOfWeek {
  topic: {
    title: string;
    summary: string;
    source_tier: SourceTier;
    source_page: number | null;
    as_of: string;
  } | null;
  contributors: Array<{
    ticker: string;
    name?: string;
    metric?: string;
    value?: number | string | null;
    source_tier: SourceTier;
    source_page: number | null;
  }>;
}

export interface ForwardOutlook {
  cy_2026_eps_growth: TracedValue;
  cy_2026_revenue_growth: TracedValue;
  q2_2026_eps_growth: TracedValue;
  q2_2026_revenue_growth: TracedValue;
  q3_2026_eps_growth?: TracedValue;
  q3_2026_revenue_growth?: TracedValue;
  q4_2026_eps_growth?: TracedValue;
  q4_2026_revenue_growth?: TracedValue;
  [k: string]: TracedValue | undefined;
}

export interface BottomUpEps {
  series: Array<{
    period: string;
    eps: TracedValue;
  }>;
  notes?: string;
}

export interface Geographic {
  sp500_revenue_us: TracedValue;
  sp500_revenue_intl: TracedValue;
  by_sector?: Array<{
    sector: string;
    us_revenue_pct: TracedValue;
    intl_revenue_pct: TracedValue;
  }>;
  growth_by_region?: {
    us: TracedValue;
    intl: TracedValue;
  };
}

export interface Surprise {
  ticker: string;
  name?: string;
  metric: 'eps' | 'revenue';
  surprise_pct: TracedValue;
  stock_reaction_pct?: TracedValue;
}

export interface TopSurprises {
  eps_top?: Surprise[];
  eps_bottom?: Surprise[];
  revenue_top?: Surprise[];
  revenue_bottom?: Surprise[];
}

export interface TargetsRatings {
  bottom_up_target_price: TracedValue;
  upside_vs_closing_pct: TracedValue;
  ratings?: {
    buy_pct: TracedValue;
    hold_pct: TracedValue;
    sell_pct: TracedValue;
  };
  by_sector?: Array<{
    sector: string;
    buy_pct: TracedValue;
    hold_pct: TracedValue;
    sell_pct: TracedValue;
  }>;
}

export interface GuidanceCounts {
  eps_positive_count: TracedValue;
  eps_negative_count: TracedValue;
  eps_positive_5yr_avg?: TracedValue;
  revenue_positive_count?: TracedValue;
  revenue_negative_count?: TracedValue;
}

export interface SectorMetrics {
  sectors: Array<{
    sector: string;
    eps_growth_yoy?: TracedValue;
    revenue_growth_yoy?: TracedValue;
    net_profit_margin?: TracedValue;
    pct_beat_eps?: TracedValue;
    pct_beat_revenue?: TracedValue;
    [k: string]: any;
  }>;
}

export interface Valuation {
  forward_pe_12m: TracedValue;
  forward_pe_5yr_avg: TracedValue;
  forward_pe_10yr_avg: TracedValue;
  trailing_pe_12m: TracedValue;
  by_sector?: Array<{
    sector: string;
    forward_pe_12m: TracedValue;
    forward_pe_5yr_avg?: TracedValue;
  }>;
}

export interface Margin {
  net_profit_margin: TracedValue;
  net_profit_margin_5yr_avg?: TracedValue;
  by_sector?: Array<{
    sector: string;
    net_profit_margin: TracedValue;
  }>;
}

// ---------- Hooks ----------
const base = '/api/canonical';

export const useCanonicalMeta = () =>
  useQuery({ queryKey: ['canonical', 'meta'], queryFn: () => apiFetch<CanonicalMeta>(`${base}/meta`) });

export const useAggregates = () =>
  useQuery({ queryKey: ['canonical', 'aggregates'], queryFn: () => apiFetch<Aggregates>(`${base}/aggregates`) });

export const useCanonicalScorecard = () =>
  useQuery({ queryKey: ['canonical', 'scorecard'], queryFn: () => apiFetch<CanonicalScorecard>(`${base}/scorecard`) });

export const useTopicOfTheWeek = () =>
  useQuery({ queryKey: ['canonical', 'topic'], queryFn: () => apiFetch<TopicOfWeek>(`${base}/topic-of-the-week`) });

export const useForwardOutlook = () =>
  useQuery({ queryKey: ['canonical', 'forward'], queryFn: () => apiFetch<ForwardOutlook>(`${base}/forward-outlook`) });

export const useBottomUpEps = () =>
  useQuery({ queryKey: ['canonical', 'bottom-up-eps'], queryFn: () => apiFetch<BottomUpEps>(`${base}/bottom-up-eps`) });

export const useGeographic = () =>
  useQuery({ queryKey: ['canonical', 'geographic'], queryFn: () => apiFetch<Geographic>(`${base}/geographic`) });

export const useSurprises = () =>
  useQuery({ queryKey: ['canonical', 'surprises'], queryFn: () => apiFetch<TopSurprises>(`${base}/surprises`) });

export const useRatings = () =>
  useQuery({ queryKey: ['canonical', 'ratings'], queryFn: () => apiFetch<TargetsRatings>(`${base}/ratings`) });

export const useGuidance = () =>
  useQuery({ queryKey: ['canonical', 'guidance'], queryFn: () => apiFetch<GuidanceCounts>(`${base}/guidance`) });

export const useSectorMetrics = () =>
  useQuery({ queryKey: ['canonical', 'sector-metrics'], queryFn: () => apiFetch<SectorMetrics>(`${base}/sector-metrics`) });

export const useValuation = () =>
  useQuery({ queryKey: ['canonical', 'valuation'], queryFn: () => apiFetch<Valuation>(`${base}/valuation`) });

export const useMargin = () =>
  useQuery({ queryKey: ['canonical', 'margin'], queryFn: () => apiFetch<Margin>(`${base}/margin`) });
