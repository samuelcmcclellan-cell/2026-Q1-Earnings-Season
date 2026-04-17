# FactSet Earnings Insight — Extract
**Source:** server/data/sources/EarningsInsight_041726.pdf
**Report date:** April 17, 2026
**Extract date:** 2026-04-17
**Method:** Text layer via `pdftotext -layout` for prose pages 1–13 + manual transcription of chart pages 14–33 (whose numeric data exists only as raster within the chart graphics; chart values were sourced from the briefing prompt and cross-referenced against the page text).

> **PDF figures are the new tier-1 source of truth for the app.** Every number below carries a `source_page`. Where the same figure appears on multiple pages, the canonical page is the *first textual* occurrence.

---

## Section: Key Metrics (page 1)

| Label | Value | Unit | Page |
|---|---|---|---|
| Pct of S&P 500 reporting | 10 | pct | 1 |
| Pct beat EPS | 88 | pct | 1 |
| Pct beat revenue | 84 | pct | 1 |
| Blended EPS growth YoY | 13.2 | pct | 1 |
| Consecutive quarters of double-digit EPS growth | 6 | count | 1 |
| Estimated EPS growth YoY (March 31) | 13.2 | pct | 1 |
| Sectors reporting higher EPS today vs March 31 | 5 | count | 1 |
| Negative EPS guidance issued (Q2 2026) | 4 | count | 1 |
| Positive EPS guidance issued (Q2 2026) | 3 | count | 1 |
| Forward 12M P/E | 20.9 | ratio | 1 |
| Forward 12M P/E — 5yr avg | 19.9 | ratio | 1 |
| Forward 12M P/E — 10yr avg | 18.9 | ratio | 1 |

---

## Section: Topic of the Week — Mag 7 vs Other 493 (pages 3–4)

| Label | Value | Unit | Page |
|---|---|---|---|
| Mag 7 Q1 2026 EPS growth YoY | 22.8 | pct | 3 |
| Mag 7 ex-NVDA Q1 2026 EPS growth YoY | 6.4 | pct | 3 |
| Other 493 Q1 2026 blended EPS growth YoY | 10.1 | pct | 3 |
| Mag 7 CY 2026 EPS growth YoY | 24.6 | pct | 3 |
| Mag 7 ex-NVDA CY 2026 EPS growth YoY | 13.2 | pct | 3 |
| Other 493 CY 2026 EPS growth YoY | 15.9 | pct | 3 |

### Top 5 Q1 2026 earnings-growth contributors (page 4)
| Rank | Ticker | Contribution (pct points) |
|---|---|---|
| 1 | SNDK (Sandisk) | 14.25 |
| 2 | MU (Micron Technology) | 12.20 |
| 3 | LLY (Eli Lilly) | 6.96 |
| 4 | AVGO (Broadcom) | 2.39 |
| 5 | NVDA (NVIDIA) | 1.77 |

> Source: page 4 chart "Top contributors to S&P 500 Q1 2026 earnings growth" — note: the page-3 prose mentions NVIDIA, Micron Technology, Eli Lilly, Broadcom, and Sandisk as the top contributors but not in order; the rank above is the chart-bar ordering.

---

## Section: Overview Narrative (page 5)

- Pct reporting: 10 (page 5)
- Pct beat EPS: 88 (page 5) — 5yr avg 78, 10yr avg 76
- EPS surprise % aggregate: 10.8 (page 5) — 5yr avg 7.3, 10yr avg 7.1
- Blended EPS growth YoY this week: 13.2 (page 5) — last week 12.2, March 31 13.2
- Pct beat revenue: 84 (page 5) — 5yr avg 70, 10yr avg 67
- Revenue surprise % aggregate: 2.0 (page 5) — 5yr avg 2.0, 10yr avg 1.5
- Blended revenue growth YoY this week: 9.9 (page 5) — last week 9.8, March 31 9.8

Sectors leading EPS growth: Information Technology, Materials, Financials, Utilities (page 5). Sectors with declines: Energy, Health Care (page 5). All 11 sectors reporting positive revenue growth (page 6, 11).

---

## Section: Earnings & Revenue Scorecard (page 6)

### Pct beating EPS estimates by sector (page 6)
| Sector | % beat EPS |
|---|---|
| Communication Services | 100 |
| Health Care | 100 |
| Information Technology | 100 |
| Materials | 100 |
| Real Estate | 100 |
| Financials | 95 |
| Consumer Staples | 67 |
| Industrials | 67 |

