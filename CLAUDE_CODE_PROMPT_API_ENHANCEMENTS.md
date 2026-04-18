# Claude Code Prompt: Live Market Data Integration via Finnhub & FMP APIs

Paste everything below the line into a new Claude Code session rooted in this repo.

---

## Context: Existing App

You are working on a **Q1 2026 Earnings Season Tracker** — a monorepo (`npm workspaces`) with a React 19 frontend (`client/`) and Express 5 backend (`server/`).

### Tech Stack
- **Frontend**: React 19, Vite 6, TypeScript, Tailwind v4 (custom dark theme in `client/src/index.css`), React Router DOM 7, TanStack Query 5, TanStack Table 8, Recharts 2, Zustand 5, Lucide icons
- **Backend**: Express 5, sql.js 1.12 (SQLite compiled to WASM, runs in-memory), Anthropic SDK for AI features
- **Deployment**: Vercel — serverless function bundles the SQLite DB + static assets
- **Dev**: `npm run dev` runs both (server on :3001, client on :5173 with Vite proxy for `/api`)

### Routes (in `client/src/App.tsx`)
`/` (Dashboard), `/calendar`, `/earnings`, `/company/:ticker`, `/sectors`, `/sectors/:sectorName`, `/regions`, `/regions/:regionName`, `/segments`, `/themes`, `/ai`

### Backend API Routes (registered in `server/src/app.ts`)
`/api/companies`, `/api/calendar`, `/api/earnings`, `/api/scorecard`, `/api/sectors`, `/api/themes`, `/api/commentary`, `/api/ai`, `/api/regions`, `/api/segments`

### Database Schema (`server/src/db/schema.sql`)
- **`companies`** (~195 rows): ticker, name, sector, industry, region (us/europe/asia), country, market_cap_category (mega/large/mid), style (growth/value/blend), index_membership
- **`earnings_reports`**: company_id FK, fiscal_quarter, report_date, time_of_day, eps_estimate/actual, revenue_estimate/actual, eps_surprise_pct, revenue_surprise_pct, guidance_direction, stock_reaction_pct, status (upcoming/reported), growth columns (eps_growth_yoy/qoq, revenue_growth_yoy/qoq), margin columns (gross_margin, operating_margin, gross_margin_prior, operating_margin_prior), forward estimate columns (forward_eps_current, forward_eps_30d_ago, forward_revenue_current, forward_revenue_30d_ago), data_source (seed/fmp/finnhub/csv_import). UNIQUE(company_id, fiscal_quarter).
- **`commentary`**: company_id FK, fiscal_quarter, quote_text, theme_tags (JSON array), sentiment, source
- **`sector_scores`**: sector, fiscal_quarter, aggregated metrics (beat rates, growth averages, margins, guidance splits, revision %)
- **`thematic_signals`**: company_id FK, fiscal_quarter, theme, relevance_score, supporting_metrics

### Existing Data Source Architecture (`server/src/services/`)
- **`data-source.interface.ts`** defines `DataSourceAdapter` with methods: `getEarningsCalendar(from, to)`, `getCompanyProfile(ticker)`, `getQuote(ticker)` — returning `CalendarEntry`, `CompanyProfile`, `StockQuote` interfaces
- **`data-source.factory.ts`** has a `getDataSource()` factory with `switch(config.dataSource)` — the `'fmp'` and `'finnhub'` cases are **stubs that fall back to SeedAdapter** with a console.log warning
- **`seed.adapter.ts`** implements `DataSourceAdapter` by loading JSON files from `server/data/seed/`
- **`scorecard.service.ts`** computes aggregated KPIs (beat rates, growth averages, guidance tilt, margin averages, forward EPS revision %) from the SQLite DB
- **`ai.service.ts`** streams Claude-powered earnings analysis via SSE

