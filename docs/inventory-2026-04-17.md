# Q1 2026 Earnings Season Tracker — Repository Inventory
**Date: 2026-04-17**

## Overview

Full-stack earnings analytics platform built with Express + React, using SQL.js for in-browser data persistence. The app tracks Q1 2026 earnings season across ~100 companies, providing dashboards, scorecard analytics, and AI-powered insights via the Anthropic API.

---

## Routes (server/src/routes/)

### earnings.routes.ts
- `GET /api/earnings` — list with filters (status, sector, region, style, market_cap_category, sort, order, limit, offset); optional live quote enrichment
- `GET /api/earnings/recent?limit=10` — recent reported earnings
- `GET /api/earnings/:ticker` — earnings history for a single ticker

### calendar.routes.ts
- `GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` — earnings calendar for date range (defaults to current week Mon–Fri)
- `GET /api/calendar/upcoming?days=7` — upcoming earnings in next N days
- `GET /api/calendar/week/:weekOf` — earnings for week starting on date

### scorecard.routes.ts
- `GET /api/scorecard?quarter=Q1%202026` — comprehensive season scorecard, broken down bySector and byRegion
- `GET /api/scorecard/sectors` — sector-level scorecards only

### companies.routes.ts
- `GET /api/companies?sector=...&region=...&style=...&market_cap_category=...` — list with filters
- `GET /api/companies/:ticker` — single company details

### sectors.routes.ts
- `GET /api/sectors?quarter=Q1%202026` — all sectors with score summaries
- `GET /api/sectors/:sector?quarter=Q1%202026` — single sector with earnings list

### regions.routes.ts
- `GET /api/regions?quarter=Q1%202026` — US, Europe, Japan, China, EM with metrics
- `GET /api/regions/:regionName?quarter=Q1%202026` — single region detail

### commentary.routes.ts
- `GET /api/commentary?quarter=...&theme=...&sentiment=...&sector=...&region=...&limit=50`

### themes.routes.ts
- `GET /api/themes?quarter=Q1%202026` — signals grouped by theme name
- `GET /api/themes/:theme?quarter=Q1%202026` — signals for one theme + commentary

### segments.routes.ts
- `GET /api/segments?quarter=Q1%202026` — Mega/Large/Mid/Small market cap & Growth/Value/Blend style breakdowns

### market.routes.ts
- `GET /api/market/status` — Finnhub/FMP API status & rate limits
- `GET /api/market/quote/:symbol` — single quote (Finnhub primary, FMP fallback)
- `POST /api/market/quotes` — batch quotes (max 20)
- `GET /api/market/news/:symbol?days=7`
- `GET /api/market/price-history/:symbol?days=30`
- `GET /api/market/recommendations/:symbol`

### ai.routes.ts
- `GET /api/ai/analyze?type=overview|sectors|guidance|themes` — SSE stream of Claude analysis

---

## Models (server/src/models/)

### earnings.model.ts
Fields: `id, company_id, fiscal_quarter, report_date, time_of_day, eps_estimate, eps_actual, revenue_estimate, revenue_actual, eps_surprise_pct, revenue_surprise_pct, guidance_direction, stock_reaction_pct, status, eps_actual_prior_year, revenue_actual_prior_year, eps_actual_prior_quarter, revenue_actual_prior_quarter, eps_growth_yoy, revenue_growth_yoy, eps_growth_qoq, revenue_growth_qoq, gross_margin, operating_margin, gross_margin_prior, operating_margin_prior, forward_eps_current, forward_eps_30d_ago, forward_revenue_current, forward_revenue_30d_ago, data_source`

### company.model.ts
Fields: `id, ticker, name, sector, industry, region, country, market_cap_category, style, index_membership`

### calendar.model.ts
Functions: `getCalendarEntries(from, to)`, `getUpcomingEarnings(days)`

### commentary.model.ts
Fields: `id, company_id, fiscal_quarter, quote_text, theme_tags, sentiment, source`

### sector-score.model.ts
Fields: `id, sector, fiscal_quarter, total_companies, reported_companies, pct_beating_eps, pct_beating_revenue, avg_eps_growth, avg_revenue_growth, avg_gross_margin, avg_operating_margin, avg_gross_margin_prior, avg_operating_margin_prior, pct_guidance_raised, pct_guidance_lowered, pct_guidance_maintained, avg_stock_reaction, avg_eps_growth_yoy, avg_revenue_growth_yoy, forward_eps_revision_pct`

