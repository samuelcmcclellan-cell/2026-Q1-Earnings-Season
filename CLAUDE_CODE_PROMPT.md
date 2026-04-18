# Claude Code Prompt: Q1 2026 Earnings Season Tracker — Major Redesign

Paste everything below the line into a new Claude Code session rooted in this repo.

---

You are working on a Q1 2026 Earnings Season Tracker & Intelligence App. It's a monorepo with npm workspaces: a React 19 / Vite 6 / TypeScript / Tailwind v4 frontend (`client/`) and an Express 5 backend (`server/`) using sql.js (SQLite in WASM) loaded from `server/data/earnings.db`. State management uses Zustand + TanStack Query + TanStack Table. Charts use Recharts. Deployed on Vercel as a single serverless function + static assets — the entire SQLite DB bundles into the function and runs in-memory.

The app has 7 routes: Dashboard (`/`), Calendar (`/calendar`), Earnings table (`/earnings`), Company detail (`/company/:ticker`), Sectors (`/sectors`), Themes (`/themes`), AI Insights (`/ai`). Layout is a sidebar + header + main content area. The DB schema has 5 tables: `companies`, `earnings_reports`, `commentary`, `sector_scores`, `thematic_signals`. Seed data lives in `server/data/seed/` as JSON files loaded by `seed-db.ts`. Config in `server/src/config.ts` already has placeholder keys for FMP and Finnhub APIs alongside Anthropic.

I need you to implement three major changes. Work through them systematically — schema changes first, then backend, then frontend. Run `npm run dev` and verify the app builds and serves before and after your changes. Commit logical checkpoints.

---

## 1. Fix the Data Layer (highest priority)

### Problem
The app is full of fabricated seed data — fake EPS actuals, fake surprise percentages, fake stock reactions, fake guidance. The seed JSON files (`companies.json`, `earnings-q1-2026.json`, `commentary-q1-2026.json`) contain plausible-looking but entirely made-up numbers. This makes the whole app feel like a demo toy.

### What to implement

**A. Real data sourcing via build-time pipeline**

Create a `scripts/refresh-data.ts` script (runnable via `npm run refresh` at the root) that:

1. **Earnings calendar & estimates** — Use the Financial Modeling Prep (FMP) API (`https://financialmodelingprep.com/api/v3/`). Relevant endpoints:
   - `/earning_calendar?from=2026-04-01&to=2026-06-30` for report dates
   - `/analyst-estimates/{ticker}` for consensus EPS/revenue estimates
   - `/income-statement/{ticker}?period=quarter&limit=8` for historical actuals (once reported) and for computing YoY/QoQ growth rates
   - `/key-metrics/{ticker}?period=quarter&limit=8` for margin data (gross margin, operating margin)
   - `/analyst-stock-recommendations/{ticker}` for revision/sentiment signals
   
   Alternatively support Finnhub (`https://finnhub.io/api/v1/`):
   - `/calendar/earnings?from=2026-04-01&to=2026-06-30`
   - `/stock/metric?symbol={ticker}&metric=all` for fundamentals
   
   The script should read `FMP_API_KEY` or `FINNHUB_API_KEY` from `.env`. If neither is set, it should fall back to the existing seed JSON files and print a warning.

2. **Data processing** — The script should:
   - Fetch calendar/estimates/actuals for all companies in `companies.json`
   - Compute derived metrics: YoY EPS growth, YoY revenue growth, QoQ EPS growth, QoQ revenue growth, gross margin, operating margin, margin change vs prior quarter
   - Write the processed data into the seed JSON files (overwriting the fake data with real data)
   - Then run the existing seed-db.ts logic to rebuild `earnings.db`
   - Support a `--dry-run` flag that prints what would change without writing

3. **Rate limiting and caching** — FMP free tier is 250 calls/day. The script should:
   - Cache raw API responses in `server/data/cache/` as JSON files with timestamps
   - Only re-fetch if cache is older than 6 hours (configurable)
   - Process companies in batches with delays between batches
   - Log progress: "Fetching 12/195: AAPL... cached (2h old)" or "Fetching 12/195: AAPL... API call"