### Existing Build-Time Pipeline (`scripts/refresh-data.ts`)
Already has FMP and Finnhub fetcher functions that: fetch earnings calendars, income statements, key metrics, analyst estimates; compute growth rates and surprises; cache responses (6h TTL) in `server/data/cache/`; write updated seed JSONs; rebuild the DB via `npm run seed`. Rate-limited with batch delays. **This pipeline works but only runs at build time — not at runtime.**

### Config (`server/src/config.ts`)
```ts
export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  dataSource: (process.env.DATA_SOURCE || 'seed') as 'seed' | 'fmp' | 'finnhub',
  fmpApiKey: process.env.FMP_API_KEY || '',
  finnhubApiKey: process.env.FINNHUB_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  dbPath: path.resolve(__dirname, '../data/earnings.db'),
  seedDir: path.resolve(__dirname, '../data/seed'),
};
```

### ⚠️ CRITICAL: Truncated Source Files

Many source files on disk are **literally truncated mid-statement** — cut off partway through a line with no closing brackets, exports, or return statements. Before making any changes, you MUST first audit and repair these files. Here are the known truncated files (this list may not be exhaustive):

**Client (truncated at line shown):**
- `App.tsx` (line 21 — cut mid-`<Route>` tag)
- `pages/DashboardPage.tsx` (line 20 — cut mid-JSX comment)
- `pages/EarningsPage.tsx` (line 41 — cut mid-REGIONS.map)
- `pages/SectorsPage.tsx` (line 12 — cut mid-data access)
- `pages/CompanyDetailPage.tsx` (line 103 — cut mid-value prop)
- `components/layout/Header.tsx` (line 36 — cut mid-div)
- `components/layout/Sidebar.tsx` (line 44 — cut mid-nav)
- `components/tables/EarningsTable.tsx` (line 190 — cut mid-table tag)
- `components/dashboard/ScoreboardStrip.tsx` (line 54 — cut mid-formatPct call)
- `components/dashboard/RecentReporters.tsx` (line 44 — cut on blank line)
- `components/dashboard/SectorSummary.tsx` (line 70 — cut mid-span)
- `components/charts/SectorHeatmap.tsx` (line 52 — cut mid-span)
- `components/ui/StatCard.tsx` (line 33 — cut mid-div)
- `hooks/use-earnings.ts` (line 56 — cut mid-param name `market_cap_cat`)
- `hooks/use-scorecard.ts` (line 43 — cut mid-word `avgOperatin`)
- `hooks/use-companies.ts` (line 32 — cut mid-`enabled: !`)
- `lib/constants.ts` (line 39 — missing closing brace for THEME_LABELS, plus missing `SECTORS`, `REGIONS`, `STYLES`, `MARKET_CAPS` arrays, and `numColor` utility)

**Server (truncated at line shown):**
- `app.ts` (line 30 — cut mid-route registration `/api/segment`)
- `models/earnings.model.ts` (line 149 — cut mid-SQL column list)
- `models/company.model.ts` (line 100 — cut on whitespace)
- `routes/earnings.routes.ts` (line 28 — cut mid-handler)
- `routes/companies.routes.ts` (line 18 — cut mid-if)
- `scripts/seed-db.ts` (line 140 — cut mid-SQL aggregation)
- `services/scorecard.service.ts` (line 150 — cut mid-map lambda)
- `services/seed.adapter.ts` (line 75 — cut mid-property access)

**Repair strategy**: For each truncated file, infer the intended completion from the existing code patterns, imports, the schema, and the API route registrations. Complete the files so they compile and function correctly. Run `npm run dev` after repairs to verify the app builds.

---

## What to Implement

After repairing truncated files, add **live runtime API integration** with Finnhub and Financial Modeling Prep. The existing build-time pipeline (`scripts/refresh-data.ts`) stays untouched. This work adds a **separate runtime layer** that serves live market data alongside the seed data in the DB.

---

### Phase 1: Repair Truncated Files

