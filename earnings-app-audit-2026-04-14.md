# Q1 2026 Earnings Tracker — Data Integrity Audit

**Date:** April 14, 2026  
**URL:** https://q1-2026-earnings.vercel.app/  
**Status:** 5 of 195 companies reported (Financials only: JPM, WFC, C, BLK, GS)

---

## Critical Data Errors

### 1. Citigroup (C) — EPS and Revenue are wrong
The app shows EPS of **$2.85** but the actual reported EPS is **$3.06** (per Citigroup's 8-K filing and CNBC). Revenue in the app is **$24.2B** vs actual **$24.63B**. This cascades into incorrect EPS surprise (app: +8.4%, should be ~+16.3%), incorrect EPS YoY (app: +45.4%, should be ~+56%), and incorrect Rev YoY (app: +12%, should be ~+14%).

### 2. JPMorgan (JPM) — Guidance direction is wrong
The app marks JPM guidance as **"RAISED"**, but JPMorgan actually **lowered** its full-year 2026 NII guidance from $104.5B to ~$103B. This error also corrupts the dashboard's net guidance count (+3 raised should be +2) and the sector's "60% raised" figure.

### 3. Wells Fargo (WFC) — EPS YoY growth is wrong
The app shows EPS YoY of **+26.0%**, but WFC reported diluted EPS increased **~15% year-over-year**. The app's prior-year EPS figure ($1.27) appears to be incorrect; actual prior-year was closer to $1.39.

### 4. Calendar page crashes
Navigating to /calendar produces a blank screen. Console shows: `TypeError: .filter is not a function` in a `useMemo` hook. The underlying data from `/api/calendar` returns valid JSON, so the bug is in the frontend component that processes the calendar response.

### 5. Orphan commentary data
Four tickers have commentary entries but NO corresponding reported earnings: **BAC**, **MS**, **SSNLF**, **TSM**. This means the Themes page inflates its narrative counts with data from companies that haven't officially reported. Commentary should only exist for companies with `status: "reported"`.

---

## Moderate Issues

### 6. JPM Revenue YoY is off
App shows +12.3% but real YoY revenue growth was approximately +10% (revenue rose to $49.8B from ~$45.3B).

### 7. GS EPS estimate slightly off
App has $16.47 consensus estimate; real consensus was closer to $16.30.

### 8. "Gross Margin" is a misleading metric for banks
The app displays gross margin for Financials (JPM 69.5%, GS 72.3%, etc.), but banks do not report gross margin in the traditional sense. Banks report net interest margin, efficiency ratio, and return on equity. Showing a "gross margin" figure for financial companies is conceptually incorrect and potentially misleading.

### 9. Segments page is non-functional
The nav link for "Segments" exists but clicking it either returns a 404 (direct URL) or redirects to the Dashboard (client-side nav). The route/page appears incomplete or unimplemented.

---

## Minor Issues

### 10. Market data API not configured
Banner reads "Market data unavailable – configure API keys in .env". The `/api/market/quotes` endpoint returns 404.

### 11. All data marked as "seed"
Every earnings record has `data_source: "seed"`, and the footer shows "Data: Seed". No live data ingestion pipeline appears to be active.

### 12. Direct URL navigation returns 404
Navigating directly to routes like `/earnings` or `/segments` returns Vercel's 404 page. The app uses client-side routing (React Router) but lacks server-side route rewrites in the Vercel config, so refreshing any page other than `/` will fail.

---

## Dashboard Aggregate Verification

The aggregate math is internally consistent given the (incorrect) underlying data:

| Metric | App Value | Computed from 5 records | Match? |
|--------|-----------|------------------------|--------|
| EPS YoY Growth | +31.8% | (17.2+26+45.4+45.9+24.3)/5 = 31.76% | Yes |
| Rev YoY Growth | +14.4% | (12.3+6.5+12+27+14.2)/5 = 14.4% | Yes |
| Avg Stock Rxn | +0.6% | (2.5-1.7+1.8+3.8-3.5)/5 = 0.58% | Yes |
| EPS Beat Rate | 100% | 5/5 = 100% | Yes |
| Net Guidance | +3 | 3 raised, 0 lowered, 2 maintained | Yes* |

*Guidance count is internally consistent but JPM's direction is wrong (see Critical #2).

---

## Systematic Improvements Recommended

1. **Add a data validation layer** that cross-checks seeded/imported earnings against a reference source (e.g., SEC EDGAR filings, financial data API) before marking records as "reported."

2. **Add server-side route rewrites** in `vercel.json` so all routes serve `index.html` (standard SPA rewrite rule), fixing the 404-on-refresh problem.

3. **Fix the Calendar component** — the `.filter()` crash suggests the component expects an array but receives an object or null. Add defensive type-checking or default to an empty array.

4. **Enforce referential integrity** between commentary and earnings — commentary should only be insertable for tickers that have a corresponding reported earnings record.

5. **Replace "Gross Margin" with sector-appropriate metrics** — for Financials, show efficiency ratio or net interest margin instead. The gross margin concept can remain for non-financial sectors.

6. **Remove or gate the Segments page** until it's implemented, rather than leaving a dead nav link.

7. **Add a data freshness indicator** that shows when each record was last updated and whether it's been verified against a primary source.
