# Sense-Check Report: Q1 2026 Earnings Tracker

**Audit Date:** Tuesday, April 14, 2026  
**Source:** https://q1-2026-earnings.vercel.app/  
**Auditor:** Automated integrity check (scheduled task)

---

## Data Integrity Findings

Sorted by severity (Critical → Minor). The tracker displays "Data: Seed" and a "Market data unavailable — configure API keys in .env" banner, confirming it is running on pre-loaded data rather than live feeds. Many of the issues below stem from this root cause.

---

### 1. Goldman Sachs actual EPS is wrong — shows prior-year figure

| | |
|---|---|
| **Slide & element** | Dashboard → Recent Reports → GS row; Earnings table → GS row |
| **Claim on slide** | GS Q1 2026 EPS actual = **$14.12** vs estimate $12.35 (+21.9% YoY) |
| **What I found** | Goldman Sachs' own press release (goldmansachs.com, Apr 13 2026) reports Q1 2026 diluted EPS of **$17.55**, net revenues of $17.2B (second-highest quarter ever), and ROE of 19.8%. The $14.12 figure matches GS's **Q1 2025** EPS. The estimate of $12.35 is also stale — real consensus was ~$16.47. |
| **Severity** | **Critical** — actual EPS is 24% higher than displayed; this cascades into the Technology/Financials sector averages, YoY growth, and beat-rate statistics. |

---

### 2. Bank of America & Morgan Stanley shown as reported, but their earnings date is April 15 (tomorrow)

| | |
|---|---|
| **Slide & element** | Dashboard → Recent Reports → BAC and MS rows; Earnings table (filtered: Reported) |
| **Claim on slide** | BAC: $0.90 vs $0.82 est, Apr 15, BEAT. MS: $2.42 vs $2.21 est, Apr 15, BEAT. |
| **What I found** | BAC's newsroom (stocktitan.net) confirms its Q1 2026 report date is **Wednesday, April 15** — tomorrow. Morgan Stanley is likewise confirmed for April 15 (themarketsdaily.com, barchart.com). Today is April 14. These results do not yet exist. Both companies also appear simultaneously in the "Upcoming Reports" panel for Apr 15, creating a contradiction. |
| **Severity** | **Critical** — fabricated future results are displayed as historical actuals. All BAC/MS figures (EPS, margins, guidance, stock reaction) are unverifiable. |

---

### 3. Consensus EPS estimates are dramatically stale across all 9 companies

| | |
|---|---|
| **Slide & element** | Earnings table → "EPS" estimate column (implied by "v $X.XX" in Recent Reports) |
| **Claim on slide** | See table below |
| **What I found** | Every estimate is significantly below the actual April 2026 sell-side consensus, suggesting the estimates are from a prior year or an early-season placeholder. |
| **Severity** | **Critical** — inflates beat magnitudes and EPS surprise percentages across the board. |

| Ticker | Tracker Estimate | Real Consensus (Apr 2026) | Source | Discrepancy |
|--------|-----------------|--------------------------|--------|-------------|
| JPM | $4.63 | $5.32–$5.50 | Yahoo Finance, Zacks | −15% to −19% |
| WFC | $1.24 | $1.58 | TradingView | −22% |
| C | $1.85 | $2.63–$2.65 | TradingView, Zacks | −30% |
| GS | $12.35 | ~$16.47 | Investing.com | −25% |
| BLK | $9.82 | $11.48–$12.06 | TradingView, Zacks | −15% to −19% |
| BAC | $0.82 | $1.00–$1.01 | FinancialContent | −18% to −19% |
| MS | $2.21 | $2.92–$3.08 | Barchart, Nasdaq | −24% to −28% |
| TSM | $1.82 | $3.26–$3.29 | MarketBeat, Zacks | −44% to −45% |
| SSNLF | $0.42 | Not verified | — | — |

---

### 4. BlackRock report date is wrong (shows Apr 11, actual is Apr 14)

| | |
|---|---|
| **Slide & element** | Dashboard → Recent Reports → BLK row; Earnings table → BLK row |
| **Claim on slide** | BLK reported on **Apr 11** |
| **What I found** | Multiple sources (MarketBeat, TradingView, Zacks) confirm BlackRock's Q1 2026 earnings release is scheduled for **April 14, 2026** (today), before the opening bell — not April 11. |
| **Severity** | **Critical** — report date is wrong by 3 days, meaning the "actual" EPS shown ($10.15) was displayed before results existed. |

---

### 5. TSMC report date is wrong (shows Apr 10, earnings call is Apr 16)

| | |
|---|---|
| **Slide & element** | Dashboard → Recent Reports → TSM row; Earnings table → TSM row |
| **Claim on slide** | TSM reported on **Apr 10** with EPS of $2.12 |
| **What I found** | TSMC's investor relations page (investor.tsmc.com) confirms the Q1 2026 earnings conference is **Thursday, April 16, 2026** at 14:00 Taiwan time. TSMC does release monthly revenue figures, but full EPS results are not published until the earnings call. The tracker shows full earnings data 6 days early. |
| **Severity** | **Critical** — full earnings data displayed before the actual earnings release. |

---