1. Audit every `.ts` and `.tsx` file in `client/src/` and `server/src/` for truncation
2. Complete each file based on its imports, the patterns in neighboring files, the DB schema, and the route registrations in `app.ts`
3. Key things the truncated files are missing that other files reference:
   - `constants.ts` needs closing brace for `THEME_LABELS`, plus exports: `SECTORS` (array of sector name strings), `REGIONS` (array of region keys), `STYLES` (array: growth/value/blend), `MARKET_CAPS` (array: mega/large/mid)
   - `utils.ts` is missing a `numColor(n)` function that returns a Tailwind color class (green for positive, red for negative, muted for null/zero) — used extensively in tables and cards
   - `use-earnings.ts` needs `useEarnings()` completed (finish the URLSearchParams building + return useQuery), plus `useRecentEarnings(limit)` and `useEarningsByTicker(ticker)` hooks
   - `use-scorecard.ts` needs the `ScorecardData` interface completed and the hook finished
   - `use-companies.ts` needs the `enabled` prop completed for `useCompany(ticker)`
4. Run `npm run dev` — both server and client must start without errors before proceeding

---

### Phase 2: Create Runtime Market Data Service

Create `server/src/services/market-data.service.ts` — a new service (separate from the existing DataSourceAdapter pattern) that provides live API access at runtime.

**Architecture:**

```
MarketDataService (singleton, exported via getMarketDataService())
  ├── finnhubKey / fmpKey (from config)
  ├── preferred provider (from config.dataSource)
  ├── APICache (in-memory Map with TTL per endpoint type)
  ├── RateLimiter (token bucket: 60/min for Finnhub, 250/day for FMP)
  └── methods (all return null if no API key configured — never throw)
```

**Finnhub endpoints to wrap** (base: `https://finnhub.io/api/v1`, auth: `token=KEY` query param or `X-Finnhub-Token` header, free tier: 60 calls/min):

| Service Method | Finnhub Endpoint | Cache TTL | Notes |
|---|---|---|---|
| `getQuote(symbol)` | `GET /quote?symbol=X` | 60s | Returns `{ c, d, dp, h, l, o, pc, t }` — c=current, d=change, dp=change%, h/l=high/low, o=open, pc=prev close |
| `getEarningsCalendar(from, to)` | `GET /calendar/earnings?from=X&to=Y` | 15min | Returns `{ earningsCalendar: [...] }` with symbol, date, epsActual, epsEstimate, revenueActual, revenueEstimate, hour |
| `getCompanyNews(symbol, from, to)` | `GET /company-news?symbol=X&from=Y&to=Z` | 10min | Returns array of `{ headline, summary, url, source, datetime, image }` |
| `getBasicFinancials(symbol)` | `GET /stock/metric?symbol=X&metric=all` | 1hr | Returns `{ metric: { grossMarginTTM, operatingMarginTTM, epsGrowthTTMYoy, revenueGrowthTTMYoy, ... } }` |
| `getRecommendations(symbol)` | `GET /stock/recommendation?symbol=X` | 1hr | Returns array of `{ buy, hold, sell, strongBuy, strongSell, period }` |
| `getCompanyProfile(symbol)` | `GET /stock/profile2?symbol=X` | 24hr | Returns `{ name, exchange, finnhubIndustry, logo, marketCapitalization, ... }` |

**FMP endpoints to wrap** (base: `https://financialmodelingprep.com/api/v3`, auth: `apikey=KEY` query param, free tier: 250 calls/day):

