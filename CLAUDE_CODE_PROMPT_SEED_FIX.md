# Fix Stale Seed Data in Q1 2026 Earnings Tracker

## Context

The earnings tracker at `q1-2026-earnings.vercel.app` is running on **fabricated seed data** that is wrong in almost every case. A data integrity audit (see `Sense Check Report — Q1 2026 Earnings Tracker.md` in this repo) found 6 Critical, 2 Moderate, and 2 Minor issues. This prompt fixes the Critical data issues in the seed file.

## What to change

**File:** `server/data/seed/earnings-q1-2026.json`

This JSON array contains one object per company per quarter. Each "reported" company needs its figures corrected using real Q1 2026 data. The seed file currently has 7 reported companies (JPM, BAC, WFC, GS, MS, C, BLK). Two additional companies (TSM, SSNLF) appear on the live site but are **missing from this JSON entirely** — they must have been added directly to the database. Add them to the JSON so the seed file is the single source of truth.

---

## Company-by-company corrections

Use web search to look up the **actual reported Q1 2026 EPS, revenue, and consensus estimates** for each company below. For every company, find:

- The **actual Q1 2026 EPS** and **actual Q1 2026 revenue** from the company's own press release or earnings report
- The **consensus EPS estimate** and **consensus revenue estimate** as of the day before the report, from a financial data provider (e.g. Zacks, FactSet, Bloomberg, or analyst preview articles)
- The **Q1 2025 actual EPS** and **Q1 2025 actual revenue** (for YoY growth calculation)
- The **Q4 2025 actual EPS** and **Q4 2025 actual revenue** (for QoQ growth calculation)
- The **actual report date** from the company's investor relations page or earnings calendar
- The **stock price reaction** on the day of earnings (day-of % change)

Then compute the derived fields:
- `eps_surprise_pct` = `(eps_actual - eps_estimate) / abs(eps_estimate) * 100`
- `eps_growth_yoy` = `(eps_actual - eps_actual_prior_year) / abs(eps_actual_prior_year) * 100`
- `eps_growth_qoq` = `(eps_actual - eps_actual_prior_quarter) / abs(eps_actual_prior_quarter) * 100`
- Same formulas for revenue variants
- `guidance_direction`: look up whether the company raised, lowered, or maintained full-year guidance

### Companies to fix (all currently marked `"status": "reported"`):

#### 1. GS — Goldman Sachs (HIGHEST PRIORITY)
- **Current seed:** eps_actual 14.12, eps_estimate 12.35, report_date 2026-04-13
- **Known correct:** eps_actual **$17.55**, report_date **2026-04-14** (per goldmansachs.com press release). Revenue was **$17.2B**. The $14.12 is GS's Q1 2025 EPS, not Q1 2026.
- Fix: Update eps_actual, eps_estimate (consensus was ~$16.47), revenue_actual ($17.2B), revenue_estimate (~$16.95B), report_date, and recompute all derived fields. Also fix `revenue_growth_yoy` which currently shows -7.1% despite GS calling it "second-highest quarterly revenue ever."

#### 2. BAC — Bank of America
- **Current seed:** eps_actual 0.90, eps_estimate 0.82, report_date 2026-04-15, status "reported"
- **Issue:** Report date is correct (Apr 15), but the estimate of $0.82 is stale. Real consensus was **~$1.00–$1.01**. Actual results should now be available — look them up.
- Fix: Update eps_estimate, eps_actual (search for real result), all revenue figures, and recompute derived fields.

#### 3. MS — Morgan Stanley
- **Current seed:** eps_actual 2.42, eps_estimate 2.21, report_date 2026-04-15, status "reported"
- **Issue:** Estimate of $2.21 is stale. Real consensus was **~$2.92–$3.08**. Search for actual reported results.
- Fix: Update all figures with real data.

#### 4. JPM — JPMorgan Chase
- **Current seed:** eps_actual 4.91, eps_estimate 4.63, report_date 2026-04-14
- **Issue:** Estimate of $4.63 is stale. Real consensus was **~$5.32–$5.50**. Report date is correct. Search for actual result.
- Fix: Update eps_estimate, eps_actual, revenue figures, and recompute derived fields.

#### 5. WFC — Wells Fargo
- **Current seed:** eps_actual 1.38, eps_estimate 1.24, report_date 2026-04-14
- **Issue:** Estimate of $1.24 is stale. Real consensus was **$1.58**. Search for actual result.
- Fix: Update all figures with real data.

#### 6. C — Citigroup
- **Current seed:** eps_actual 1.96, eps_estimate 1.85, report_date 2026-04-14
- **Issue:** Estimate of $1.85 is stale. Real consensus was **~$2.63–$2.65**. Search for actual result.
- Fix: Update all figures with real data.

#### 7. BLK — BlackRock
- **Current seed:** eps_actual 10.15, eps_estimate 9.82, report_date **2026-04-11**
- **Issue:** Report date is wrong. Real date is **2026-04-14** (confirmed by multiple sources). Estimate of $9.82 is stale; real consensus was **~$11.48–$12.06**. Search for actual result.
- Fix: Update report_date to 2026-04-14, update all EPS/revenue figures with real data.

#### 8. TSM — Taiwan Semiconductor (MUST ADD TO JSON)
- **Not in seed JSON.** Must add a new entry.
- **Current site shows:** eps_actual 2.12, eps_estimate 1.82, report_date 2026-04-10 — all wrong.
- **Reality:** TSMC's Q1 2026 earnings conference is **2026-04-16** (per investor.tsmc.com). Consensus EPS estimate is **~$3.26–$3.29**. 
- Fix: Add a new entry to earnings-q1-2026.json for ticker "TSM". If results are available (post Apr 16), use actuals with status "reported". If not yet available, set status "upcoming" with nulls for actuals and the correct estimate/date.

#### 9. SSNLF — Samsung Electronics (MUST ADD TO JSON)
- **Not in seed JSON.** Must add a new entry.
- **Current site shows:** eps_actual 0.51, eps_estimate 0.42, report_date 2026-04-08 — likely stale.
- Fix: Search for Samsung Electronics Q1 2026 earnings date and results. Add to JSON with correct data. Samsung typically reports preliminary results early in the month and full results later — use the correct date for the full earnings release.

---

## How to verify your work

After updating `server/data/seed/earnings-q1-2026.json`:

1. **Run the seeder:** `npm run seed` (this rebuilds the SQLite database from the JSON)
2. **Validate JSON:** Ensure the file is valid JSON (no trailing commas, matching brackets)
3. **Cross-check math:** For each updated company, verify:
   - `eps_surprise_pct` matches `(eps_actual - eps_estimate) / abs(eps_estimate) * 100`
   - `eps_growth_yoy` matches `(eps_actual - eps_actual_prior_year) / abs(eps_actual_prior_year) * 100`
   - Revenue growth formulas match similarly
4. **Check status logic:** Only companies whose report_date is **on or before today** should have `"status": "reported"`. Companies reporting in the future must have `"status": "upcoming"` with null actuals.
5. **Count check:** The total number of "reported" entries should match the actual number of S&P 500 companies that have reported Q1 2026 earnings as of today.

---

## Important constraints

- **Do not change** the structure of the JSON objects — keep all existing fields. 
- **Do not modify** upcoming companies (ones with `"status": "upcoming"`) unless their `eps_estimate` is also clearly stale — focus on the 9 reported companies above.
- Revenue values are in **raw dollars** (not millions/billions) in this file, e.g. `42500000000` for $42.5B.
- **Cite your sources** in git commit message so we can trace where each number came from.
- After fixing the JSON, run `npm run seed` to rebuild the database.
