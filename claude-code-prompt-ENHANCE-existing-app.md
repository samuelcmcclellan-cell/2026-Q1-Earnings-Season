# Claude Code Prompt — Enhance Existing Q1 2026 Earnings App Around FactSet Earnings Insight

Paste the block between the fences into a fresh Claude Code session opened at the root of this repo (`2026 Q1 Earnings Season/`). The reference PDF — `/sessions/nice-hopeful-mayer/mnt/uploads/EarningsInsight_041726.pdf` (FactSet Earnings Insight, April 17, 2026, John Butters) — is the canonical data source. Copy it into the repo (e.g., `server/data/sources/EarningsInsight_041726.pdf`) before running so the session can read it.

---

```
You are refactoring the Q1 2026 Earnings Tracker (React/Vite client + Express/sql.js API + JSON seed + SQLite DB) so that it is systematically architected around a single "north star" data source: the FactSet Earnings Insight PDF at server/data/sources/EarningsInsight_041726.pdf (dated April 17, 2026). A future refresh will replace this PDF with a newer-dated edition of the same report; the pipeline must accommodate that without code changes.

Global principles — enforce these at every step:

1. SOURCE-OF-TRUTH HIERARCHY. Rank data provenance in this exact order and store it on every numeric field as a `source_tier` enum:
     tier_1_factset_insight   – numbers read directly from the FactSet Earnings Insight PDF
     tier_2_company_filing    – company 8-K / press release / IR page (only when FactSet does not carry the figure)
     tier_3_wire              – CNBC / Bloomberg / Reuters / WSJ
     tier_4_aggregator        – GuruFocus / Investing.com / Motley Fool / StockTitan
     tier_5_seed_legacy       – pre-existing seed values with no verifiable source
   Any existing seed value that conflicts with FactSet by more than 0.5pp (rates) or 0.5% (currency) must be OVERWRITTEN with the FactSet figure and its `source_tier` downgraded to "tier_5_seed_legacy" in an audit log. Keep the old value under `prior_value` for traceability; do not silently discard it.

2. SENSE-CHECK EVERY NUMBER against the PDF before persisting. If a figure is not in the PDF and cannot be reconciled to one that is (e.g., a sector-level aggregate computed from company rows), flag it and render it in the UI with a "⚠ unverified" badge.

3. REFRESHABILITY. Assume the PDF will be swapped out weekly for a newer-dated edition. The ingestion pipeline must be idempotent, content-addressed (hash the PDF), and keyed on (report_date, metric, scope) so a re-run updates values in place rather than duplicating.

Work through the steps below in order. Commit after each step with a message of the form "step N: <summary>". Do NOT skip the verification sub-steps.

====================================================================
STEP 1 — Inventory the existing app and the PDF
====================================================================

1a. Read and enumerate every file under client/src, server/src, server/data/seed, scripts, and api/. Write the inventory to docs/inventory-2026-04-17.md grouped by (route, component, model, script, seed-file).

1b. Read EarningsInsight_041726.pdf end-to-end. Produce docs/factset-extract-2026-04-17.md with one section per report section:
     - Key Metrics (scorecard %s, blended growth rates, forward P/E)
     - Topic of the Week (Mag 7 vs Other 493, with and without NVDA)
     - Overview narrative
     - Earnings & Revenue Scorecard (by sector: % above, in-line, below)
     - Earnings & Revenue Revisions (blended growth now vs Mar 31, by sector)
     - Earnings Growth by sector & industry
     - Revenue Growth by sector & industry
     - Net Profit Margin by sector (Q1 2026 vs Q1 2025, vs 5-yr avg)
     - Forward Estimates & Valuation (Q2, Q3, Q4, CY26, CY27 EPS and revenue growth; forward & trailing P/E)
     - Geographic Revenue Exposure (S&P 500 aggregate + per-sector US / International split)
     - Bottom-Up EPS Estimates (CY26 $323.29, CY27 $376.32, quarterly Q126–Q227)
     - Target & Ratings (bottom-up target price $8325.60; Buy/Hold/Sell %; sector breakdowns)
     - Companies-reporting-next-week count
   For every figure, record: section, label, value, unit, and page number.

1c. Cross-reference the inventory against the extract. Produce docs/gap-analysis-2026-04-17.md with three columns: (a) metrics present in the app but NOT in the PDF (candidates for demotion or removal), (b) metrics present in the PDF but NOT in the app (candidates for addition), (c) metrics present in both (sense-check targets).

====================================================================
STEP 2 — Introduce a canonical data layer
====================================================================

2a. Create server/src/data-contract/ with TypeScript types for every metric in the FactSet extract. Group by domain: ScorecardMetrics, RevisionsMetrics, GrowthMetrics, MarginMetrics, ForwardEstimates, Valuation, Geographic, TargetsRatings, BottomUpEPS, TopicOfTheWeek, TopContributors, TopSurprises, UpcomingCalendar. Every field must be `{ value: number | null; unit: "pct" | "usd" | "count" | "ratio"; source_tier: SourceTier; source_page: number | null; as_of: string; notes?: string }`.

2b. Create server/data/canonical/q1-2026.json that conforms to the types in 2a and is populated from docs/factset-extract-2026-04-17.md. This file is the new single source of truth for aggregate / index-level figures. It supersedes any conflicting fields in server/data/seed/*.json.

2c. Migrate the existing company-level seed (server/data/seed/earnings-q1-2026.json) forward:
     - Add `source_tier`, `source_page`, `prior_value`, `as_of` columns to every numeric field.
     - For any ticker whose actuals appear in the PDF (Netflix, Micron, FedEx, Nike, Citigroup, BNY Mellon, Morgan Stanley, McCormick, Constellation Brands, Delta, JPMorgan, Bank of America, Wells Fargo, Goldman Sachs, BlackRock, Truist Financial, Travelers, Exxon Mobil est., Chevron est., Phillips 66 est., AbbVie est., Ford est., Tesla est., Eli Lilly est., Micron Top-Contributor, Sandisk Top-Contributor, Broadcom Top-Contributor, NVIDIA Top-Contributor, General Mills, Progressive, Conagra, Lennar, Cintas, Darden, Fastenal, Abbott, Prologis, Costco), overwrite the seed with the PDF figures and set source_tier = "tier_1_factset_insight".
     - For any seed record that conflicts (e.g., existing C, JPM, WFC, GS errors flagged in earnings-app-audit-2026-04-17.md), store the old value in `prior_value` and downgrade its tier.
     - Produce docs/reconciliation-log-2026-04-17.md listing every field changed: ticker, field, before, after, reason, source_page.

2d. Add server/data/seed/index-aggregates-q1-2026.json — pulled straight from the PDF — with:
     - blended_eps_growth_yoy: 13.2 (page 1, 5)
     - blended_revenue_growth_yoy: 9.9 (page 1, 5)
     - pct_reporting: 10.0 (page 5)
     - pct_beat_eps: 88 (page 5)
     - pct_beat_revenue: 84 (page 5)
     - eps_surprise_pct_aggregate: 10.8 (page 6)
     - revenue_surprise_pct_aggregate: 2.0 (page 7)
     - net_profit_margin: 13.2 (page 11)
     - forward_pe_12m: 20.9 (page 6)
     - forward_pe_5yr_avg: 19.9
     - forward_pe_10yr_avg: 18.9
     - trailing_pe_12m: 27.8 (page 12)
     - bottom_up_target_price: 8325.60 (page 12)
     - upside_vs_closing_pct: 18.2 (page 12)
     - companies_reporting_next_week: 93 (page 6, 13)
     - consecutive_quarters_double_digit_growth: 6 (page 1)
   Each with source_tier = "tier_1_factset_insight" and source_page.

====================================================================
STEP 3 — Add missing dimensions the PDF covers and the app lacks
====================================================================

For each of the following, add a migration, server/src/models/*.ts, server/src/routes/*.ts handler, and client/src/pages or component.

3a. SECTOR METRICS TABLE — one row per sector × metric (growth YoY today, growth YoY Mar 31, net profit margin Q1 2026, net profit margin Q1 2025, net profit margin 5yr avg, fwd P/E, fwd P/E 5yr avg, fwd P/E 10yr avg, US revenue %, international revenue %, % beat EPS, % beat revenue, aggregate EPS surprise %, aggregate revenue surprise %, % Buy, % Hold, % Sell, target-vs-close %). Populate from PDF pages 9–11, 15, 18, 20, 27, 30, 33.

3b. TOPIC OF THE WEEK MODULE — "Mag 7 vs Other 493" with the four series from pages 3–4:
     - Mag 7 Q1 2026: 22.8
     - Mag 7 ex-NVDA Q1 2026: 6.4
     - Other 493 Q1 2026: 10.1
     - Mag 7 CY 2026: 24.6
     - Mag 7 ex-NVDA CY 2026: 13.2
     - Other 493 CY 2026: 15.9
   Plus the top 5 Q1 earnings-growth contributors (Sandisk 14.25, Micron 12.20, Eli Lilly 6.96, Broadcom 2.39, NVIDIA 1.77 — page 4).

3c. FORWARD OUTLOOK CARDS for Q2/Q3/Q4/CY26/CY27 from page 12 (earnings and revenue growth pairs):
     - Q2 2026: 20.1 / 10.3
     - Q3 2026: 22.2 / 9.2
     - Q4 2026: 19.9 / 8.8
     - CY 2026: 18.0 / 9.2
     - CY 2027: 16.5 / 7.3

3d. BOTTOM-UP EPS SERIES — time series for CY26 ($323.29) and CY27 ($376.32), plus per-quarter Q324 $62.78 → Q227 $92.67 (page 29). Render as a line chart component client/src/components/charts/BottomUpEpsTrend.tsx.

3e. GEOGRAPHIC EXPOSURE — aggregate US 60 / International 40, plus the full per-sector breakdown from page 27. Render as a horizontal stacked bar.

3f. TOP / BOTTOM SURPRISES — top 10 (Netflix 61.2, Micron 32.9, FedEx 26.5, Nike 20.4, Citigroup 15.4, BNY Mellon 14.0, Morgan Stanley 13.5, McCormick 11.2, Constellation Brands 10.8, Delta 10.4) and bottom 10 (Costco 0.7, Prologis 0.6, Abbott 0.5, Fastenal 0.4, Darden 0.2, Cintas 0.1, Lennar -2.4, Conagra -2.9, Progressive -5.7, General Mills -12.1) — page 17.

3g. GUIDANCE MODULE — Q2 2026: 4 negative, 3 positive, with sector composition (Consumer Disc 2 neg, Industrials 1 neg, Health Care 1 neg, Info Tech 3 pos). FY 2026/2027: 140 negative, 120 positive out of 260 (page 12, 24).

3h. RATINGS ROLL-UP — 12,896 total ratings; 58.5% Buy / 36.2% Hold / 5.3% Sell; sector Buy-percent breakdown (page 13, 33).

====================================================================
STEP 4 — Reconcile and demote conflicting existing figures
====================================================================

4a. Run the new ingestion pipeline (Step 5) in dry-run mode. Produce docs/conflict-report-2026-04-17.md listing every field where the existing seed disagrees with the PDF by more than tolerance. Include: ticker or metric, seed_value, pdf_value, delta, action_taken.

4b. Rules for resolution:
     - Delta ≤ tolerance → keep seed, tag source_tier = "tier_5_seed_legacy", source_page from PDF so a reader can verify.
     - Delta > tolerance → overwrite with PDF value, set source_tier = "tier_1_factset_insight", preserve seed value in `prior_value`.
     - PDF does not cover the metric → keep seed, tag source_tier = current value (tier_2 / tier_3 / tier_4 / tier_5), render the ⚠ badge in UI.

4c. The specific fixes flagged in earnings-app-audit-2026-04-17.md (C eps 3.06 not 2.85; JPM revenue 50.54B and guidance "lowered"; WFC eps_growth_yoy ~15 not 26; GS guidance "maintained" not "raised"; null gross_margin for all Financials) MUST all land as part of this reconciliation — they are cross-confirmed by the PDF's text on pages 6–8.

4d. Remove fabricated SSNLF (Samsung) commentary — Samsung has not reported Q1 2026 per the PDF's implicit scope.

====================================================================
STEP 5 — Build the refresh pipeline
====================================================================

5a. scripts/ingest-factset-pdf.ts — takes a path to a FactSet Earnings Insight PDF, hashes it (sha256), parses it (use pdfjs-dist or pdf-parse; fall back to structured regex over the text layer), and writes:
     - server/data/canonical/q1-2026.json (aggregate index-level figures)
     - a diff log under server/data/sources/log/<sha256>.json documenting what changed vs the previous run

5b. scripts/reconcile-seed.ts — reads the canonical file and walks server/data/seed/*.json, applying the tier-promotion / demotion rules from Step 4.

5c. scripts/validate-seed.ts (expand the existing one) — additionally verifies:
     - every reported record's eps_growth_yoy is within ±2pp of the PDF-implied sector growth (cross-check for plausibility)
     - every aggregate figure is present in canonical/q1-2026.json
     - every canonical figure has a source_page > 0
     - every "reported" ticker is in companies.json

5d. npm script "refresh-from-pdf":
     node --experimental-transform-types scripts/ingest-factset-pdf.ts server/data/sources/EarningsInsight_041726.pdf
     && node --experimental-transform-types scripts/reconcile-seed.ts
     && node --experimental-transform-types scripts/validate-seed.ts
     && npx tsx server/src/scripts/seed-db.ts

5e. Wire "refresh-from-pdf" into the Vercel build via a preBuild hook (vercel.json → "buildCommand"). Any validation failure must abort the build.

====================================================================
STEP 6 — UI updates to reflect the new canonical data
====================================================================

6a. Dashboard header — replace the existing "Market data unavailable" banner with:
     "Data as of <canonical.as_of> — FactSet Earnings Insight (<source_page count> figures) + <company_filing count> company filings"

6b. Every numeric cell renders a small tier badge: T1 (green), T2 (blue), T3 (yellow), T4 (orange), T5 (gray). Hover reveals the source_page or source URL.

6c. Add new pages/routes:
     /topic-of-the-week   → Mag 7 vs Other 493 (Step 3b)
     /forward-outlook     → Q2/Q3/Q4/CY26/CY27 (Step 3c)
     /bottom-up-eps       → time series (Step 3d)
     /geographic          → US/International (Step 3e)
     /surprises           → top 10 & bottom 10 (Step 3f)
     /ratings             → Buy/Hold/Sell + sector roll-up (Step 3h)

6d. Sidebar — reorder nav so the PDF-aligned pages come first: Dashboard → Scorecard → Growth by Sector → Revisions → Topic of the Week → Forward Outlook → Bottom-Up EPS → Geographic → Margins → Valuation → Ratings → Calendar → Companies. Demote or remove any page that has no FactSet-derived data.

6e. Gross margin — render "—" for Financials (JPM, WFC, C, GS, BLK, BAC, MS, PNC, USB, SCHW, COF, TFC, CB, MMC, AXP). Per the PDF, sector net profit margin is the correct banking metric.

6f. Fix the Vercel SPA routing (add `{ "source": "/((?!api/).*)", "destination": "/index.html" }` to vercel.json rewrites). Fix the calendar filter with `Array.isArray(data?.entries) ? data.entries : []`.

====================================================================
STEP 7 — Test, verify, report
====================================================================

7a. `npm run validate-seed` must exit 0.
7b. `npm run refresh-from-pdf` must exit 0 and produce a non-empty diff log.
7c. `cd client && npx vite build` must compile cleanly.
7d. `npx tsx server/src/scripts/seed-db.ts` must re-seed without errors.
7e. Spot-check at least 10 PDF figures against the rendered UI: blended growth 13.2, blended revenue 9.9, fwd P/E 20.9, Mag 7 Q1 22.8, Info Tech sector growth 45.1, Energy sector growth -13.1, Netflix surprise 61.2, target price 8325.60, US/International 60/40, Financials Buy % 57.

7f. Write docs/upgrade-summary-2026-04-17.md covering:
     - Count of figures overwritten by tier
     - Count of figures retained as seed-legacy with ⚠ badge
     - New routes / components added
     - Files deleted (fabricated data removed)
     - Any PDF figures that could NOT be parsed automatically and were transcribed manually (and why)
     - Validated the three new build gates (validate-seed, refresh-from-pdf, vite build)
```

---

## Notes for Sam before running

- The PDF must live at `server/data/sources/EarningsInsight_041726.pdf` before this prompt runs; the ingestion step depends on that path.
- Next week, drop the new edition at the same path and run `npm run refresh-from-pdf` — no code changes required.
- If the Claude Code session cannot get `pdfjs-dist` / `pdf-parse` working, it should fall back to a manually transcribed JSON of the PDF's figures (already produced in step 1b) rather than blocking.