### thematic-signal.model.ts
Fields: `id, company_id, fiscal_quarter, theme, signal_direction, detail`

### Source-tier / prior-value tracking
- **`source_tier`**: NOT PRESENT (model uses `data_source` enum: 'seed', 'fmp', 'finnhub')
- **`prior_value`**: NOT PRESENT (only domain-specific prior fields like `eps_actual_prior_year`)

---

## Services (server/src/services/)

- **scorecard.service.ts**: `computeScorecard(quarter)` — aggregates KPIs (epsBeat/Miss/Meet, surprise %, guidance, growth rates), expected vs blended growth, bySector, byRegion
- **ai.service.ts**: `streamAnalysis(type)` — AsyncGenerator yielding Claude Sonnet 4 chunks
- **market-data.service.ts**: MarketDataService singleton — Finnhub primary, FMP fallback, token-bucket rate limiting, TTL cache
- **seed.adapter.ts**: parses companies.json, earnings-q1-2026.json, commentary-q1-2026.json
- **data-source.interface.ts / data-source.factory.ts**: pluggable adapters

---

## Database Schema (server/src/db/schema.sql)

- `companies` (UNIQUE ticker)
- `earnings_reports` (UNIQUE company_id + fiscal_quarter)
- `commentary`
- `sector_scores` (UNIQUE sector + fiscal_quarter)
- `thematic_signals` (UNIQUE company_id + fiscal_quarter + theme)
- `estimate_revisions`

Indexes on report_date, status, sector, region, style, company_id, theme, estimate_date.

---

## Scripts

### server/src/scripts/seed-db.ts
Loads seed JSON → migrations → inserts companies + earnings + commentary. Clears existing first.

### server/src/scripts/backfill-prior-year.ts
Fetches Q1 2025 / Q4 2025 EPS/revenue from SEC EDGAR API and enriches earnings-q1-2026.json.

### scripts/refresh-data.ts
Build-time pipeline to fetch real earnings from FMP or Finnhub (if keys present), 6-hour cache, falls back to seed JSON. `--dry-run` flag.

### scripts/ingest-csv.ts
Imports CSVs from `server/data/imports/` — auto-detects format (earnings, margins, estimate revisions).

### scripts/validate-seed.mjs
Existing validator (to be expanded in Step 5c).

### scripts/apply-seed-updates.mjs
Applies seed update patches.

### scripts/patch-esbuild.js
Patches esbuild for TypeScript transform compat.

---

## Seed Data (server/data/seed/)

### companies.json
Array. Fields: `ticker, name, sector, industry, region, country, market_cap_category, style, index_membership`. ~100 records.

### earnings-q1-2026.json
Array. Fields: `ticker, report_date, time_of_day, eps_estimate, eps_actual, revenue_estimate, revenue_actual, eps_surprise_pct, revenue_surprise_pct, guidance_direction, stock_reaction_pct, status, eps_actual_prior_year, revenue_actual_prior_year, eps_actual_prior_quarter, revenue_actual_prior_quarter, eps_growth_yoy, revenue_growth_yoy, eps_growth_qoq, revenue_growth_qoq, gross_margin, operating_margin, gross_margin_prior, operating_margin_prior, forward_eps_current, forward_eps_30d_ago, forward_revenue_current, forward_revenue_30d_ago, data_source`. ~100 records. Status 'upcoming' or 'reported'; time_of_day 'amc' or 'bmo'.

### commentary-q1-2026.json
Array. Fields: `ticker, fiscal_quarter, quote_text, theme_tags, sentiment, source`. ~300+ quotes.

---

## Pages (client/src/pages/)

| Page | Renders |
|---|---|
| DashboardPage | KPI strip + 2x2 chart grid + recent reporters |
| EarningsPage | All earnings table w/ filters + beat/miss bar |
| CalendarPage | Week-by-week calendar |
| CompanyDetailPage | Single ticker detail + history + financials |
| SectorsPage | Sector list w/ KPIs |
| SectorDetailPage | Single sector drill-down |
| RegionsPage | US, Europe, Japan, China, EM |
| RegionDetailPage | Single region detail |
| SegmentsPage | Market-cap & style breakdowns |
| ThemesPage | Thematic signals grouped by theme |
| AiInsightsPage | SSE stream UI for Claude analysis |

