# Conflict Report — Q1 2026 Seed vs FactSet Earnings Insight (2026-04-17)

**Source of truth:** `server/data/sources/EarningsInsight_041726.pdf` (FactSet Earnings Insight, April 17, 2026)
**Reconciliation script:** `scripts/migrate-seed-to-tiered.mjs`
**Machine log:** `docs/reconciliation-log-2026-04-17.md`

## Resolution rules

Applied uniformly across all reconciled tickers. See `server/src/data-contract/index.ts` for the enum.

1. **Tier hierarchy (descending authority)**
   - `tier_1_factset_insight` — authoritative for aggregates, surprises, peer comparisons
   - `tier_2_company_filing` — authoritative for company-specific actuals (10-Q, 8-K, press release)
   - `tier_3_wire` — Dow Jones / Reuters / Bloomberg headline transcripts
   - `tier_4_aggregator` — third-party feeds (Yahoo, Finviz)
   - `tier_5_seed_legacy` — pre-refactor seed with unknown provenance
2. **Tolerance before overwrite**
   - Rates (pct, ratio, bps): **0.5 pp**
   - Currency / counts: **0.5%** of the larger magnitude
   - Below tolerance → keep existing value, annotate source but do not touch.
   - Above tolerance → PDF wins for tier 1 fields; old value is preserved in `prior_values.<field>`.
3. **Financials sector gross margin**
   - Banks, insurers, exchanges, and diversified financials do not report a comparable COGS/gross margin.
   - `gross_margin` set to `null` and any UI surfacing it must render "—" for these tickers.
4. **Unit normalisation**
   - Revenue stored in raw USD (not billions). Migration re-ran after a prior unit-mismatch bug.
5. **Provenance attachment**
   - Any record whose numeric value was sourced from the PDF gets a record-level
     `provenance` block with `source_tier`, `source_page`, `as_of`.
   - Individual fields of interest are tracked in `field_sources[field] = { source_tier, source_page }`.

## Conflicts resolved (company-level)

| Ticker | Field(s) | Prior | PDF | Resolution | Page |
|---|---|---|---|---|---|
| JPM | eps_actual, eps_estimate, eps_surprise_pct | 5.07 / 4.65 / 9.0 | 5.94 / 5.45 / 9.0 | PDF override (above tolerance); `prior_values.revenue_actual = 50_540_000_000` (audit claim) | 6 |
| JPM | revenue_actual | 50_540_000_000 | 49_840_000_000 | PDF override (audit claim demoted to prior_value) | 6 |
| C   | eps_actual, eps_estimate, eps_surprise_pct | 2.42 / 2.17 / 11.5 | 3.06 / 2.65 / 15.5 | PDF override | 6 |
| MS  | eps_actual, eps_estimate, eps_surprise_pct | 2.87 / 2.42 / 18.6 | 3.43 / 3.02 / 13.6 | PDF override | 6 |
| GS  | eps_actual, eps_estimate, eps_surprise_pct | 16.31 / 13.96 / 16.8 | 17.55 / 16.47 / 6.6 | PDF override | 6 |
| BAC | eps_actual, eps_estimate, eps_surprise_pct | 0.93 / 0.86 / 8.1 | 1.11 / 1.01 / 9.9 | PDF override | 6 |
| WFC | eps_actual, eps_estimate, eps_surprise_pct | 1.42 / 1.40 / 1.4 | 1.60 / 1.59 / 0.6 | PDF override | 6 |
| BK  | eps_actual, eps_estimate, eps_surprise_pct | null / null / null | 2.24 / 1.96 / 14.3 | PDF fills empty seed | 7 |
| TRV | eps_actual, eps_estimate, eps_surprise_pct | null / null / null | 7.71 / 7.07 / 9.1 | PDF fills empty seed | 7 |
| DAL | eps_actual, eps_estimate, eps_surprise_pct | null / null / null | 0.64 / 0.58 / 10.4 | PDF fills empty seed | 6 |
| MKC, STZ, GIS, PGR, CAG, LEN, CTAS, DRI, FAST | eps_surprise_pct | null | per-row values | Added to seed and populated from Top Surprises tables | 17 |
| All Financials (JPM, WFC, GS, C, MS, BK, BAC) | gross_margin | various | null | Rule 3 — Financials do not report a comparable gross margin | — |

See `docs/reconciliation-log-2026-04-17.md` for the complete machine-generated line-by-line diff.

## Aggregate conflicts (headline figures)

| Metric | Prior seed | PDF | Resolution | Page |
|---|---|---|---|---|
| blended_eps_growth_yoy | 7.1% (scorecard derived) | 13.2% | Tier 1 wins — scorecard in UI now cross-checks aggregates.blended_eps_growth_yoy and flags divergence | 1 |
| blended_revenue_growth_yoy | 6.5% (scorecard derived) | 9.9% | Tier 1 wins | 1 |
| pct_beat_eps | scorecard derived | 88% | Reported-only subset ≠ full universe; scorecard figure kept for reported view, aggregates for headline | 5 |
| forward_pe_12m | absent | 20.9x | Inserted from PDF | 6 |
| bottom_up_target_price | absent | $8,325.60 | Inserted from PDF | 12 |
| net_profit_margin | absent | 13.2% | Inserted from PDF | 11 |
| consecutive_quarters_double_digit_growth | absent | 6 | Inserted from PDF | 1 |

All aggregate values written to `server/data/seed/index-aggregates-q1-2026.json` as TracedValue objects with `source_tier = tier_1_factset_insight` and the appropriate `source_page`.

## Known unresolved / watchlist

- Pages 14-33 of the PDF include several charts whose text layer contains only the section title. The figures on those pages were transcribed manually (sector valuation ladders, geographic ladders, targets by sector). Each such value carries `notes: "chart transcription"` so a future automated OCR pipeline can re-verify.
- Calendar / upcoming-week figures (`companies_reporting_next_week: 93`) rely on a page-6 text block that is not machine-friendly; future pipeline should cross-check against the Calendar component's own count.

## How to re-run

```
node scripts/migrate-seed-to-tiered.mjs
```

The script is idempotent and writes a new reconciliation log each run.
