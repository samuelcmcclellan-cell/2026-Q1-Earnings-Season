/**
 * Canonical data contract for the FactSet Earnings Insight pipeline.
 *
 * Every numeric field carries provenance: which tier the number came from,
 * which PDF page (if tier_1), the as-of date, and any prior value that was
 * overwritten. See docs/factset-extract-2026-04-17.md for the source report.
 */

export type SourceTier =
  | 'tier_1_factset_insight' // FactSet Earnings Insight PDF (authoritative)
  | 'tier_2_company_filing' // 8-K, press release, IR page
  | 'tier_3_wire' // CNBC / Bloomberg / Reuters / WSJ
  | 'tier_4_aggregator' // GuruFocus / Investing.com / Motley Fool / StockTitan
  | 'tier_5_seed_legacy'; // pre-existing seed value, unverifiable

export type MetricUnit = 'pct' | 'usd' | 'count' | 'ratio';

/** Wrapped numeric with full provenance. */
export interface TracedValue<U extends MetricUnit = MetricUnit> {
  value: number | null;
  unit: U;
  source_tier: SourceTier;
  source_page: number | null;
  as_of: string; // ISO date (YYYY-MM-DD)
  notes?: string;
  prior_value?: number | null;
}

/* ----------------------------------------------------------------------
 * Domain: Scorecard Metrics (PDF pages 1, 5, 6, 7)
 * ------------------------------------------------------------------- */

export interface ScorecardMetrics {
  pct_reporting: TracedValue<'pct'>;
  pct_beat_eps: TracedValue<'pct'>;
  pct_beat_revenue: TracedValue<'pct'>;
  pct_inline_eps: TracedValue<'pct'>;
  pct_miss_eps: TracedValue<'pct'>;
  eps_surprise_pct_aggregate: TracedValue<'pct'>;
  revenue_surprise_pct_aggregate: TracedValue<'pct'>;
  eps_surprise_pct_5yr_avg: TracedValue<'pct'>;
  eps_surprise_pct_10yr_avg: TracedValue<'pct'>;
  revenue_surprise_pct_5yr_avg: TracedValue<'pct'>;
  revenue_surprise_pct_10yr_avg: TracedValue<'pct'>;
  pct_beat_eps_5yr_avg: TracedValue<'pct'>;
  pct_beat_eps_10yr_avg: TracedValue<'pct'>;
  pct_beat_revenue_5yr_avg: TracedValue<'pct'>;
  pct_beat_revenue_10yr_avg: TracedValue<'pct'>;
  avg_price_reaction_positive_surprise: TracedValue<'pct'>;
  avg_price_reaction_negative_surprise: TracedValue<'pct'>;
}

/* ----------------------------------------------------------------------
 * Domain: Revisions Metrics (PDF pages 7–9)
 * ------------------------------------------------------------------- */

export interface RevisionsMetrics {
  blended_eps_growth_now: TracedValue<'pct'>;
  blended_eps_growth_last_week: TracedValue<'pct'>;
  blended_eps_growth_mar31: TracedValue<'pct'>;
  blended_revenue_growth_now: TracedValue<'pct'>;
  blended_revenue_growth_last_week: TracedValue<'pct'>;
  blended_revenue_growth_mar31: TracedValue<'pct'>;
}

/* ----------------------------------------------------------------------
 * Domain: Growth Metrics (PDF pages 9–11)
 * ------------------------------------------------------------------- */

export interface GrowthMetrics {
  blended_eps_growth_yoy: TracedValue<'pct'>;
  blended_revenue_growth_yoy: TracedValue<'pct'>;
  consecutive_quarters_double_digit_growth: TracedValue<'count'>;
  earnings_growth_5yr_avg: TracedValue<'pct'>;
  earnings_growth_10yr_avg: TracedValue<'pct'>;
  revenue_growth_5yr_avg: TracedValue<'pct'>;
  revenue_growth_10yr_avg: TracedValue<'pct'>;
}

/* ----------------------------------------------------------------------
 * Domain: Margin Metrics (PDF page 11, 20)
 * ------------------------------------------------------------------- */

export interface MarginMetrics {
  net_profit_margin_q1_2026: TracedValue<'pct'>;
  net_profit_margin_q4_2025: TracedValue<'pct'>;
  net_profit_margin_q1_2025: TracedValue<'pct'>;
  net_profit_margin_5yr_avg: TracedValue<'pct'>;
}

/* ----------------------------------------------------------------------
 * Domain: Forward Estimates (PDF page 12)
 * ------------------------------------------------------------------- */