### 6. TSMC EPS estimate is off by ~80%

| | |
|---|---|
| **Slide & element** | Dashboard → Recent Reports → TSM; Earnings table → TSM row |
| **Claim on slide** | TSM estimate = **$1.82**, actual = $2.12, EPS YoY +61.8% |
| **What I found** | The Zacks consensus estimate for TSM Q1 2026 EPS is **$3.29** (MarketBeat, TradingView), implying ~55% YoY growth from ~$2.12 in Q1 2025. The tracker's "actual" of $2.12 appears to be **last year's Q1 2025 result**, and the $1.82 estimate is from an even older period. |
| **Severity** | **Critical** — the displayed actual EPS may be the prior-year figure miscast as the current quarter. This distorts the entire Technology sector's aggregates. |

---

### 7. GS Revenue YoY shown as −7.1%, inconsistent with record-revenue quarter

| | |
|---|---|
| **Slide & element** | Earnings table → GS row → REV YOY column |
| **Claim on slide** | GS Rev YoY = **−7.1%** |
| **What I found** | Goldman Sachs' press release describes Q1 2026 net revenues of $17.2B as "the second highest quarterly level in the Firm's history," beating estimates of $16.95B. A year-over-year revenue *decline* of 7.1% is inconsistent with a near-record quarter. |
| **Severity** | **Moderate** — directionally misleading (shows decline when revenue actually grew). |

---

### 8. "Market data unavailable" banner and Data: Seed indicator

| | |
|---|---|
| **Slide & element** | Global header banner (all pages); Footer → "Data: Seed" |
| **Claim on slide** | "Market data unavailable — configure API keys in .env" |
| **What I found** | This confirms the tracker has no live data connection. All figures are pre-loaded seed data. The "Live Prices" button on the Earnings page is non-functional. There is no "as of" timestamp on any data, so a viewer has no way to assess data freshness. |
| **Severity** | **Moderate** — a client viewing this dashboard may not notice the small footer text and could assume the data is live. |

---

### 9. Season progress rounds 4.6% up to 5%

| | |
|---|---|
| **Slide & element** | Dashboard → Season Progress card |
| **Claim on slide** | 9 / 195, **+5% complete** |
| **What I found** | 9 ÷ 195 = 4.615%. Displaying this as "5%" is aggressive rounding — standard practice would show "~5%" or "4.6%." |
| **Severity** | **Minor** — cosmetic rounding, but could be misleading in a client-facing context. |

---

### 10. Sector charts show only 2 of 11 sectors but titles imply full coverage

| | |
|---|---|
| **Slide & element** | Dashboard → "YoY EPS Growth by Sector" bar chart; "Gross Margin by Sector" bar chart |
| **Claim on slide** | Charts titled "by Sector" but display only Technology and Financials |
| **What I found** | With 9 of 11 sectors showing 0 reports, the charts technically aren't wrong — but the titles imply a comprehensive sector view. A note like "Reported sectors only" or "(2 of 11 reporting)" would set expectations correctly. |
| **Severity** | **Minor** — no factual error, but potentially misleading framing for a casual viewer. |

---

## Summary Table

| # | Slide & Element | Issue | Severity |
|---|----------------|-------|----------|
| 1 | GS EPS actual | Shows $14.12 (Q1 2025); real Q1 2026 is $17.55 | **Critical** |
| 2 | BAC & MS report dates | Show Apr 15 results, but today is Apr 14 | **Critical** |
| 3 | All EPS estimates | 15–45% below real consensus across all 9 names | **Critical** |
| 4 | BLK report date | Shows Apr 11; actual is Apr 14 | **Critical** |
| 5 | TSM report date | Shows Apr 10; earnings call is Apr 16 | **Critical** |
| 6 | TSM EPS estimate & actual | Estimate $1.82 vs real consensus $3.29; actual may be prior-year | **Critical** |
| 7 | GS Rev YoY | Shows −7.1% decline; GS reported near-record revenues | **Moderate** |
| 8 | Data source banner | "Market data unavailable"; no freshness timestamp anywhere | **Moderate** |
| 9 | Season progress % | 9/195 = 4.6%, displayed as 5% | **Minor** |
| 10 | Sector chart titles | "by Sector" titles with only 2 of 11 sectors shown | **Minor** |

---

## Overall Data Freshness Assessment

The tracker is running entirely on **seed/placeholder data** with no live market feed connected (confirmed by the .env banner and "Data: Seed" footer). The core problem is that the seed dataset appears to use **Q1 2025 actual results** and **outdated or prior-year consensus estimates** in place of real Q1 2026 data. This creates a cascade of issues: the 100% beat rate, the uniformly positive stock reactions, and the sector-level aggregates are all artifacts of this stale data rather than reflections of actual Q1 2026 market outcomes.

**Internal math is consistent** — sector/region/segment totals sum correctly, weighted averages check out, and EPS surprise percentages are properly calculated from the (incorrect) inputs. The data *pipeline* logic appears sound; the problem is entirely in the *source data*.

**Recommended next steps:** Connect live data feeds (configure API keys), re-seed with current Q1 2026 consensus estimates, and add a prominent "Last Updated" timestamp visible on every page.
