# Q1 2026 Earnings Tracker — Data Integrity Audit

**Date:** April 17, 2026  
**URL:** https://q1-2026-earnings.vercel.app/  
**Auditor:** Automated integrity check (scheduled task)  
**Prior audit:** April 14, 2026

---

## Executive Summary

The tracker now shows 5 companies as reported (JPM, WFC, GS, C, BLK), all Financials. However, three additional companies have reported earnings since the last audit — **Bank of America (BAC)** on April 15, **Morgan Stanley (MS)** on April 15, and **TSMC (TSM)** on April 16 — but remain in the seed data as "upcoming" with null actuals. Several data errors flagged in the April 14 audit remain unfixed. A new critical issue has been identified: the **seed data JSON file is truncated/corrupted**.

---

## NEW Critical Issues (since April 14 audit)

### 1. earnings-q1-2026.json is truncated — file ends mid-record

The seed file `server/data/seed/earnings-q1-2026.json` (69,648 bytes, 2,336 lines) is truncated mid-way through the COST (Costco) entry. The file ends with `"guidanc` — an incomplete key name. This means the JSON is **not valid** and any re-seeding of the database from this file will fail. The file originally contained ~75 companies but the last ~120 entries are missing or corrupted.

**Severity: Critical** — the seed file, which is the canonical data source, cannot be parsed.

### 2. BAC, MS, and TSM have now reported but are still marked "upcoming"

| Ticker | Report Date | Actual EPS | Actual Revenue | Status in App |
|--------|------------|------------|----------------|---------------|
| BAC | Apr 15 | $1.11 | $30.43B | upcoming (null actuals) |
| MS | Apr 15 | $3.43 | $20.58B | upcoming (null actuals) |
| TSM | Apr 16 | $3.49 (ADR) | $35.90B | upcoming (null actuals) |

These companies have published actual Q1 2026 earnings. The commentary records for BAC, MS, and TSM (flagged as "orphans" in the prior audit) now have legitimate earnings to pair with — but only if their earnings records are updated to "reported" with correct actuals.

**Severity: Critical** — 3 of 8 companies that have actually reported Q1 2026 earnings are missing from the tracker.

---

## Persisting Issues from April 14 Audit (Unfixed)

### 3. Citigroup (C) — EPS and Revenue still wrong

| Field | App Value | Correct Value | Source |
|-------|-----------|---------------|--------|
| eps_actual | 2.85 | **3.06** | Citigroup 8-K, CNBC, GuruFocus |
| revenue_actual | $24.2B | **$24.63B** | Citigroup 8-K |
| eps_surprise_pct | ~8.4% | **~16.3%** | (3.06 − 2.63) / 2.63 |
| eps_growth_yoy | 45.4% | **~56%** | Prior year EPS was $1.96 |

### 4. JPMorgan (JPM) — Guidance direction still wrong

App shows `guidance_direction: "raised"`. JPMorgan **lowered** its full-year 2026 NII guidance from $104.5B to ~$103B. Multiple sources confirm: Seeking Alpha, CNBC, Sherwood News, FinancialContent.

### 5. JPMorgan (JPM) — Revenue actual and YoY still off

| Field | App Value | Correct Value |
|-------|-----------|---------------|
| revenue_actual | $49.8B | **$50.54B** |
| revenue_growth_yoy | 12.3% | **~9.8%** (revenue was up 9.8% YoY per CNBC) |

### 6. Wells Fargo (WFC) — EPS estimate is stale

| Field | App Value | Correct Value |
|-------|-----------|---------------|
| eps_estimate | 1.58 | **1.59** (per GuruFocus: beat $1.59 estimate) |
| revenue_estimate | $21.76B | **$21.77B** |
| revenue_actual | $21.45B | **$21.45B** ✓ (correct) |
| eps_growth_yoy | 26.0% | **~15%** (WFC said EPS increased 15% YoY) |

### 7. Goldman Sachs (GS) — Guidance should not be "raised"

GS did not formally raise guidance. They provided forward quarterly projections showing moderation from Q1 levels ($13.75 EPS for Q2 vs $17.55 in Q1). The guidance_direction should be **"maintained"** or **null**, not "raised."