| Service Method | FMP Endpoint | Cache TTL | Notes |
|---|---|---|---|
| `getQuote(symbol)` | `GET /quote/X` | 60s | Returns array with `[{ price, change, changesPercentage, volume, marketCap, ... }]` |
| `getEarningsCalendar(from, to)` | `GET /earning_calendar?from=X&to=Y` | 15min | Returns array of `{ date, symbol, eps, epsEstimated, revenue, revenueEstimated }` |
| `getIncomeStatement(symbol)` | `GET /income-statement/X?period=quarter&limit=8` | 6hr | Returns array of quarterly income statements |
| `getKeyMetrics(symbol)` | `GET /key-metrics/X?period=quarter&limit=8` | 6hr | Returns array with grossProfitMargin, operatingCashFlowPerShare, etc. |
| `getAnalystEstimates(symbol)` | `GET /analyst-estimates/X?limit=4` | 1hr | Returns array with estimatedEpsAvg, estimatedRevenueAvg |
| `getPriceHistory(symbol, days)` | `GET /historical-price-full/X?timeseries=N` | 1hr | Returns `{ historical: [{ date, close, ... }] }` |

**Implementation requirements:**

```ts
// Rate limiter — token bucket pattern
class RateLimiter {
  constructor(private maxPerMinute: number) {}
  async acquire(): Promise<void> // waits if no tokens available
}

// Cache with stale-data fallback
class APICache {
  get<T>(key: string): T | null          // returns if within TTL
  set<T>(key: string, data: T, ttlMs: number): void
  getStale<T>(key: string): T | null     // returns even if expired (for fallback on errors)
  get size(): number
}
```

- All fetch calls must have a **5-second timeout** (`AbortController`)
- On API error or rate limit, return stale cache if available, otherwise `null`
- Log a **single startup warning** if no API keys are configured
- Use `Promise.allSettled` for batch operations — never let one failed fetch block others

---

### Phase 3: Implement the FMP and Finnhub DataSourceAdapters

Fill in the stubbed cases in `server/src/services/data-source.factory.ts`. Create:

- **`server/src/services/fmp.adapter.ts`** — implements `DataSourceAdapter` using MarketDataService's FMP methods. Maps FMP response shapes to the `CalendarEntry`, `CompanyProfile`, `StockQuote` interfaces defined in `data-source.interface.ts`.
- **`server/src/services/finnhub.adapter.ts`** — same, using Finnhub methods.

Update `data-source.factory.ts` to instantiate the correct adapter based on `config.dataSource` and key availability (if key missing, fall back to `SeedAdapter`).

---

### Phase 4: Add Live Market Data API Routes

Create **`server/src/routes/market.routes.ts`** and register it in `app.ts` at `/api/market`.

**Endpoints:**

**`GET /api/market/quote/:symbol`**
Returns live quote. Response:
```json
{ "symbol": "AAPL", "price": 213.42, "change": 1.23, "changePercent": 0.58, "high": 214.10, "low": 211.80, "open": 212.50, "previousClose": 212.19, "timestamp": 1681234567, "source": "finnhub" }
```
Returns `{ error: "No market data API key configured" }` with 503 if no keys.

**`POST /api/market/quotes`** (body: `{ symbols: string[] }`, max 20)
Batch quote fetcher. Fetches in parallel with rate limiting. Response: `{ quotes: Quote[], errors: string[] }`.

**`GET /api/market/news/:symbol`**
Returns 10 most recent news items from Finnhub `/company-news` (last 7 days). Response: array of `{ headline, summary, url, source, datetime, image }`.

**`GET /api/market/price-history/:symbol?days=30`**
Returns daily closing prices for sparkline charts. Response: `{ symbol, prices: [{ date: "2026-04-01", close: 213.42 }, ...] }`.

**`GET /api/market/recommendations/:symbol`**
Returns analyst consensus from Finnhub. Response: `{ symbol, buy, hold, sell, strongBuy, strongSell, period }` (most recent entry).

**`GET /api/market/status`**
Health check. Response: `{ finnhub: "ok"|"no_key"|"rate_limited"|"error", fmp: "ok"|"no_key"|"rate_limited"|"error", cacheSize: 42, uptime: 3600 }`.