export interface ForwardEstimatesPeriod {
  eps_growth_yoy: TracedValue<'pct'>;
  revenue_growth_yoy: TracedValue<'pct'>;
}

export interface ForwardEstimates {
  q2_2026: ForwardEstimatesPeriod;
  q3_2026: ForwardEstimatesPeriod;
  q4_2026: ForwardEstimatesPeriod;
  cy_2026: ForwardEstimatesPeriod;
  cy_2027: ForwardEstimatesPeriod;
}

/* ----------------------------------------------------------------------
 * Domain: Valuation (PDF page 12)
 * ------------------------------------------------------------------- */

export interface Valuation {
  forward_pe_12m: TracedValue<'ratio'>;
  forward_pe_12m_5yr_avg: TracedValue<'ratio'>;
  forward_pe_12m_10yr_avg: TracedValue<'ratio'>;
  forward_pe_12m_mar31: TracedValue<'ratio'>;
  trailing_pe_12m: TracedValue<'ratio'>;
  trailing_pe_12m_5yr_avg: TracedValue<'ratio'>;
  trailing_pe_12m_10yr_avg: TracedValue<'ratio'>;
  index_price_change_since_mar31: TracedValue<'pct'>;
  forward_eps_change_since_mar31: TracedValue<'pct'>;
}

/* ----------------------------------------------------------------------
 * Domain: Geographic Revenue Exposure (PDF page 27)
 * ------------------------------------------------------------------- */

export interface GeographicExposure {
  us_revenue_pct: TracedValue<'pct'>;
  international_revenue_pct: TracedValue<'pct'>;
}

export interface Geographic {
  aggregate: GeographicExposure;
  by_sector: Record<string, GeographicExposure>;
}

/* ----------------------------------------------------------------------
 * Domain: Targets & Ratings (PDF pages 12–13, 33)
 * ------------------------------------------------------------------- */

export interface TargetsRatings {
  bottom_up_target_price: TracedValue<'usd'>;
  closing_price: TracedValue<'usd'>;
  upside_vs_closing_pct: TracedValue<'pct'>;
  total_ratings_count: TracedValue<'count'>;
  pct_buy: TracedValue<'pct'>;
  pct_hold: TracedValue<'pct'>;
  pct_sell: TracedValue<'pct'>;
  sector_buy_pct: Record<string, TracedValue<'pct'>>;
  sector_upside_pct: Record<string, TracedValue<'pct'>>;
}

/* ----------------------------------------------------------------------
 * Domain: Bottom-Up EPS (PDF pages 28–29)
 * ------------------------------------------------------------------- */

export interface BottomUpEpsPoint {
  period: string; // e.g. "Q3 2024", "CY 2026"
  eps: TracedValue<'usd'>;
}

export interface BottomUpEPS {
  cy_2026: TracedValue<'usd'>;
  cy_2027: TracedValue<'usd'>;
  quarterly: BottomUpEpsPoint[];
}

/* ----------------------------------------------------------------------
 * Domain: Topic of the Week — Mag 7 vs Other 493 (PDF pages 3–4)
 * ------------------------------------------------------------------- */

export interface TopicOfTheWeek {
  headline: string;
  mag7_q1_2026_growth: TracedValue<'pct'>;
  mag7_ex_nvda_q1_2026_growth: TracedValue<'pct'>;
  other493_q1_2026_growth: TracedValue<'pct'>;
  mag7_cy_2026_growth: TracedValue<'pct'>;
  mag7_ex_nvda_cy_2026_growth: TracedValue<'pct'>;
  other493_cy_2026_growth: TracedValue<'pct'>;
}

export interface TopContributor {
  ticker: string;
  company: string;
  contribution_pct_points: TracedValue<'pct'>;
}

/* ----------------------------------------------------------------------
 * Domain: Top / Bottom Surprises (PDF page 17)
 * ------------------------------------------------------------------- */

export interface SurpriseEntry {
  ticker: string;
  company: string;
  eps_surprise_pct: TracedValue<'pct'>;
}

export interface TopSurprises {
  top10: SurpriseEntry[];
  bottom10: SurpriseEntry[];
}

/* ----------------------------------------------------------------------
 * Domain: Guidance Counts (PDF pages 12, 24)
 * ------------------------------------------------------------------- */

export interface GuidanceCounts {
  q2_2026_negative: TracedValue<'count'>;
  q2_2026_positive: TracedValue<'count'>;
  q2_2026_by_sector: Record<
    string,
    { negative: TracedValue<'count'>; positive: TracedValue<'count'> }
  >;
  fy_total: TracedValue<'count'>;
  fy_negative: TracedValue<'count'>;
  fy_positive: TracedValue<'count'>;
  pct_issuing_negative_q2: TracedValue<'pct'>;
  pct_issuing_negative_q2_5yr_avg: TracedValue<'pct'>;
  pct_issuing_negative_q2_10yr_avg: TracedValue<'pct'>;
}