### 8. "Gross Margin" is still displayed for Financials

Banks do not report gross margin. The app shows gross_margin values (JPM 69.5%, GS 72.3%, C 56.8%, etc.) that are conceptually misleading for financial institutions. This should display efficiency ratio or net interest margin instead.

### 9. Orphan commentary for BAC, MS, TSM, SSNLF

BAC, MS, and TSM have now reported (see Issue #2) — so once their earnings records are updated, these commentaries will be valid. However, **SSNLF (Samsung)** still has 4 commentary records with no reported earnings. Samsung's Q1 2026 earnings have not been released yet (expected late April).

### 10. Vercel SPA routing still broken

The `vercel.json` rewrites only include `/api/(.*)` → `/api`. There is no catch-all rewrite to serve `index.html` for client-side routes. Direct navigation to `/earnings`, `/calendar`, etc. returns Vercel's 404 page.

### 11. Segments nav link still points to unverified page

The Sidebar still includes a "Segments" link. While a SegmentsPage component exists, it's unclear if the backend `/api/segments` endpoints return valid data for reported companies.

### 12. All data still marked "seed" — no live data pipeline

Every record has `data_source: "seed"`. The `.env` banner ("Market data unavailable") persists. No live ingestion appears active.

---

## Aggregate Math Verification (5 reported in DB)

The internal math for the 5 reported companies remains consistent with the (incorrect) underlying data:

| Metric | Expected from Data | Notes |
|--------|-------------------|-------|
| Avg EPS YoY | (17.2 + 26.0 + 24.3 + 45.4 + 45.9) / 5 = 31.76% | Internally consistent |
| Avg Rev YoY | (12.3 + 6.5 + 14.2 + 12.0 + 27.0) / 5 = 14.4% | Internally consistent |
| Guidance | 3 raised, 0 lowered, 2 maintained | JPM should be lowered, GS should be maintained |

The pipeline math is sound — the problem is entirely in the source data inputs.

---

## Summary of All Issues

| # | Issue | Severity | New? |
|---|-------|----------|------|
| 1 | earnings-q1-2026.json is truncated/corrupted | **Critical** | **Yes** |
| 2 | BAC, MS, TSM reported but not updated in tracker | **Critical** | **Yes** |
| 3 | Citigroup EPS/Revenue wrong (2.85 vs 3.06) | **Critical** | No |
| 4 | JPM guidance "raised" should be "lowered" | **Critical** | No |
| 5 | JPM revenue actual and YoY off | **Moderate** | No |
| 6 | WFC EPS YoY still 26% (should be ~15%) | **Moderate** | No |
| 7 | GS guidance should not be "raised" | **Moderate** | No |
| 8 | Gross margin displayed for Financials | **Moderate** | No |
| 9 | SSNLF orphan commentary (BAC/MS/TSM now resolved) | **Minor** | Partial |
| 10 | Vercel SPA routing 404 on refresh | **Moderate** | No |
| 11 | Segments page questionable | **Minor** | No |
| 12 | All data marked "seed", no live pipeline | **Minor** | No |

---

## Systematic Improvements Recommended

1. **Fix the truncated JSON file** — regenerate or repair `earnings-q1-2026.json` so it contains all ~195 companies as valid JSON.

2. **Add newly reported earnings** — BAC ($1.11 EPS, $30.43B rev, Apr 15), MS ($3.43 EPS, $20.58B rev, Apr 15), TSM ($3.49 ADR EPS, $35.90B rev, Apr 16) should be added as "reported" with full actuals.

3. **Correct existing data errors** — Fix C, JPM, WFC, and GS figures per the tables above.

4. **Add SPA rewrite to vercel.json** — Add `{ "source": "/((?!api/).*)", "destination": "/index.html" }` to the rewrites array.

5. **Replace gross margin for Financials** — Show "--" or "N/A" for financial sector companies; use efficiency ratio or NIM if available.

6. **Remove SSNLF commentary** — Samsung hasn't reported; its commentary records are fabricated.

7. **Add a "Last Updated" timestamp** — Every page should show when data was last refreshed.

8. **Add a data validation script** — A pre-deploy check that validates the seed JSON is well-formed and that all "reported" records have non-null actuals.