**Enhance existing `GET /api/earnings`:**
When query param `?enrich=true` is present AND an API key is configured, merge live quote data (price, change, changePercent) into each returned earnings row. Skip enrichment silently if no key available.

**Enhance existing `GET /api/scorecard`:**
Add a `marketSnapshot` field:
```json
{
  "marketSnapshot": {
    "spy": { "price": 5432.10, "change": 18.3, "changePercent": 0.34 },
    "qqq": { "price": 17891.23, "change": -21.5, "changePercent": -0.12 },
    "lastUpdated": "2026-04-13T14:34:00Z"
  }
}
```
Fetch SPY and QQQ quotes from MarketDataService. Return `null` for `marketSnapshot` if no key.

---

### Phase 5: Frontend — New Hooks

Create **`client/src/hooks/use-market-data.ts`**:

```ts
// All hooks use TanStack Query with refetchInterval for live updates.
// All handle null/error gracefully — the UI components check for data existence.

export function useQuote(symbol: string, enabled = true)
// queryKey: ['market', 'quote', symbol], refetchInterval: 60_000, staleTime: 30_000

export function useQuotes(symbols: string[])
// queryKey: ['market', 'quotes', symbols.sort().join(',')]
// POST /api/market/quotes, refetchInterval: 60_000, enabled: symbols.length > 0

export function useCompanyNews(symbol: string)
// queryKey: ['market', 'news', symbol], staleTime: 5 * 60_000

export function usePriceHistory(symbol: string, days = 30)
// queryKey: ['market', 'priceHistory', symbol, days], staleTime: 60 * 60_000

export function useRecommendations(symbol: string)
// queryKey: ['market', 'recommendations', symbol], staleTime: 60 * 60_000

export function useMarketStatus()
// queryKey: ['market', 'status'], refetchInterval: 5 * 60_000
```

---

### Phase 6: Frontend — New Components

All new components should follow the existing design system: dark theme (`bg-bg-card`, `text-text-primary/secondary/muted`, `border-border`), monospace for numbers (`font-mono tabular-nums`), green/red for positive/negative values, Inter font for text, compact spacing.

**`client/src/components/ui/LivePrice.tsx`**
Inline component showing a real-time stock price:
```
AAPL $213.42 ▲+1.23 (+0.58%)
```
- Props: `{ symbol: string, showChange?: boolean, showPercent?: boolean, compact?: boolean }`
- Uses `useQuote(symbol)`
- Green text + `▲` if positive change, red + `▼` if negative, muted if zero
- Shows `—` with "No API key configured" tooltip when data is null
- Shows a tiny skeleton/shimmer while loading
- All numbers in `font-mono tabular-nums text-xs`

**`client/src/components/ui/Sparkline.tsx`**
Tiny inline SVG chart for 30-day price action:
- Props: `{ symbol: string, width?: number (default 80), height?: number (default 24) }`
- Uses `usePriceHistory(symbol)`
- Pure SVG: polyline with stroke (no Recharts overhead)
- Green stroke if price up over period, red if down
- Optional subtle gradient fill under the line (`fill-opacity: 0.1`)
- Shows gray placeholder rectangle while loading or if no data

**`client/src/components/market/MarketBar.tsx`**
Thin status bar at the very top of the app:
```
S&P 500  5,432.10 (+0.34%)  │  Nasdaq  17,891.23 (−0.12%)  │  Updated 2:34 PM ET
```
- Fixed at top, ~28px height, `bg-bg-primary` or slightly darker
- Uses `useQuotes(['SPY', 'QQQ'])`
- Monospace numbers, green/red change coloring
- If no API key: shows "Market data unavailable — configure API keys in .env" in muted text
- Auto-updates via TanStack Query refetchInterval

**`client/src/components/market/NewsCard.tsx`**
Compact news item for company detail page:
- Props: `{ headline: string, summary: string, url: string, source: string, datetime: number }`
- Headline as external link, source badge, relative time ("2h ago")
- Truncated summary (2 lines max)

