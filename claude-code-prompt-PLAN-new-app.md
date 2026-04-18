# Claude Code Prompt — PLAN a New Q1 2026 Earnings App (Greenfield, FactSet-Aligned)

Paste the block between the fences into a fresh Claude Code session opened at the same parent directory as `2026 Q1 Earnings Season/`. The session should read — but not modify — the existing app, read the FactSet Earnings Insight PDF as its north star, and produce a comprehensive PLAN document for a brand-new app in a new folder. No implementation in this session; the deliverable is a plan the user will hand to a subsequent build session.

Before running, copy the PDF into a readable location, e.g. `./EarningsInsight_041726.pdf`, and tell the session where it is.

---

```
You are a software architect. Your deliverable for this session is a PLAN, not an implementation. You will read the FactSet Earnings Insight PDF (EarningsInsight_041726.pdf, dated April 17, 2026, John Butters, VP Senior Earnings Analyst), study the existing Q1 2026 Earnings Tracker at ../2026 Q1 Earnings Season/ (read-only reference), and produce a comprehensive plan for a brand-new app in a new sibling folder: ../q1-2026-earnings-v2/.

The new app must:
  (a) Mirror the structure, depth, and visual framing of the FactSet Earnings Insight weekly report.
  (b) Treat the PDF as the canonical, refresh-at-will data source — a newer-dated PDF must drop in with zero code changes.
  (c) Add interactive, programmatic, and analytical features a static PDF cannot offer.
  (d) Be architected from day one around source tiering, sense-checking, and idempotent refresh.

Do NOT write application code. Do create a PLAN directory at ../q1-2026-earnings-v2/PLAN/ with the documents enumerated below. Use Markdown throughout. Cite a PDF page number next to every data element you reference.

====================================================================
PLAN DELIVERABLES — produce each as a standalone Markdown file
====================================================================

PLAN/00-README.md
  - One-paragraph elevator pitch.
  - "How to use this plan" — the order a future build session should consume the docs.
  - Links to each subsequent file.
  - A short section on what was kept / discarded / changed from the prior app at ../2026 Q1 Earnings Season/ and the rationale.

PLAN/01-north-star-data-model.md
  - Enumerate every metric in the FactSet PDF (scorecard %s, blended growth, revisions, sector growth, margins, forward estimates, forward & trailing P/E, geographic exposure, bottom-up EPS series, target & ratings, guidance counts, topic-of-the-week, top contributors, surprises, calendar count).
  - For each: name, unit, scope (index / sector / industry / company), source PDF page, refresh cadence.
  - Propose a typed schema (TypeScript interfaces in prose) with the tiering metadata described in 03-architecture.md.
  - Call out where the PDF reports ONLY sector-level data and the app should expose drill-downs beyond the PDF.

PLAN/02-ux-sitemap.md
  - Sitemap mirroring the PDF's Table of Contents (Key Metrics → Topic of the Week → Overview → Scorecard → Revisions → Earnings Growth → Revenue Growth → Net Profit Margin → Forward Estimates & Valuation → Geographic Exposure → Bottom-Up EPS → Forward / Trailing P/E → Targets & Ratings).
  - One page per section; wireframe sketches (ASCII or Markdown layout) of the primary components.
  - Landing/dashboard composition: single-screen executive summary showing the 8 hero numbers from page 1 of the PDF (13.2% earnings growth, 9.9% revenue growth, 88% EPS beat rate, 84% revenue beat rate, 10.8% agg EPS surprise, 20.9 fwd P/E, 8325.60 target, 6th consecutive quarter of double-digit growth).
  - Interaction model: filter by sector, compare vs Mar 31, toggle Mag 7 / Mag 7 ex-NVDA / Other 493, toggle US-only / International-only revenue cohort.

PLAN/03-architecture.md
  - Stack recommendation: Next.js 14+ App Router (server components for data-heavy pages, client components for charts) + Postgres (or SQLite for local dev) + Drizzle ORM + Recharts/Visx for visualizations. Justify vs the current Vite/Express/sql.js stack (document current pain points: corrupted JSON seeds, no migrations, no source tiering, no refresh pipeline, SPA routing issues).
  - Source-tier enum and how it propagates through DB → API → UI badges:
      tier_1_factset_insight
      tier_2_company_filing
      tier_3_wire
      tier_4_aggregator
      tier_5_legacy
  - Data-flow diagram (Markdown/Mermaid): PDF drop → parser → canonical JSON → reconciler → DB → API → page.
  - Idempotent refresh: content-addressed PDF hashing; (report_date, metric, scope) primary keys; diff-log write per refresh.
  - Observability: what gets logged on each refresh (figures added, changed, demoted, unparsed).

PLAN/04-data-pipeline.md
  - PDF parser strategy:
      primary: pdfjs-dist text-layer extraction
      fallback: pdf-parse regex over raw text
      manual override: YAML file under data/manual-overrides/ keyed by (report_date, metric)
  - Extraction patterns by section (the regex shapes the parser will need — e.g., "The blended (year-over-year) earnings growth rate for Q1 2026 is (\d+\.\d+)%.").
  - Reconciliation algorithm: for each metric, if PDF value exists, write with tier_1; for company-level metrics not in PDF, defer to company filings; preserve prior_value; emit diff.
  - Validation gates (must pass on CI and pre-build):
      • PDF parse coverage ≥ threshold (target 95% of known-metric regex hits).
      • Every "reported" company in the DB has non-null actuals.
      • Every sector aggregate in the DB matches its PDF counterpart within tolerance.
      • No orphan commentary records (commentary.ticker must map to a reported earnings row).
  - Refresh cadence: manual drop + "refresh" button in admin UI + scheduled weekly task (Friday 6pm ET, after FactSet typically publishes).

PLAN/05-features-beyond-the-pdf.md — the "additional supplementing features" — each with rationale, data dependency, and UI sketch:

   5a. Time-machine mode — step through every weekly edition and animate how 13.2% blended growth evolved from the start of the season. Requires archiving each weekly PDF under data/sources/archive/<YYYY-MM-DD>.pdf.

   5b. Estimate-drift tracker — per-sector and per-ticker line charts of the Mar 31 → today trajectory (PDF reports both; app should expose the full series week over week).

   5c. Mag 7 / ex-NVDA toggle — interactive version of PDF pages 3–4, with per-ticker contribution attribution (Sandisk, Micron, Eli Lilly, Broadcom, NVIDIA — PDF page 4).

   5d. Scenario lens — "what does Q1 earnings growth look like if Energy is excluded?" — recomputes blended growth excluding user-selected sectors or tickers. Mirrors the PDF's Exxon-excluded commentary on page 10.

   5e. Company dossier pages — per-ticker page with actual vs estimate, surprise %, prior-year base, peer-sector comparison, Buy/Hold/Sell ratings breakdown. Links to 8-K filings.

   5f. Guidance watch — live board of Q2 2026 preannouncements (4 negative, 3 positive per page 12) that updates as more companies issue.

   5g. Geographic exposure explorer — filter the index by US-revenue % threshold to reproduce the PDF's page-19 US-vs-international growth comparison (15.5% vs 8.0% earnings growth for Q1 2026).

   5h. Ratings heatmap — sector × Buy/Hold/Sell grid with drill-down to ticker-level ratings.

   5i. Valuation context panel — fwd P/E 20.9 vs 5-yr 19.9 vs 10-yr 18.9, with the 10-year series from PDF page 31. Overlay EPS estimate changes vs price changes.

   5j. Alert rules — user-defined alerts (e.g., "notify me when Energy sector blended growth crosses 0%").

   5k. API access — expose the canonical dataset as a read-only JSON API so downstream tools (the BII deck builder, the update-equity-returns workflow, NotebookLM outlines) can pull the exact same numbers.

   5l. Export — one-click export to xlsx (a matrix of every canonical figure) and to a PowerPoint deck that mirrors the PDF section layout.

   5m. Provenance drawer — click any figure, see a side panel with PDF page thumbnail, the exact sentence extracted, and the source tier.

PLAN/06-build-order.md
  - Sequenced implementation milestones (each "milestone" is one Claude Code session-worth of work):
      M1. Repo scaffold + data contract + PDF ingestion happy path (hero numbers only).
      M2. Full PDF parser + reconciler + diff log.
      M3. Dashboard + Scorecard + Growth pages.
      M4. Revisions + Margins + Forward Estimates pages.
      M5. Geographic + Ratings + Bottom-Up EPS pages.
      M6. Topic of the Week + Forward Outlook + Calendar.
      M7. Company dossiers + Guidance Watch + Surprises.
      M8. Scenario lens + Mag 7 toggle + Time machine.
      M9. Exports + API + Alerts.
      M10. Polish, accessibility, deploy to Vercel, backfill prior-week archives.
  - Each milestone: what ships, what data feeds it, what validation gates run.

PLAN/07-testing-and-validation.md
  - Unit: parser regex coverage tests against a fixture PDF.
  - Integration: reconciler idempotency — running twice with the same PDF produces zero diff.
  - Snapshot: canonical/q1-2026.json checked into repo; CI fails if parser output diverges.
  - E2E (Playwright): 20 assertions that specific PDF figures render on specific pages.
  - Manual: a weekly refresh rehearsal script (drop new PDF, run refresh, eyeball the diff log, approve).

PLAN/08-migration-from-v1.md
  - What to carry over from ../2026 Q1 Earnings Season/: the companies.json roster, the calendar entries, the commentary records (after orphan cleanup), the sector taxonomy.
  - What to leave behind: the fabricated / unverified numeric values, gross_margin columns for Financials, the broken SPA routing config, the truncated JSON seed.
  - How to validate parity between v1 and v2 during the overlap: run both against the same PDF and diff their outputs.

PLAN/09-open-questions.md
  - A list of decisions Sam needs to make before implementation starts:
      • Postgres vs SQLite for v2?
      • Deploy target — Vercel (match v1) or a different host?
      • Is a paid FactSet API plausible as a future tier_0 source, or does the PDF remain the only input?
      • Multi-quarter support on day one, or Q1 2026 only?
      • Authentication: public read-only or gated?
      • Retention policy for archived PDFs?

PLAN/10-appendix-pdf-extract.md
  - A transcription — one table per PDF section — of every numeric figure with page number, so the future build session has a ground-truth reference without re-parsing the PDF. Mirror the structure of the extract produced in PLAN/01.

====================================================================
RULES OF ENGAGEMENT
====================================================================

1. Do not create the v2 app's source code, package.json, or Next config. This session is plan-only.
2. Do not modify any file in ../2026 Q1 Earnings Season/.
3. Every figure you cite must include a PDF page number.
4. Where the prior app and the PDF conflict, the PDF wins; note the conflict in 08-migration-from-v1.md.
5. Keep the PLAN directory self-contained — a future developer opening ../q1-2026-earnings-v2/PLAN/00-README.md should be able to build v2 without re-reading the PDF.
6. Close with a summary in 00-README.md that quantifies: number of metrics cataloged, number of pages planned, number of supplementing features proposed, number of migration items from v1.
```

---

## Notes for Sam before running

- This session produces DOCUMENTS only — nothing in `../q1-2026-earnings-v2/` outside `PLAN/`. A follow-up Claude Code session (opened at `../q1-2026-earnings-v2/`) will consume the plan and build from milestone M1.
- If the session has trouble reading the PDF (text-layer extraction issues), point it at the Markdown extract the enhancement session produces (`docs/factset-extract-2026-04-17.md`) as a fallback.
- The two Claude Code prompts (enhance + plan) are compatible and can run in parallel in separate sessions; they share the same "north star" PDF but touch disjoint directories.