---

## Components (client/src/components/)

### dashboard/
- ScoreboardStrip, RecentReporters, WeeklyPreview, SectorSummary, RegionalSnapshot, LatestCommentary

### charts/
- BeatMissBar, GrowthBySector, MarginTrends, ReactionScatter, SectorHeatmap

### tables/
- EarningsTable

### ui/
- Badge, Spinner, EmptyState, CommandPalette, DataSourceDot, LivePrice, Sparkline, StatCard

### layout/
- Shell, Header, Sidebar

### market/
- MarketBar, AnalystBar, NewsCard

### commentary/
- CommentaryList

---

## Hooks (client/src/hooks/)

- use-earnings, use-calendar, use-scorecard, use-companies, use-regions, use-market-data, use-commentary, use-segments

---

## Supporting Files

- **client/src/lib/api.ts**: `apiFetch<T>(path, init?)` wrapper
- **client/src/lib/constants.ts**: SECTOR_COLORS, REGION_LABELS, THEME_LABELS, MARKET_CAP_LABELS, STYLE_LABELS, SECTORS, REGIONS, STYLES, MARKET_CAPS, DATA_SOURCE_LABELS
- **client/src/lib/utils.ts**: formatPct, formatEps, formatCurrency, formatDate, classifyResult, numColor
- **client/src/stores/ui.store.ts**: Zustand UI state (sidebar, selected sector/region, calendar offset, search query)
- **server/src/config.ts**: env loader (port, dataSource, fmpApiKey, finnhubApiKey, anthropicApiKey, dbPath, seedDir)
- **server/src/app.ts**: Express factory mounting routes
- **server/src/index.ts**: server entry, port 3001
- **server/src/middleware/error-handler.ts**: error JSON middleware
- **client/src/main.tsx**: React entry w/ QueryClientProvider
- **client/src/App.tsx**: routes setup wrapped in Shell

---

## API (api/index.ts — Vercel Serverless)

Vercel handler that lazily inits Express app with SQL.js DB, loaded from `server/data/earnings.db` or `schema.sql`. Mounts all route handlers inline. Helpers: `queryAll`, `queryOne`, `avgArr`, `growthVsPrior`, `computeExpectedBlended(entries)`.

---

## Package Scripts

### Root (package.json)
- `dev`: concurrently run server + client
- `build`: build both
- `seed`: `npm run seed -w server`
- `ingest`: `node scripts/ingest-csv.ts`
- `refresh`: `node scripts/refresh-data.ts`
- `validate-seed`: `node scripts/validate-seed.mjs`

### Server
- `dev`: `node --experimental-transform-types --watch src/index.ts`
- `build`: `tsc`
- `seed`: `node --experimental-transform-types src/scripts/seed-db.ts`
- `ingest`, `backfill`, `migrate`

### Client
- `dev`: vite
- `build`: `tsc -b && vite build`
- `preview`: vite preview

---

## Vercel (vercel.json)

```json
{
  "buildCommand": "cd client && npm install && npx vite build",
  "outputDirectory": "client/dist",
  "installCommand": "npm install",
  "functions": { "api/index.ts": { "includeFiles": "server/data/**,server/src/db/schema.sql" } },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

---

## Gaps relative to FactSet PDF (preview — full analysis in gap-analysis-2026-04-17.md)

- No `source_tier` enum on numeric fields
- No `prior_value` traceability column
- No canonical aggregate file for index-level figures
- No Topic-of-the-Week / Mag 7 / Other 493 module
- No Forward Outlook (Q2/Q3/Q4/CY26/CY27) cards
- No Bottom-Up EPS time series
- No Geographic Revenue Exposure breakdown
- No Top/Bottom Surprises lists
- No Ratings roll-up (Buy/Hold/Sell)
- No PDF ingestion pipeline
- Sector net-profit-margin metric is computed at the company level only (gross/operating margins for non-financials)