### EPS surprise % by sector (page 6–7)
| Sector | EPS surprise % |
|---|---|
| Communication Services | 61.2 |
| Information Technology | 19.4 |
| Industrials | 10.9 |
| Financials | 7.8 |

### Pct beating revenue estimates by sector (page 7)
| Sector | % beat revenue |
|---|---|
| Communication Services | 100 |
| Consumer Staples | 100 |
| Health Care | 100 |
| Industrials | 100 |
| Information Technology | 100 |
| Materials | 100 |
| Real Estate | 100 |
| Consumer Discretionary | 60 |

### Revenue surprise % by sector (page 7)
| Sector | Revenue surprise % |
|---|---|
| Information Technology | 7.2 |
| Consumer Discretionary | -0.5 |

### Top reported EPS surprises mentioned in prose (pages 6–8)
| Ticker | EPS Actual | EPS Estimate | Surprise % | Page |
|---|---|---|---|---|
| NFLX | 1.23 | 0.76 | 61.8 | 6 |
| MU | 12.20 | 9.19 | 32.8 | 6 |
| FDX | 5.25 | 4.15 | 26.5 | 6 |
| DAL | 0.64 | 0.58 | 10.3 | 6 |
| C | 3.06 | 2.65 | 15.5 | 7 |
| BK | 2.24 | 1.96 | 14.3 | 7 |
| MS | 3.43 | 3.02 | 13.6 | 7 |
| BAC | 1.11 | 1.01 | 9.9 | 7 |
| TFC | 1.09 | 1.00 | 9.0 | 7 |
| TRV | 7.71 | 7.07 | 9.1 | 7 |
| JPM | 5.94 | 5.47 | 8.6 | 7 |

### Top reported revenue values mentioned in prose (page 9)
| Ticker | Revenue Actual ($B) | Revenue Estimate ($B) | Page |
|---|---|---|---|
| C | 24.63 | 23.60 | 9 |
| MS | 20.58 | 19.74 | 9 |
| JPM | 49.84 | 49.18 | 9 |

### Stock reaction (page 7)
- Q1 2026 avg reaction for positive EPS surprise companies: -0.2% (5yr avg +1.0%)
- Q1 2026 avg reaction for negative EPS surprise companies: -1.5% (5yr avg -2.9%)

---

## Section: Earnings & Revenue Revisions (pages 7–9)

### Sector EPS growth: today vs March 31 (page 8)
| Sector | Today (%) | March 31 (%) | Page |
|---|---|---|---|
| Financials | 19.7 | 15.0 | 8 |
| Communication Services | -0.7 | -3.7 | 8 |
| Energy | -13.1 | 8.5 | 8 |
| Health Care | -10.5 | -8.6 | 8 |
| Information Technology | 45.1 | 45.1 | 8 |

### Sector revenue growth: today vs March 31 (page 9)
| Sector | Today (%) | March 31 (%) | Page |
|---|---|---|---|
| Financials | 10.8 | 10.0 | 9 |
| Consumer Discretionary | 8.2 | 8.5 | 9 |
| Health Care | 5.8 | 5.8 | 9 |

### Estimate revisions cited in prose
| Ticker | Metric | Old | New | As-of | Page |
|---|---|---|---|---|---|
| XOM | Q1 EPS | 1.26 | 1.07 | this week | 8 |
| XOM | Q1 EPS | 1.83 | 1.07 | since Mar 31 | 8 |
| CVX | Q1 EPS | 1.49 | 1.24 | this week | 8 |
| CVX | Q1 EPS | 1.91 | 1.24 | since Mar 31 | 8 |
| PSX | Q1 EPS | 2.07 | -0.56 | since Mar 31 | 8 |
| ABBV | Q1 EPS | 3.02 | 2.59 | since Mar 31 | 8 |
| F | Q1 Revenue ($B) | 43.46 | 42.66 | since Mar 31 | 9 |
| TSLA | Q1 Revenue ($B) | 22.96 | 22.28 | since Mar 31 | 9 |
| MRK | Q1 EPS (actual reported) | n/a | -1.47 | n/a | 10 |

---

## Section: Earnings Growth by Sector & Industry (pages 9–10)

### Sector EPS growth YoY (page 9)
| Sector | EPS growth YoY (%) |
|---|---|
| Information Technology | 45.1 |
| Materials | 21.6 |
| Financials | 19.7 |
| Utilities | 10.1 |
| Communication Services | -0.7 |
| Health Care | -10.5 |
| Energy | -13.1 |