/* ----------------------------------------------------------------------
 * Domain: Upcoming Calendar (PDF pages 6, 13)
 * ------------------------------------------------------------------- */

export interface UpcomingCalendar {
  companies_reporting_next_week: TracedValue<'count'>;
  dow30_reporting_next_week: TracedValue<'count'>;
}

/* ----------------------------------------------------------------------
 * Per-sector comprehensive metrics (pages 6–12, 20, 27, 30, 33)
 * ------------------------------------------------------------------- */

export interface SectorMetrics {
  sector: string;
  eps_growth_yoy_now: TracedValue<'pct'>;
  eps_growth_yoy_mar31: TracedValue<'pct'> | null;
  revenue_growth_yoy_now: TracedValue<'pct'>;
  revenue_growth_yoy_mar31: TracedValue<'pct'> | null;
  net_profit_margin_q1_2026: TracedValue<'pct'>;
  net_profit_margin_q1_2025: TracedValue<'pct'> | null;
  net_profit_margin_5yr_avg: TracedValue<'pct'> | null;
  forward_pe: TracedValue<'ratio'>;
  forward_pe_5yr_avg: TracedValue<'ratio'> | null;
  forward_pe_10yr_avg: TracedValue<'ratio'> | null;
  us_revenue_pct: TracedValue<'pct'>;
  international_revenue_pct: TracedValue<'pct'>;
  pct_beat_eps: TracedValue<'pct'> | null;
  pct_beat_revenue: TracedValue<'pct'> | null;
  eps_surprise_pct_aggregate: TracedValue<'pct'> | null;
  revenue_surprise_pct_aggregate: TracedValue<'pct'> | null;
  pct_buy: TracedValue<'pct'>;
  pct_hold: TracedValue<'pct'> | null;
  pct_sell: TracedValue<'pct'> | null;
  target_vs_close_pct: TracedValue<'pct'>;
}

/* ----------------------------------------------------------------------
 * Root canonical document
 * ------------------------------------------------------------------- */

export interface CanonicalQuarterReport {
  report_date: string; // ISO date of the FactSet PDF edition
  quarter: string; // e.g. "Q1 2026"
  source_file: string; // filename under server/data/sources/
  source_sha256: string | null;
  scorecard: ScorecardMetrics;
  revisions: RevisionsMetrics;
  growth: GrowthMetrics;
  margin: MarginMetrics;
  forward_estimates: ForwardEstimates;
  valuation: Valuation;
  geographic: Geographic;
  targets_ratings: TargetsRatings;
  bottom_up_eps: BottomUpEPS;
  topic_of_the_week: TopicOfTheWeek;
  top_contributors: TopContributor[];
  top_surprises: TopSurprises;
  guidance_counts: GuidanceCounts;
  upcoming_calendar: UpcomingCalendar;
  sector_metrics: SectorMetrics[];
}

/* ----------------------------------------------------------------------
 * Helper constructor
 * ------------------------------------------------------------------- */

export function traced<U extends MetricUnit>(
  value: number | null,
  unit: U,
  source_tier: SourceTier,
  source_page: number | null,
  as_of: string,
  extra?: { notes?: string; prior_value?: number | null }
): TracedValue<U> {
  return {
    value,
    unit,
    source_tier,
    source_page,
    as_of,
    ...(extra?.notes !== undefined ? { notes: extra.notes } : {}),
    ...(extra?.prior_value !== undefined ? { prior_value: extra.prior_value } : {}),
  };
}

export const SOURCE_TIERS: readonly SourceTier[] = [
  'tier_1_factset_insight',
  'tier_2_company_filing',
  'tier_3_wire',
  'tier_4_aggregator',
  'tier_5_seed_legacy',
] as const;

export const TIER_RANK: Record<SourceTier, number> = {
  tier_1_factset_insight: 1,
  tier_2_company_filing: 2,
  tier_3_wire: 3,
  tier_4_aggregator: 4,
  tier_5_seed_legacy: 5,
};

export const TIER_LABEL_SHORT: Record<SourceTier, string> = {
  tier_1_factset_insight: 'T1',
  tier_2_company_filing: 'T2',
  tier_3_wire: 'T3',
  tier_4_aggregator: 'T4',
  tier_5_seed_legacy: 'T5',
};
