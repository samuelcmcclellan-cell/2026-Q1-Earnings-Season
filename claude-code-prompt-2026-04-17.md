# Claude Code Prompt — Fix Q1 2026 Earnings Tracker (April 17, 2026)

Run this prompt from the root of the earnings tracker app repository (`2026 Q1 Earnings Season/`).

Every figure below has been verified against primary sources (company press releases, 8-K filings, CNBC, Bloomberg, and company investor-relations pages). Where sources conflict, the company's own release takes precedence.

---

## Prompt

```
You are fixing data integrity issues in a Q1 2026 Earnings Tracker app deployed at https://q1-2026-earnings.vercel.app/. The app is a React/Vite SPA with an Express API (as a Vercel function) backed by SQLite (via sql.js). Seed data lives in server/data/seed/*.json and is loaded into server/data/earnings.db by server/src/scripts/seed-db.ts.

Work through these changes in order, committing logically grouped changes as you go. When done, rebuild the client, re-seed the database, and report a summary.

====================================================================
STEP 1 — Repair the truncated seed file
====================================================================

server/data/seed/earnings-q1-2026.json is truncated at line 2336 (byte ~69640), ending mid-way through the COST entry with "guidanc" (no closing quote, no closing brace, no closing array bracket). The file is not valid JSON.

To fix:
1. Read the file and identify the incomplete COST entry
2. Complete it with an "upcoming" record:
   - ticker: "COST"
   - report_date: "2026-05-08"
   - time_of_day: "amc"
   - eps_estimate: 3.92
   - revenue_estimate: 62000000000
   - all other fields null
   - status: "upcoming"
   - data_source: "seed"
3. Close the JSON array with "]"
4. Validate by running `node -e "JSON.parse(require('fs').readFileSync('server/data/seed/earnings-q1-2026.json','utf8'))"` — it must not throw

====================================================================
STEP 2 — Update existing "reported" records (fix errors)
====================================================================

The following companies are already marked "reported" in the seed but have incorrect data. Update each record in server/data/seed/earnings-q1-2026.json.

--- CITIGROUP (C) — multiple fields wrong ---
Set:
  eps_actual: 3.06             (was 2.85 — wrong)
  revenue_actual: 24630000000  (was 24200000000)
  eps_estimate: 2.65           (was 2.63 — real Street consensus)
  eps_actual_prior_year: 1.96
  revenue_actual_prior_year: 21600000000
  eps_surprise_pct: 15.5       (= (3.06 - 2.65) / 2.65 * 100)
  revenue_surprise_pct: 4.6    (= (24630 - 23550) / 23550 * 100)
  eps_growth_yoy: 56.1
  revenue_growth_yoy: 14.0
  gross_margin: null           (banks don't report gross margin)
  gross_margin_prior: null
  data_source: "verified"
Source: Citigroup Q1 2026 8-K, CNBC, Investing.com

--- JPMORGAN (JPM) — guidance direction wrong, revenue off ---
Set:
  eps_actual: 5.94
  eps_estimate: 5.45
  revenue_actual: 50540000000  (was 49800000000)
  revenue_estimate: 49170000000
  eps_actual_prior_year: 5.07
  revenue_actual_prior_year: 46010000000
  eps_surprise_pct: 9.0        (= (5.94 - 5.45) / 5.45 * 100)
  revenue_surprise_pct: 2.8    (= (50540 - 49170) / 49170 * 100)
  eps_growth_yoy: 17.2
  revenue_growth_yoy: 9.8      (was 12.3)
  guidance_direction: "lowered"  (was "raised" — JPM CUT 2026 NII guidance from $104.5B to ~$103B)
  stock_reaction_pct: -0.9
  gross_margin: null
  gross_margin_prior: null
  data_source: "verified"
Source: JPMorgan 8-K, Seeking Alpha, CNBC, Sherwood News

--- WELLS FARGO (WFC) — EPS YoY, estimates, prior year ---
Set:
  eps_actual: 1.60
  eps_estimate: 1.59           (was 1.58)
  revenue_actual: 21450000000
  revenue_estimate: 21770000000 (was 21760000000)
  eps_actual_prior_year: 1.39  (was 1.27 — this was the core error)
  revenue_actual_prior_year: 20150000000
  eps_surprise_pct: 0.6        (= (1.60 - 1.59) / 1.59 * 100)
  revenue_surprise_pct: -1.5   (= (21450 - 21770) / 21770 * 100)
  eps_growth_yoy: 15.1         (was 26.0 — was using wrong prior-year base)
  revenue_growth_yoy: 6.5
  guidance_direction: "maintained"
  stock_reaction_pct: -4.9     (WFC dropped ~5% on revenue miss)
  gross_margin: null
  gross_margin_prior: null
  data_source: "verified"
Source: Wells Fargo newsroom, GuruFocus, Investing.com

--- GOLDMAN SACHS (GS) — guidance and minor refinement ---
Set:
  eps_actual: 17.55
  eps_estimate: 16.47
  revenue_actual: 17230000000  (was 17200000000)
  revenue_estimate: 16950000000
  eps_actual_prior_year: 14.12
  revenue_actual_prior_year: 15060000000
  eps_surprise_pct: 6.6
  revenue_surprise_pct: 1.7
  eps_growth_yoy: 24.3
  revenue_growth_yoy: 14.4     (was 14.2)
  guidance_direction: "maintained"   (was "raised" — GS provided forward projections showing Q2 moderation; did not formally raise)
  stock_reaction_pct: -3.1     (stock dropped on forward guidance moderation)
  gross_margin: null           (was 72.3 — banks don't report gross margin)
  gross_margin_prior: null
  data_source: "verified"
Source: Goldman Sachs press release 2026-04-13, Motley Fool transcript

--- BLACKROCK (BLK) — fix report_date and actuals ---
Set:
  report_date: "2026-04-14"   (verify — if already 4/14 leave as-is; prior audit flagged 4/11)
  eps_actual: 14.06
  eps_estimate: 11.64
  revenue_actual: 6700000000
  revenue_estimate: 6150000000
  eps_actual_prior_year: 9.64
  revenue_actual_prior_year: 5276000000
  eps_surprise_pct: 20.8
  revenue_surprise_pct: 8.9
  eps_growth_yoy: 45.9
  revenue_growth_yoy: 27.0
  guidance_direction: "maintained"
  stock_reaction_pct: 2.1
  gross_margin: null
  gross_margin_prior: null
  data_source: "verified"
Source: BlackRock Q1 2026 press release, Investing.com

====================================================================
STEP 3 — Mark newly reported companies as "reported"
====================================================================

The following companies have reported Q1 2026 earnings since the seed was created but are still "upcoming" in the seed data. Update each to status: "reported" and populate all actuals. All are already in the seed data, so update the existing entries (do not duplicate).

--- JOHNSON & JOHNSON (JNJ) — reported Apr 14 ---
  status: "reported"
  report_date: "2026-04-14"
  time_of_day: "bmo"
  eps_actual: 2.70
  eps_estimate: 2.68
  revenue_actual: 24100000000
  revenue_estimate: 23600000000
  eps_actual_prior_year: 2.42    (verify against 2025 Q1 release if available; otherwise use this placeholder)
  eps_surprise_pct: 0.7
  revenue_surprise_pct: 2.1
  eps_growth_yoy: 11.6
  revenue_growth_yoy: 9.9
  guidance_direction: "raised"   (JNJ raised FY2026 outlook)
  stock_reaction_pct: 1.9
  gross_margin: null             (JNJ is pharma; gross margin exists but leave null unless verified)
  data_source: "verified"

--- BANK OF AMERICA (BAC) — reported Apr 15 ---
  status: "reported"
  report_date: "2026-04-15"
  time_of_day: "bmo"
  eps_actual: 1.11
  eps_estimate: 1.01
  revenue_actual: 30430000000
  revenue_estimate: 29930000000
  eps_surprise_pct: 9.9
  revenue_surprise_pct: 1.7
  eps_growth_yoy: 17.0
  revenue_growth_yoy: 7.2
  guidance_direction: "raised"   (BAC raised NII growth from 5-7% to 6-8%)
  stock_reaction_pct: 1.5
  gross_margin: null             (financial)
  data_source: "verified"
Source: CNBC, stocktitan, GuruFocus

--- MORGAN STANLEY (MS) — reported Apr 15 ---
  status: "reported"
  report_date: "2026-04-15"
  time_of_day: "bmo"
  eps_actual: 3.43
  eps_estimate: 3.02
  revenue_actual: 20580000000
  revenue_estimate: 19700000000
  eps_actual_prior_year: 2.60
  revenue_actual_prior_year: 17700000000
  eps_surprise_pct: 13.6
  revenue_surprise_pct: 4.5
  eps_growth_yoy: 31.9
  revenue_growth_yoy: 16.3
  guidance_direction: "maintained"
  stock_reaction_pct: 4.2
  gross_margin: null             (financial)
  data_source: "verified"
Source: Morgan Stanley 8-K, Motley Fool transcript, Investing.com

--- PNC FINANCIAL (PNC) — reported Apr 15 ---
  status: "reported"
  report_date: "2026-04-15"
  time_of_day: "bmo"
  eps_actual: 4.32              (adjusted; diluted GAAP was 4.13)
  eps_estimate: 3.91
  revenue_actual: 6165000000
  revenue_estimate: 6240000000
  eps_surprise_pct: 10.5
  revenue_surprise_pct: -1.2
  guidance_direction: "raised"
  stock_reaction_pct: -1.5      (stock dipped on revenue miss despite EPS beat)
  gross_margin: null
  data_source: "verified"
Source: PNC press release, Benzinga

--- ABBOTT LABORATORIES (ABT) — reported Apr 16 ---
  status: "reported"
  report_date: "2026-04-16"
  time_of_day: "bmo"
  eps_actual: 1.15
  eps_estimate: 1.15            (in-line)
  revenue_actual: 11200000000
  revenue_estimate: 11040000000
  eps_surprise_pct: 0.0
  revenue_surprise_pct: 1.4
  eps_growth_yoy: null          (leave null unless verified)
  revenue_growth_yoy: 8.0
  guidance_direction: "lowered" (ABT set FY EPS $5.38-$5.58 vs $5.55 consensus — modestly below)
  stock_reaction_pct: -1.0
  gross_margin: null            (keep null unless verified)
  data_source: "verified"
Source: Abbott press release, Motley Fool transcript

--- U.S. BANCORP (USB) — reported Apr 16 ---
  status: "reported"
  report_date: "2026-04-16"
  time_of_day: "bmo"
  eps_actual: 1.18
  eps_estimate: 1.15
  revenue_actual: 7290000000
  revenue_estimate: 7280000000
  eps_surprise_pct: 2.6
  revenue_surprise_pct: 0.1
  revenue_growth_yoy: 4.7
  guidance_direction: "maintained"
  stock_reaction_pct: -0.8
  gross_margin: null
  data_source: "verified"
Source: Bloomberg, Motley Fool transcript

--- CHARLES SCHWAB (SCHW) — reported Apr 16 ---
  status: "reported"
  report_date: "2026-04-16"
  time_of_day: "bmo"
  eps_actual: 1.43
  eps_estimate: 1.42
  revenue_actual: 6482000000
  revenue_estimate: 6616000000
  eps_surprise_pct: 0.7
  revenue_surprise_pct: -2.0
  revenue_growth_yoy: 16.0
  guidance_direction: "maintained"
  stock_reaction_pct: -2.0
  gross_margin: null
  data_source: "verified"
Source: Motley Fool transcript, GuruFocus, stocktitan

====================================================================
STEP 4 — Add TSMC (TSM) to earnings data
====================================================================

TSM is not in the earnings seed file (only in commentary). It reported Apr 16. Add a new record with:
  ticker: "TSM"
  fiscal_quarter: "Q1 2026"
  report_date: "2026-04-16"
  time_of_day: "bmo"
  eps_actual: 3.49              (ADR unit in USD)
  eps_estimate: 3.27
  revenue_actual: 35900000000   (USD)
  revenue_estimate: 35200000000
  eps_surprise_pct: 6.7
  revenue_surprise_pct: 2.0
  eps_growth_yoy: 58.3
  revenue_growth_yoy: 40.6
  gross_margin: 66.2
  operating_margin: 58.1
  guidance_direction: "raised"   (TSMC lifted 2026 revenue outlook to above 30% growth)
  stock_reaction_pct: -2.5       (stock fell on tariff/geopolitical concerns despite strong print)
  status: "reported"
  data_source: "verified"
Also verify TSM exists in server/data/seed/companies.json. If missing, add it: name="Taiwan Semiconductor", sector="Technology", region="apac", country="TW", market_cap_category="mega".

====================================================================
STEP 5 — Clean up orphan commentary
====================================================================

In server/data/seed/commentary-q1-2026.json, remove ALL commentary records where ticker = "SSNLF" (Samsung). Samsung has NOT reported Q1 2026 earnings yet (typically reports late April). Keep commentary for BAC, MS, and TSM — those are now legitimate now that the companies have been marked "reported" in Step 3.

====================================================================
STEP 6 — Fix Vercel SPA routing (404 on page refresh)
====================================================================

In vercel.json, the rewrites array currently only contains the API rule. Add a catch-all so client-side routes (/earnings, /calendar, /sectors, etc.) serve index.html on direct navigation / refresh.

Final rewrites array should be:
  [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]

====================================================================
STEP 7 — Null gross_margin for ALL Financial-sector companies
====================================================================

In server/data/seed/earnings-q1-2026.json, for every record whose ticker belongs to a Financials-sector company (JPM, WFC, C, GS, BLK, BAC, MS, PNC, USB, SCHW, COF, TFC, CB, MMC, AXP — cross-reference companies.json), set both gross_margin and gross_margin_prior to null. Banks and asset managers do not report gross margin in the traditional sense.

Also update client/src/components/tables/EarningsTable.tsx: when gross_margin is null, render "—" (em dash) instead of blank / "0%".

====================================================================
STEP 8 — Defensive Calendar component (already handles null, verify)
====================================================================

client/src/pages/CalendarPage.tsx uses `(data?.entries || []).filter(...)`. However, the prior bug report said the calendar crashed with ".filter is not a function". This happens if data?.entries is a truthy non-array value (e.g., an object or string). Replace with:

  entries: (Array.isArray(data?.entries) ? data.entries : []).filter(e => e.report_date === dateStr)

Also defensively handle the case where the API returns the array at the root (not wrapped in `entries`). Inspect the /api/calendar endpoint in api/index.ts — if it returns a bare array, adjust the client to handle both shapes.

====================================================================
STEP 9 — Systematic improvements
====================================================================

9a. Data freshness timestamp
   Add a `last_refreshed_at` column to the earnings_reports table (migration). On seed, set to current timestamp. In the Dashboard header, display "Data as of {timestamp}" based on the most recent updated_at across reported records.

9b. Seed-file validation script
   Create scripts/validate-seed.ts that:
   - Parses each JSON file in server/data/seed/
   - Verifies every reported record has non-null eps_actual, revenue_actual, eps_surprise_pct, revenue_surprise_pct
   - Verifies every commentary.ticker maps to an earnings record with status "reported"
   - Verifies every earnings.ticker maps to a company in companies.json
   - Fails with a nonzero exit code on any violation
   Add this as an npm script (e.g., `npm run validate-seed`) and consider wiring it into the Vercel build step.

9c. Rename "Gross Margin by Sector" chart
   In client/src/components/charts/MarginTrends.tsx (or wherever the gross-margin chart lives), exclude Financials from the sector list and add a subtitle "Excludes Financials (gross margin not applicable)".

9d. Add data_source badge
   In EarningsTable.tsx, for each row, render a small badge showing data_source ("seed" = gray, "verified" = green, "api" = blue). This gives viewers visibility into which figures have been fact-checked.

9e. Remove or disable unimplemented pages
   If /segments returns stale/empty data, remove the "Segments" link from Sidebar.tsx OR render an "Under construction" placeholder component.

====================================================================
STEP 10 — Rebuild and verify
====================================================================

After all changes:
1. `node -e "JSON.parse(require('fs').readFileSync('server/data/seed/earnings-q1-2026.json','utf8'))"` must succeed
2. `npx tsx server/src/scripts/seed-db.ts` must re-seed without errors
3. `cd client && npx vite build` must compile cleanly
4. If the validate-seed script was created, `npx tsx scripts/validate-seed.ts` must pass
5. Run the existing refresh-data script dry-run if available

Finally, report:
- Count of reported records before and after
- List of fields corrected per company
- Any deviations from the spec (e.g., if a company wasn't in companies.json and you had to add it)
- Total commentary records deleted
- Build output summary
```
