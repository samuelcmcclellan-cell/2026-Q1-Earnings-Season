# Claude Code Prompt — Fix Q1 2026 Earnings Tracker

Run this prompt from the root of the earnings tracker app repository.

---

## Prompt

```
I need you to fix several bugs and data integrity issues in this Q1 2026 Earnings Tracker app. The app is deployed at https://q1-2026-earnings.vercel.app/ and is a React (Vite) SPA with a backend API. Here's what needs to be done, in priority order:

### 1. Fix Vercel SPA routing (404 on page refresh)

Direct navigation to routes like /earnings, /calendar, /segments returns Vercel's 404 page because there are no server-side rewrites. 

Add or update `vercel.json` in the project root with a catch-all rewrite:

{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}

This should rewrite all non-API routes to index.html so React Router can handle them client-side.

### 2. Fix the Calendar page crash

The Calendar page (/calendar) crashes with: `TypeError: .filter is not a function` inside a useMemo hook. The `/api/calendar` endpoint returns valid data, but the component appears to receive a value it doesn't expect (likely null or an object instead of an array). 

Find the Calendar component and:
- Add a defensive check: if the data isn't an array, default to `[]`
- The pattern is likely something like `(data?.something || []).filter(...)` where `data?.something` resolves to a non-array truthy value. Fix the nullish coalescing or add `Array.isArray()` checks.

### 3. Fix incorrect earnings data for Citigroup (C)

In the seed data (likely a JSON file, database seed, or migration), find the Citigroup Q1 2026 earnings record and update:
- `eps_actual`: change from 2.85 to **3.06**
- `revenue_actual`: change from 24200000000 to **24630000000**
- `eps_surprise_pct`: recalculate — (3.06 - 2.63) / 2.63 * 100 = **16.3**
- `revenue_surprise_pct`: recalculate — (24630000000 - 23500000000) / 23500000000 * 100 = **4.8**
- `eps_growth_yoy`: update to **56.1** (prior year EPS was $1.96, now $3.06)
- `revenue_growth_yoy`: update to **14.0** (prior year rev was ~$21.6B)

### 4. Fix JPMorgan (JPM) guidance direction

In the seed data, find the JPMorgan Q1 2026 earnings record and change:
- `guidance_direction`: from "raised" to **"lowered"**

JPMorgan lowered its full-year NII guidance from $104.5B to ~$103B.

### 5. Fix Wells Fargo (WFC) EPS YoY growth

In the seed data for WFC Q1 2026:
- `eps_actual_prior_year`: change from 1.27 to **1.39**
- `eps_growth_yoy`: change from 26.0 to **15.1** ((1.60 - 1.39) / 1.39 * 100)

### 6. Fix JPMorgan revenue YoY

In the seed data for JPM Q1 2026:
- `revenue_growth_yoy`: change from 12.3 to **10.0**
- `revenue_actual_prior_year`: update to reflect ~$45,270,000,000

### 7. Remove orphan commentary records

Delete commentary records for tickers that don't have a corresponding earnings record with status "reported". Specifically, remove all commentary for: BAC, MS, SSNLF, TSM. These companies have NOT reported Q1 2026 earnings yet, so they should not have commentary in the system.

Alternatively, add a database constraint or validation check in the commentary insertion logic that requires a matching reported earnings record to exist before commentary can be added.

### 8. Hide or remove the Segments nav link

The Segments page is unimplemented. Either:
- Remove the "Segments" link from the sidebar navigation entirely, OR
- Add a "Coming Soon" placeholder page at the /segments route

### 9. Update Goldman Sachs EPS estimate

In the seed data for GS Q1 2026:
- `eps_estimate`: change from 16.47 to **16.30**
- `eps_surprise_pct`: recalculate — (17.55 - 16.30) / 16.30 * 100 = **7.7**

### 10. Replace "Gross Margin" with appropriate metrics for Financials

For companies in the Financials sector, "Gross Margin" is not a standard metric. In the earnings table and sector views:
- For Financials: rename or replace the gross_margin column with "Efficiency Ratio" or "Net Interest Margin" if that data is available
- If no alternative data exists, show "--" for the gross margin column for Financials rather than displaying a misleading number
- Non-financial sectors can keep gross margin as-is

After making all changes, run the build to make sure everything compiles, and run any existing tests.
```
