# Gap Analysis — App vs FactSet Earnings Insight (Apr 17, 2026)

Cross-references `docs/inventory-2026-04-17.md` (current app state) against `docs/factset-extract-2026-04-17.md` (canonical PDF source of truth).

---

## A. Metrics present in the app but NOT in the PDF
### (candidates for demotion to tier_5_seed_legacy or removal)

| Metric | Where | Verdict |
|---|---|---|
| Per-company EPS/revenue YoY growth history | earnings_reports.eps_growth_yoy | Keep (computed from PDF prior-year values) — but tier by source of actual numbers |
| Per-company stock_reaction_pct | earnings_reports | Keep; PDF discusses aggregate only, not per-company |
| Gross margin & operating margin (per-company, non-financials) | earnings_reports | Keep, but tag tier_5 since PDF uses sector-level net profit margin instead |
| Guidance_direction per company | earnings_reports | Keep (PDF covers only aggregate guidance counts) |
| Thematic signals (AI, tariffs, China, capex themes) | thematic_signals | Keep; additive — not in PDF |
| Commentary quotes | commentary | Keep; additive — not in PDF |
| AI-streamed analysis | ai service + route | Keep; additive |
| Forward EPS revision % per company | earnings_reports.forward_eps_revision_pct | Keep — but align to PDF's aggregate narrative |
| Regions page (Europe, Japan, China, EM) | regions route + UI | Keep — PDF is S&P 500 only, but the app's broader coverage is a legitimate superset |
| Market data (live quotes, news) | market route + services | Keep — additive; no PDF overlap |
| Segments (market-cap, style buckets) | segments route | Keep — additive |
| Sector gross/operating margins (aggregate) | sector_scores.avg_gross_margin, avg_operating_margin | Demote — PDF uses **net profit margin**; rename/supplement rather than remove |

---

## B. Metrics in the PDF but NOT in the app
### (candidates for addition)

| Metric | PDF Page | Planned home |
|---|---|---|
| Blended EPS growth YoY (aggregate) | 1, 5 | index_aggregates + scorecard header |
| Blended revenue growth YoY (aggregate) | 1, 5 | index_aggregates |
| Pct reporting (aggregate) | 5 | index_aggregates |
| Consecutive quarters of double-digit EPS growth | 1, 5 | index_aggregates |
| Aggregate EPS surprise % | 6 | index_aggregates |
| Aggregate revenue surprise % | 7 | index_aggregates |
| S&P 500 net profit margin (aggregate) | 11 | index_aggregates |
| Forward 12M P/E (aggregate, 5yr, 10yr avg) | 1, 6, 12 | index_aggregates |
| Trailing 12M P/E (aggregate, 5yr, 10yr avg) | 12 | index_aggregates |
| Bottom-up target price + upside % | 12 | index_aggregates |
| Companies reporting next week | 6, 13 | index_aggregates |
| Mag 7 vs Other 493 module | 3–4 | **NEW** `/topic-of-the-week` page |
| Mag 7 ex-NVDA comparison | 3 | same |
| Top-5 earnings contributors | 4 | same (Sandisk, Micron, Lilly, Broadcom, NVIDIA) |
| Forward outlook Q2/Q3/Q4/CY26/CY27 (EPS & rev growth pairs) | 12 | **NEW** `/forward-outlook` page |
| Bottom-up EPS annual + quarterly series | 28–29 | **NEW** `/bottom-up-eps` page w/ chart |
| Geographic revenue exposure (aggregate + per sector) | 27 | **NEW** `/geographic` page |
| Top 10 / Bottom 10 EPS surprise companies | 17 | **NEW** `/surprises` page |
| Guidance counts — Q2 neg/pos; FY neg/pos | 12, 24 | **NEW** guidance module (on Forward Outlook) |
| Ratings roll-up 58.5% B / 36.2% H / 5.3% S | 13 | **NEW** `/ratings` page |
| Sector Buy% breakdown | 13, 33 | same |
| Sector upside vs closing % | 12, 33 | same |
| Sector net profit margin Q1 2026 vs Q1 2025 vs 5yr avg | 11, 20 | **NEW** sector_metrics table + /margins page augmentation |
| Sector forward P/E + 5yr/10yr avg | 12, 30, 31 | sector_metrics table |
| Sector-level % beat EPS / revenue | 6, 7 | sector_metrics table |
| Sector EPS surprise % / Revenue surprise % | 6, 7 | sector_metrics table |
| Sector EPS/revenue growth YoY today vs March 31 | 8, 9 | sector_metrics table (add "prior" column) |
| Industry-level earnings growth (Semis 95%, Metals & Mining 89%, etc.) | 9–11 | industry_metrics table (new) |

---

## C. Metrics present in both (sense-check targets)

These are fields that exist in both the app's seed and the PDF. Each will be reconciled in Step 4 per the source-tier rules.