**B. Manual data ingestion for institutional sources (FactSet, YCharts)**

Create `scripts/ingest-csv.ts` (runnable via `npm run ingest`) that:

1. Watches for CSV/XLSX files dropped into a `server/data/imports/` directory
2. Auto-detects the data format by looking at column headers. Support at least:
   - **Earnings data**: columns like `Ticker`, `EPS Estimate`, `EPS Actual`, `Revenue Estimate`, `Revenue Actual`, `Report Date`
   - **Margin data**: columns like `Ticker`, `Gross Margin`, `Operating Margin`, `Quarter`
   - **Estimate revisions**: columns like `Ticker`, `Metric`, `Current Estimate`, `Prior Estimate`, `Change Date`
3. Maps the imported data into the app's schema and updates the seed JSONs + rebuilds the DB
4. Logs a summary: "Imported 847 rows from factset-q1-earnings.csv — 195 companies matched, 12 unmatched tickers skipped"

**C. Schema extensions**

Alter the DB schema (`server/src/db/schema.sql`) and seed data structures to support the new analytical dimensions. Add these columns to `earnings_reports`:

```sql
eps_actual_prior_year REAL,        -- Q1 2025 EPS for YoY calc
revenue_actual_prior_year REAL,    -- Q1 2025 revenue for YoY calc
eps_actual_prior_quarter REAL,     -- Q4 2025 EPS for QoQ calc
revenue_actual_prior_quarter REAL, -- Q4 2025 revenue for QoQ calc
eps_growth_yoy REAL,               -- computed: (actual - prior_year) / abs(prior_year)
revenue_growth_yoy REAL,
eps_growth_qoq REAL,
revenue_growth_qoq REAL,
gross_margin REAL,                 -- current quarter gross margin %
operating_margin REAL,             -- current quarter operating margin %
gross_margin_prior REAL,           -- prior quarter for trend
operating_margin_prior REAL,
forward_eps_current REAL,          -- current forward EPS estimate
forward_eps_30d_ago REAL,          -- forward EPS 30 days ago (for revision tracking)
forward_revenue_current REAL,
forward_revenue_30d_ago REAL,
data_source TEXT DEFAULT 'seed'    -- 'seed', 'fmp', 'finnhub', 'csv_import'
```