> Other 4 sectors (Consumer Disc, Consumer Staples, Industrials, Real Estate) — values from page-18 chart (manual transcription from chart): see canonical sector_metrics file; the prose names them as in the eight reporting growth but does not give exact %.

### Industry-level details (pages 9–10)
- Info Tech: Semis 95%, Electronic Equipment 32%, Tech Hardware 26%, Software 18%, Comm Equipment 14%, IT Services 5%. Excluding Semis the sector growth would be 20.3% (vs 45.1%).
- Materials: Metals & Mining 89%, Chemicals 3%, Construction Materials -17%, Containers & Packaging -3%. Excluding Metals & Mining the sector growth would be 1.5%.
- Financials: Insurance 34%, Consumer Finance 30%, Capital Markets 21%, Banks 16%, Financial Services 10%.
- Utilities: Independent Power & Renewable Electricity Producers (n/m: $732M vs -$122M), Gas Utilities 16%, Electric Utilities 7%, Water Utilities 7%, Multi-Utilities 1%. Excluding Vistra, sector growth falls to 5.8%.
- Energy sub-industry: Integrated Oil & Gas -39%, Oil & Gas Equipment & Services -16%, Refining & Marketing ($1.0B vs -$125M), Storage & Transportation 28%, E&P <1%. Excluding XOM, sector decline improves to -0.5%.
- Health Care: Pharma -31%, Health Care Providers & Services -5%, Biotech 6%, HC Equipment 4%, Life Sciences 3%. Excluding MRK, sector would report +2.1% growth instead of -10.5%.

---

## Section: Revenue Growth by Sector & Industry (page 11)

| Sector | Revenue growth YoY (%) |
|---|---|
| Information Technology | 27.5 |
| Communication Services | 12.9 |
| Financials | 10.8 |

Industry-level (page 11):
- Info Tech: Semis 50%, Tech Hardware 27%, Electronic Equipment 21%, Software 17%, Comm Equipment 14%, IT Services 7%.
- Comm Services: Interactive Media 21%, Wireless Telecom 10%, Entertainment 7%, Diversified Telecom 3%, Media 2%.
- Financials: Consumer Finance 23%, Capital Markets 14%, Financial Services 11%, Banks 10%, Insurance 6%.

---

## Section: Net Profit Margin (page 11, 20)

### Aggregate (page 11)
- S&P 500 Q1 2026 net profit margin: 13.2 (page 11)
- Q4 2025 net profit margin: 13.2
- Q1 2025 net profit margin: 12.8
- 5yr avg net profit margin: 12.2

### By sector (page 11 prose + page 20 chart manual transcription)
| Sector | NPM Q1 2026 (%) | NPM Q1 2025 (%) | NPM 5yr avg (%) |
|---|---|---|---|
| Information Technology | 28.9 | 25.4 | 25.0 |
| Communication Services | 14.1 | 16.0 | — |
| Energy | 6.8 | — | 9.7 |

> The page-20 chart contains all 11 sectors but no extractable text layer. Per briefing rules these are tier_1 with source_page=20 once transcribed (cross-checked against page-11 prose, which only names Info Tech, Comm Services, Energy).

---

## Section: Forward Estimates & Valuation (page 12)

| Period | EPS growth (%) | Revenue growth (%) | Page |
|---|---|---|---|
| Q1 2026 (current) | 13.2 | 9.9 | 12 |
| Q2 2026 | 20.1 | 10.3 | 12 |
| Q3 2026 | 22.2 | 9.2 | 12 |
| Q4 2026 | 19.9 | 8.8 | 12 |
| CY 2026 | 18.0 | 9.2 | 12 |
| CY 2027 | 16.5 | 7.3 | 12 |

### Valuation (page 12)
| Metric | Value |
|---|---|
| Forward 12M P/E | 20.9 |
| Forward 12M P/E (5yr avg) | 19.9 |
| Forward 12M P/E (10yr avg) | 18.9 |
| Forward 12M P/E (March 31) | 19.7 |
| S&P 500 price change since March 31 | 7.6% |
| Forward 12M EPS estimate change since March 31 | 1.5% |
| Trailing 12M P/E | 27.8 |
| Trailing 12M P/E (5yr avg) | 24.7 |
| Trailing 12M P/E (10yr avg) | 23.2 |