| Metric | Scope | PDF Page | App location | Notes |
|---|---|---|---|---|
| Citigroup EPS actual | Q1 2026 | 7 | earnings_reports (C) | App has 3.06 — matches PDF ✓ |
| JPMorgan EPS actual | Q1 2026 | 7 | earnings_reports (JPM) | App has 5.94 — matches PDF ✓ |
| JPMorgan revenue actual | Q1 2026 | 9 | earnings_reports (JPM) | Audit flagged 50.54B; **PDF says 49.84B** — overwrite |
| BAC EPS actual | Q1 2026 | 7 | earnings_reports (BAC) | App has 1.11 — matches PDF ✓ |
| MS EPS actual | Q1 2026 | 7 | earnings_reports (MS) | App has 3.43 — matches PDF ✓ |
| WFC EPS YoY growth | Q1 2026 | 7, 8 | earnings_reports (WFC) | App has 15.1 — audit says 26, sector prose implies ~15 — keep app, tag tier_1 |
| GS guidance direction | Q1 2026 | (not in PDF) | earnings_reports (GS) | App "maintained"; no PDF record — keep seed, tag tier_5 |
| Info Tech sector EPS growth | Q1 2026 | 8, 9 | sector_scores (computed) | 45.1% per PDF — overwrite |
| Energy sector EPS growth | Q1 2026 | 8, 10 | sector_scores | -13.1% per PDF — overwrite |
| Financials sector EPS growth | Q1 2026 | 8, 10 | sector_scores | 19.7% per PDF — overwrite |
| Communication Services sector EPS growth | Q1 2026 | 8 | sector_scores | -0.7% per PDF — overwrite |
| Health Care sector EPS growth | Q1 2026 | 8, 10 | sector_scores | -10.5% per PDF — overwrite |
| Utilities sector EPS growth | Q1 2026 | 10 | sector_scores | 10.1% per PDF — overwrite |
| Materials sector EPS growth | Q1 2026 | 9 | sector_scores | 21.6% per PDF — overwrite |
| Pct beat EPS (aggregate) | Q1 2026 | 1, 5, 6 | scorecard service | 88% per PDF — authoritative |
| Pct beat revenue (aggregate) | Q1 2026 | 1, 5, 7 | scorecard service | 84% per PDF — authoritative |
| Blended EPS growth (aggregate) | Q1 2026 | 1, 5 | scorecard service | 13.2% per PDF — authoritative |
| Blended revenue growth (aggregate) | Q1 2026 | 1, 5 | scorecard service | 9.9% per PDF — authoritative |
| Aggregate EPS surprise % | Q1 2026 | 6 | scorecard (not currently exposed) | 10.8% per PDF — new field |
| Aggregate revenue surprise % | Q1 2026 | 7 | scorecard (not currently exposed) | 2.0% per PDF — new field |

---

## D. Known incorrect values (from audit 2026-04-17)

All cross-confirmed by the PDF and will be overwritten in Step 4:

| Ticker | Field | Seed | PDF | Action |
|---|---|---|---|---|
| C | eps_actual | (per earlier audit) 2.85 | 3.06 | overwrite; prior_value=2.85; tier_1 |
| JPM | revenue_actual | 50.54B (per audit) | 49.84B | overwrite; prior_value=50.54B; tier_1 |
| JPM | guidance_direction | "lowered" (seed) | n/a | keep seed, tier_5 (PDF doesn't state) |
| WFC | eps_growth_yoy | 26 (per audit) | ~15.1 implied | keep 15.1, tier_1 (sector-narrative plausible) |
| GS | guidance_direction | "raised" (per audit) → seed shows "maintained" | n/a | seed already "maintained"; keep tier_5 |
| Financials tickers | gross_margin | (non-null seed) | n/a | null + render "—" in UI (Step 6e); tier n/a |
| SSNLF (Samsung) | all fabricated commentary | (seed) | not reported | remove entirely |

---

## E. Structural gaps in the data model

| Gap | Remediation |
|---|---|
| No `source_tier` enum | Step 2a — add to TS types, Step 2c — add to seed, Step 2d aggregates |
| No `source_page` column | Same |
| No `prior_value` column | Same |
| No `as_of` date column | Same |
| No canonical aggregate file | Step 2b — `server/data/canonical/q1-2026.json` + Step 2d `server/data/seed/index-aggregates-q1-2026.json` |
| No PDF ingestion pipeline | Step 5a — `scripts/ingest-factset-pdf.ts` |
| No sector×metric matrix | Step 3a — sector_metrics table |
| No industry-level table | Step 3 (bonus) — industry_metrics table |
| No canonical upgrade/reconcile script | Step 5b |
| No expanded validate-seed with PDF cross-check | Step 5c |
| No build-time refresh hook | Step 5e — vercel.json buildCommand |
