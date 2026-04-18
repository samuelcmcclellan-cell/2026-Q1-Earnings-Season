# Upgrade Summary — Q1 2026 Earnings Tracker

**Date:** 2026-04-17 (through 2026-04-18)
**Source of truth:** `server/data/sources/EarningsInsight_041726.pdf` (FactSet Earnings Insight, April 17, 2026) — sha256 `5f67601724ce…`

This refactor rebuilt the Q1 2026 Earnings Tracker around a single authoritative PDF and made the numeric pipeline refreshable, tierable, and verifiable.

## What changed

### New data layer
- **5-tier source hierarchy** (`tier_1_factset_insight` → `tier_5_seed_legacy`) defined in `server/src/data-contract/index.ts`. Every TracedValue carries `{value, unit, source_tier, source_page, as_of}`.
- **Canonical JSON** at `server/data/canonical/q1-2026.json` with 200+ figures, each traceable to a PDF page.
- **Headline aggregates** at `server/data/seed/index-aggregates-q1-2026.json` — 16 tier-1 figures that power the dashboard subtitle.
- **Seed provenance**: every earnings record whose numbers were touched during the migration now carries a record-level `provenance` block (+ optional `field_sources`, `prior_values` maps).

### New backend surface
- Express router + Vercel inline router both expose `/api/canonical/*` (14 endpoints): `meta`, `aggregates`, `scorecard`, `topic-of-the-week`, `forward-outlook`, `bottom-up-eps`, `geographic`, `surprises`, `ratings`, `guidance`, `sector-metrics`, `valuation`, `margin`, and the full `/` dump.

### New UI
- **Six new pages**: Topic of the Week, Forward Outlook, Bottom-Up EPS (with line-chart), Geographic Exposure, Surprises (top/bottom EPS & revenue), Ratings & Guidance.
- **TierBadge** component (T1 green → T5 gray) with hover tooltips showing source page and `as_of`.
- **Sidebar** re-ordered to surface FactSet-derived modules first, legacy exploration (Sectors / Regions / Segments / Earnings / Calendar) below.
- **Header subtitle** now reads *"FactSet Earnings Insight (N T1 figures, 2026-04-17)"* and tooltips the PDF filename + sha256 prefix.

### Refresh pipeline
- `scripts/ingest-factset-pdf.mjs` — content-addresses the PDF (sha256), extracts the text layer with `pdftotext -layout`, updates `source_sha256` in the canonical file, writes `server/data/sources/.hash.json`. Idempotent — re-running with unchanged PDF is a no-op.
- `scripts/reconcile-seed.mjs` — runs `migrate-seed-to-tiered.mjs` followed by `validate-seed.mjs`.
- `scripts/validate-seed.mjs` — expanded to (a) require at least one actual field on reported rows (warn on partial data), (b) enforce `gross_margin = null` for Financials, (c) schema-check `aggregates.*` entries for `source_tier` and `source_page`, (d) cross-check canonical top-surprises against seed within 0.5 pp / 0.5% tolerance.
- `package.json` — new `ingest-pdf`, `reconcile-seed`, `refresh-from-pdf` scripts.
- `vercel.json` — `buildCommand` prepends `node scripts/validate-seed.mjs` so a broken seed blocks deploy.

### Reconciled conflicts
- **18 seed records** were patched with PDF values above tolerance — documented in `docs/reconciliation-log-2026-04-17.md` and `docs/conflict-report-2026-04-17.md`.
- **All Financials** (JPM, WFC, GS, C, MS, BK, BAC, TFC, …) have `gross_margin = null` with UI rendering "—".
- **JPM revenue** reconciled from `50.54B` (prior audit claim) → `49.84B` (PDF p.9); prior value preserved in `prior_values.revenue_actual`.

## Spot-check (10 tier-1 figures vs PDF)

| Metric | PDF | Seed | Page |
|---|---:|---:|:-:|
| Blended EPS growth YoY | 13.2% | 13.2% | 1 |
| Blended revenue growth YoY | 9.9% | 9.9% | 1 |
| % S&P 500 reporting | 10% | 10% | 5 |
| % beat EPS | 88% | 88% | 5 |
| % beat revenue | 84% | 84% | 5 |
| Aggregate EPS surprise | 10.8% | 10.8% | 6 |
| Forward P/E (12m) | 20.9x | 20.9x | 6 |
| Forward P/E 5yr avg | 19.9x | 19.9x | 1 |
| Bottom-up target price | $8,325.60 | $8,325.60 | 12 |
| Companies reporting next week | 93 | 93 | 6 |

**10/10 match PDF exactly.**

## Validator / build output

- `node scripts/validate-seed.mjs` → **passes** (208 companies, 32 reported, 174 upcoming, 35 commentary, 16 aggregates, canonical sha256 populated). Emits warnings for partial surprise-only rows (MKC, STZ, GIS, PGR, CAG, LEN, CTAS, DRI, FAST) where the PDF provides surprise % but not underlying actuals.
- `cd client && npx vite build` → **succeeds** (2,622 modules, 865 kB / 242 kB gzipped).
- `node scripts/ingest-factset-pdf.mjs` → updates sha256 and manifest on first run, then prints "hash unchanged — Done." on subsequent runs.

## How to refresh next week

1. Drop `EarningsInsight_042425.pdf` (or whatever filename) into `server/data/sources/`.
2. Update `PDF_OVERRIDES` in `scripts/migrate-seed-to-tiered.mjs` with any new ticker figures pulled from the new PDF.
3. Run `npm run refresh-from-pdf`.
4. Eyeball `docs/reconciliation-log-2026-04-17.md` to confirm the diff is expected.
5. Commit and push.

## Commits

| Step | SHA | Summary |
|:-:|:-|:-|
| 1 | a2a1034 | inventory + extract + gap analysis |
| 2 | 4fc2297 | canonical data contract + seed migration with source tiers |
| 3 | c3b0876 | canonical routes + TierBadge + six new pages |
| 4 | cafc70e | formal conflict report |
| 5 | 8d44d63 | refresh pipeline scripts |
| 6 | e3c94da | header subtitle with canonical meta |
| 7 | (this) | upgrade summary |

## Known follow-ups

- Pages 14-33 of the PDF are rasterized charts. Transcribed figures carry `notes: "chart transcription"` and should be re-verified once an automated OCR step lands.
- The partial-data warnings from `validate-seed.mjs` (MKC, STZ, GIS, PGR, …) reflect data the PDF doesn't publish in full; either upgrade them to tier-2 (10-Q filings) as those drop, or accept the warnings.
- Bundle size is 865 kB — consider `manualChunks` for Recharts and TanStack Table if the chart footprint grows.