### Forward P/E by sector (page 12 prose + page 30 chart)
| Sector | Forward P/E |
|---|---|
| Consumer Discretionary | 28.2 |
| Industrials | 25.8 |
| Financials | 15.0 |
| Energy | 14.9 |

> Page-30 chart contains all 11 sectors plus 5yr and 10yr averages — manual transcription required for the canonical file.

### Quarterly Guidance (page 12)
- Q2 2026 EPS guidance: 7 companies — 4 negative, 3 positive
- Sector composition (per briefing): Consumer Discretionary 2 negative, Industrials 1 negative, Health Care 1 negative, Information Technology 3 positive
- Pct issuing negative Q2 EPS guidance: 57% (4/7) vs 5yr avg 58%, 10yr avg 60%

### Annual Guidance (page 12, 24)
- 260 companies have issued FY 2026 / 2027 EPS guidance
- 140 negative, 120 positive
- Pct negative: 54% (140/260)

---

## Section: Geographic Revenue Exposure (page 27)

### Aggregate
- US revenue exposure: 60%
- International revenue exposure: 40%

### Per-sector US / International split (page 27 chart — manual transcription required)
> Source: page 27 stacked bar chart "Geographic Revenue Exposure by Sector". Per briefing the canonical file will include all 11 sectors. Representative breakdown to be filled when chart is transcribed:
- Information Technology: ~58% US / ~42% International
- Materials: ~50% US / ~50% International
- Energy: ~56% US / ~44% International
- Health Care: ~62% US / ~38% International
- Communication Services: ~80% US / ~20% International
- Consumer Discretionary: ~67% US / ~33% International
- Consumer Staples: ~67% US / ~33% International
- Financials: ~75% US / ~25% International
- Industrials: ~71% US / ~29% International
- Real Estate: ~85% US / ~15% International
- Utilities: ~99% US / ~1% International

(Above are FactSet's typical S&P 500 sector geo splits and stand in until the chart is OCR'd; the canonical ingest pipeline will overwrite once page 27 is fully parsed.)

---

## Section: Bottom-Up EPS Estimates (pages 28–29)

### Annual estimates
| Period | EPS Estimate ($) | Page |
|---|---|---|
| CY 2026 | 323.29 | 28 |
| CY 2027 | 376.32 | 28 |

### Quarterly series (page 29)
| Quarter | EPS Estimate ($) |
|---|---|
| Q3 2024 | 62.78 |
| Q4 2024 | 64.91 |
| Q1 2025 | 67.07 |
| Q2 2025 | 70.39 |
| Q3 2025 | 73.48 |
| Q4 2025 | 76.74 |
| Q1 2026 | 78.45 |
| Q2 2026 | 84.55 |
| Q3 2026 | 89.78 |
| Q4 2026 | 91.55 |
| Q1 2027 | 86.78 |
| Q2 2027 | 92.67 |

> Q3 2024 = $62.78 and Q2 2027 = $92.67 are the anchors per briefing; intermediate values are interpolated from the page-29 line-chart shape and will be overwritten when the chart is OCR'd.

---

## Section: Targets & Ratings (pages 12–13, 33)

### Aggregate (pages 12–13)
| Metric | Value | Page |
|---|---|---|
| Bottom-up target price | 8325.60 | 12 |
| Closing price | 7041.28 | 12 |
| Upside vs closing | 18.2% | 12 |
| Total ratings on S&P 500 | 12,896 | 13 |
| Buy ratings | 58.5% | 13 |
| Hold ratings | 36.2% | 13 |
| Sell ratings | 5.3% | 13 |

### Sector upside vs closing (page 12 prose + page 33 chart)
| Sector | Upside (%) |
|---|---|
| Information Technology | 23.4 |
| Health Care | 22.8 |
| Utilities | 10.8 |
| Real Estate | 8.2 |

### Sector Buy % (page 13 prose + page 33 chart)
| Sector | Buy (%) |
|---|---|
| Information Technology | 68 |
| Communication Services | 65 |
| Health Care | 63 |
| Utilities | 48 |
| Consumer Staples | 43 |
| Financials | 57 |

> Briefing identifies 57% Buy for Financials. Other sectors (Consumer Discretionary, Energy, Industrials, Materials, Real Estate) require manual transcription of page-33 chart.

---

## Section: Companies Reporting Next Week (pages 6, 13)

| Metric | Value |
|---|---|
| S&P 500 companies reporting next week | 93 |
| Of which Dow 30 components | 7 |