**`client/src/components/market/AnalystBar.tsx`**
Horizontal stacked bar showing analyst consensus:
- Props: `{ symbol: string }`
- Uses `useRecommendations(symbol)`
- Segments: Strong Buy (dark green), Buy (green), Hold (amber), Sell (red), Strong Sell (dark red)
- Labels below with counts
- ~200px wide, 16px tall

---

### Phase 7: Frontend — Page Integrations

**`components/layout/Shell.tsx`** — Add `<MarketBar />` above the existing layout (above Header). Import and render conditionally (always render — the component handles the "no key" state internally).

**`pages/CompanyDetailPage.tsx`** — Enhance the company detail page:
1. Add `<LivePrice symbol={ticker} />` prominently next to the company name/ticker at the top
2. Add `<Sparkline symbol={ticker} width={200} height={40} />` next to or below the price
3. Add a "Recent News" section after the earnings data, showing up to 5 `<NewsCard />` items using `useCompanyNews(ticker)`. Hide the section entirely if no data (no key or no news).
4. Add `<AnalystBar symbol={ticker} />` in the stats area

**`pages/EarningsPage.tsx`** — Add a toggle button in the toolbar area: "Live Prices". When toggled on:
1. Add a "Price" column to EarningsTable showing `<LivePrice symbol={row.ticker} compact />` for each row
2. Add a "30d" column showing `<Sparkline symbol={row.ticker} width={60} height={20} />`
3. Only fetch data for tickers on the current table page (pass the visible ticker list to a single `useQuotes` call rather than individual hooks per row)

**`pages/DashboardPage.tsx`** — The MarketBar already covers market context globally. No additional dashboard changes needed unless you find a natural place for an "Earnings This Week + Live Prices" enhancement in the WeeklyPreview component.

---

### Phase 8: Graceful Degradation (CRITICAL)

The app MUST work identically to today when no API keys are configured. This means:

1. `MarketDataService` methods return `null` (never throw) when no key is available
2. `LivePrice` renders `—` with a tooltip; `Sparkline` renders a gray placeholder; `MarketBar` shows a muted message; news/recommendations sections hide entirely
3. The `?enrich=true` enrichment on `/api/earnings` silently skips if no key
4. `scorecard.marketSnapshot` is `null` if no key
5. The `GET /api/market/status` endpoint always works and reports which providers are available
6. On server startup, log exactly one warning: `"⚠ No market data API key configured. Live quotes, news, and price history will be unavailable. Set FINNHUB_API_KEY or FMP_API_KEY in .env."`

---

### Phase 9: Configuration Updates

**Update `.env.example`:**
```
# Market Data (at least one required for live data; app works without either)
FINNHUB_API_KEY=
FMP_API_KEY=

# Which provider to prefer: 'finnhub' | 'fmp' | 'seed' (default: seed)
DATA_SOURCE=seed

# AI Insights
ANTHROPIC_API_KEY=

# Server
PORT=3001
```

---

## Implementation Order & Verification

1. **Repair truncated files** → `npm run dev` must start cleanly
2. **MarketDataService + cache + rate limiter** → unit-testable in isolation
3. **FMP/Finnhub adapters** → update data-source factory
4. **Market routes** → test with `curl http://localhost:3001/api/market/status`
5. **Enhance earnings + scorecard routes** → verify existing endpoints still work
6. **Frontend hooks** → `use-market-data.ts`
7. **UI components** → LivePrice, Sparkline, MarketBar, NewsCard, AnalystBar
8. **Page integrations** → Shell, CompanyDetail, EarningsPage
9. **Final verification** → `npm run dev` works with AND without API keys; `npm run build` succeeds for Vercel deployment

**Commit after each phase.** Do NOT modify `scripts/refresh-data.ts` or the seed data pipeline — those remain as the build-time data population mechanism. This work adds a separate runtime live data layer.