Add a new `estimate_revisions` table:
```sql
CREATE TABLE IF NOT EXISTS estimate_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  fiscal_quarter TEXT NOT NULL,
  metric TEXT NOT NULL,            -- 'eps' or 'revenue'
  estimate_date TEXT NOT NULL,
  estimate_value REAL NOT NULL,
  prior_value REAL,
  revision_pct REAL,
  source TEXT DEFAULT 'fmp',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Add `style` column to `companies` table: `style TEXT DEFAULT 'blend'` — values: 'growth', 'value', 'blend'.

**D. Clearly mark data provenance**

Every data point in the UI that comes from seed/mock data should show a subtle indicator (e.g., a small dotted underline or a `~` prefix) so I can tell at a glance what's real and what's placeholder. Add a small legend in the sidebar footer explaining the indicators. The data_source column in earnings_reports drives this.

---

## 2. Shift the Analytical Lens

### Problem
The current app is centered on EPS beats/misses — that's table stakes for any earnings tracker. The analytical frame needs to be much richer.

### What to implement

**A. Make Sectors the primary navigation paradigm**

- Restructure the Sectors page (`/sectors`) into a full sector hub. When you click a sector, it should open a deep-dive view (`/sectors/:sectorName`) showing:
  - Aggregate growth rates (YoY EPS/revenue) for that sector with a mini sparkline of the last 4 quarters
  - Margin trends: average gross and operating margins with a chart showing trend vs prior quarters
  - Beat/miss rates (keep these, but secondary)
  - Top movers: best and worst stock reactions in the sector
  - Guidance tilt: % raising vs lowering vs maintaining
  - Estimate revision momentum: are forward estimates for this sector rising or falling?
  - Company table filtered to that sector with all the new columns
- The sectors page itself should be a grid of sector cards, each showing a quick snapshot: companies reported / total, aggregate EPS growth YoY, aggregate revenue growth YoY, margin direction arrow, overall beat rate. Color-code by whether aggregate growth is accelerating or decelerating.

**B. Add Regional / Country breakdown**

- New route: `/regions` with a similar structure to sectors. Show earnings season progress by region: US, Europe, Japan, China, EM (Emerging Markets).
- Each region card shows: companies reported, aggregate YoY growth, beat rates, guidance tilt, average stock reaction.
- Click into `/regions/:regionName` for the deep-dive with a company table.
- The `companies` table already has `region` and `country` fields — use them. Regions map: us→"United States", europe→"Europe", asia splits into Japan/China/rest based on `country` field. If `country` is missing for some, infer from known companies or default to region.

**C. Add Market Cap / Style cuts**

- New route: `/segments` with views sliced by:
  - Market cap: Mega (>$200B), Large ($10-200B), Mid ($2-10B) — the `market_cap_category` field on companies already has 'mega', 'large', 'mid'
  - Style: Growth / Value / Blend — use the new `style` field
- Show aggregate metrics for each segment: growth rates, beat rates, margin trends, guidance tilt.

**D. Redesign the Dashboard**

The dashboard (`/`) should be the "executive summary" of earnings season. Replace the current layout:

- **Top strip**: Keep the scoreboard but replace some cards. New KPI cards: (1) Season progress (X of Y reported), (2) Aggregate YoY EPS growth, (3) Aggregate YoY Revenue growth, (4) Net guidance (raises minus lowers), (5) Forward estimate revision (aggregate % change in forward EPS over last 30 days), (6) Average stock reaction.
- **Row 2**: Two panels side by side:
  - Left: "Growth by sector" — horizontal bar chart showing YoY EPS growth by sector, sorted best to worst
  - Right: "Margin trends" — grouped bar chart showing current vs prior quarter gross margins by sector
- **Row 3**: Two panels:
  - Left: "Regional snapshot" — small table or card grid showing each region's aggregate metrics
  - Right: "Estimate revision momentum" — area chart or bar chart showing how forward estimates are moving (requires estimate_revisions data)
- **Row 4**: "This week's reporters" — keep the weekly preview but enhance it with expected growth rates and market cap for each upcoming reporter.
- **Bottom**: Recent reporters table (keep but add growth rate columns).

Beats/misses info should still be *visible* but not the *headline*. Move the BeatMissBar chart into the Earnings page instead of the dashboard.

**E. Enhance the Earnings Table**

The main earnings table (`/earnings`) should gain new columns (all sortable):
- YoY EPS Growth %
- YoY Revenue Growth %  
- Gross Margin (current)
- Operating Margin (current)
- Margin Change (vs prior Q)
- Forward EPS Revision %
- Data Source indicator

Add filter chips at the top: by sector, region, market cap, style, status (reported/upcoming), guidance direction, and a "growth accelerating" toggle (YoY growth > QoQ growth).

---

## 3. Elevate the Design

### Problem
The current UI is functional but feels like a starter template. It needs to feel like a professional investment terminal — dense, information-rich, but clean. Think Bloomberg Terminal meets Koyfin.

### What to implement

**A. Typography and density**

- Tighten the spacing throughout. Current `p-6` on main content is too generous — go to `p-4` or even `p-3`. Cards should have `p-3` internal padding, not `p-4`.
- Numbers should always render in the monospace font (`font-mono`). This includes all percentages, dollar amounts, dates, and counts. The current app is inconsistent about this.
- Use tabular-nums (`font-variant-numeric: tabular-nums`) on all numeric columns so numbers align vertically in tables.
- Reduce font sizes: body text at 13px, table cells at 12px, labels at 10-11px uppercase with letter-spacing. The current sizes feel slightly too large for a data-dense terminal.
- Header hierarchy: page titles at 16px semibold, section headers at 13px uppercase tracking-wider, card titles at 12px uppercase.

**B. Color and visual system**

- Keep the dark palette but refine it. The current `#0a0e17` background is good. Introduce a subtle gradient or noise texture on the main background to add depth.
- Accent colors for data meaning:
  - Green (#22c55e) = positive growth, beats, raises — already correct
  - Red (#ef4444) = negative growth, misses, lowers — already correct
  - Add amber (#f59e0b) for "in-line" / "maintaining" — currently yellow but inconsistent
  - Blue (#3b82f6) for neutral/informational elements
  - Use opacity variations (green/10, green/20) for background fills on positive cells, red/10, red/20 for negative
- Conditional coloring on ALL numeric data: positive values get green text, negative get red. This should be a utility component or Tailwind class pattern used consistently everywhere.
- Sector colors: each sector should have a consistent assigned color throughout the app (already partially implemented via SECTOR_COLORS object — make sure it's used everywhere).

**C. Card and container design**

- Cards should have a 1px border (`border-border`) and no shadow. On hover, brighten the border slightly (`border-border-light`).
- Add a thin left-side color accent bar on cards where contextually relevant (e.g., sector cards get their sector color as a 3px left border).
- Table rows should have subtle alternating backgrounds: odd rows at bg-bg-card, even rows very slightly lighter.
- Active/selected states should use a blue left border + faint blue background tint.

**D. Data visualization improvements**

- Recharts defaults need overriding: remove the default grid lines, use the app's color palette, set font to the monospace font at 10px for axis labels.
- Tooltips should be dark (bg-bg-secondary with border-border) and show monospace numbers.
- Add micro-visualizations: inline sparklines (tiny line charts, ~60px wide) next to growth numbers in tables showing the last 4 quarters of that metric. Use a simple SVG or canvas element — doesn't need to be a full Recharts instance.
- The SectorHeatmap should use a proper continuous color scale (red → gray → green) based on the metric value, not discrete buckets.

**E. Layout and navigation refinements**

- Sidebar: reduce width from `w-56` to `w-48`. Make nav items smaller (py-1.5 instead of py-2). Add a thin colored indicator line on the left of the active nav item instead of the current background highlight.
- Header: make it more compact. The season progress bar should be more prominent — it's the key "how far are we" indicator.
- Add a global search/command palette (Cmd+K) that lets you search for companies by ticker or name and jump directly to their detail page. Use a simple modal with a text input and filtered results list.
- Add a "last updated" timestamp in the sidebar footer showing when the data was last refreshed.

**F. Responsive polish**

- The app should be usable at 1280px minimum width (standard laptop). Below that, collapse the sidebar into a hamburger menu.
- Tables with many columns should have a horizontally scrollable container with the ticker/company columns frozen on the left.

---

## Implementation Notes

- **Run the dev server** (`npm run dev`) before you start to verify the current state. Run it again after each major change area.
- **Schema changes first** — update `schema.sql`, then update the seed JSON structures and `seed-db.ts` to match, then run `npm run seed` to verify the DB rebuilds.
- **Backend routes second** — add new endpoints or modify existing ones to serve the new data shapes. Add routes for `/api/regions`, `/api/segments`, and update `/api/scorecard` and `/api/sectors` to return the new metrics.
- **Frontend last** — build the new pages and components, update existing ones.
- **Keep existing things working** — don't break the Calendar, Themes, AI Insights, or Company Detail pages. They can stay largely as-is for now (though they should pick up the design tightening).
- **Type safety** — update TypeScript interfaces in both `client/src/types/` and `server/src/` as you extend the schema.
- **Test the build** — run `npm run build` at the end to make sure the Vercel deployment bundle still works. The `vercel.json` is configured to include `server/data/**` in the function bundle.