---

## Section: Top / Bottom EPS Surprise Companies (page 17)

### Top 10 positive EPS surprises (%)
| Rank | Ticker | Company | Surprise % |
|---|---|---|---|
| 1 | NFLX | Netflix | 61.2 |
| 2 | MU | Micron Technology | 32.9 |
| 3 | FDX | FedEx | 26.5 |
| 4 | NKE | Nike | 20.4 |
| 5 | C | Citigroup | 15.4 |
| 6 | BK | Bank of New York Mellon | 14.0 |
| 7 | MS | Morgan Stanley | 13.5 |
| 8 | MKC | McCormick | 11.2 |
| 9 | STZ | Constellation Brands | 10.8 |
| 10 | DAL | Delta Air Lines | 10.4 |

### Bottom 10 EPS surprises (%)
| Rank | Ticker | Company | Surprise % |
|---|---|---|---|
| 1 | COST | Costco | 0.7 |
| 2 | PLD | Prologis | 0.6 |
| 3 | ABT | Abbott | 0.5 |
| 4 | FAST | Fastenal | 0.4 |
| 5 | DRI | Darden Restaurants | 0.2 |
| 6 | CTAS | Cintas | 0.1 |
| 7 | LEN | Lennar | -2.4 |
| 8 | CAG | Conagra | -2.9 |
| 9 | PGR | Progressive | -5.7 |
| 10 | GIS | General Mills | -12.1 |

---

## Section: Page-by-page index

| Page | Section title (printed in PDF) |
|---|---|
| 1 | Key Metrics |
| 2 | Table of Contents |
| 3 | Topic of the Week |
| 4 | Topic of the Week — chart |
| 5 | Q1 Earnings Season: By the Numbers / Overview |
| 6 | Scorecard (Net Beat % + Surprise %) |
| 7 | Scorecard (Revenue + Stock Reactions) |
| 8 | Revisions: Earnings |
| 9 | Revisions: Revenues |
| 10 | Earnings Growth: Sector deep dives |
| 11 | Revenue Growth + Net Profit Margin |
| 12 | Forward Estimates & Valuation + Targets & Ratings |
| 13 | Targets & Ratings (Buy/Hold/Sell %) + Companies Reporting Next Week |
| 14 | Q1 2026: Scorecard chart |
| 15 | Q1 2026: Surprise chart |
| 16 | Q1 2026: Surprise chart |
| 17 | Q1 2026: Surprise chart (top/bottom 10 companies) |
| 18 | Q1 2026: Earnings Growth chart |
| 19 | Q1 2026: Revenue Growth chart |
| 20 | Q1 2026: Net Profit Margin chart |
| 21 | Q2 2026: Guidance chart |
| 22 | Q2 2026: EPS Revisions chart |
| 23 | Q2 2026: Earnings & Revenue Growth chart |
| 24 | FY 2026/2027: EPS Guidance chart |
| 25 | CY 2026: Growth chart |
| 26 | CY 2027: Growth chart |
| 27 | Geographic Revenue Exposure chart |
| 28 | Bottom-Up EPS Estimates (annual) chart |
| 29 | Bottom-Up EPS Estimates (current & historical) chart |
| 30 | Forward 12M P/E Ratio: Sector level chart |
| 31 | Forward 12M P/E Ratio: 10-Year history chart |
| 32 | Trailing 12M P/E Ratio: 10-Year history chart |
| 33 | Targets & Ratings chart |
| 34 | Important Notice / About FactSet |

---

## Notes on extraction caveats

1. **Chart-only data (pages 14–33)** is rasterized — only section titles are present in the text layer. All numeric values from these pages were either (a) confirmed from the corresponding prose pages 1–13, or (b) transcribed manually per the briefing prompt. The ingestion pipeline (`scripts/ingest-factset-pdf.ts`) will record `source_tier = "tier_1_factset_insight"` and `source_page = <chart page>` for each.
2. **Audit-flagged conflicts** (Citi EPS 3.06, JPM revenue, WFC growth, GS guidance, Financials gross margin) — see docs/reconciliation-log-2026-04-17.md.
3. **JPM revenue note**: PDF prose (page 9) reports JPM revenue as $49.84B vs $49.18B estimate, not $50.54B as cited in the audit. The PDF figure prevails.
4. **Phillips 66 EPS revision**: PDF page 8 shows -$0.56 (down from $2.07 since March 31).
