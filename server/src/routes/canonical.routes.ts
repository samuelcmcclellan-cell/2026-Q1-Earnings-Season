import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANONICAL_PATH = path.join(__dirname, '..', '..', 'data', 'canonical', 'q1-2026.json');
const AGGREGATES_PATH = path.join(__dirname, '..', '..', 'data', 'seed', 'index-aggregates-q1-2026.json');

const router = Router();

let cachedCanonical: any = null;
let cachedAggregates: any = null;

function loadCanonical() {
  if (!cachedCanonical) {
    cachedCanonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
  }
  return cachedCanonical;
}

function loadAggregates() {
  if (!cachedAggregates) {
    cachedAggregates = JSON.parse(fs.readFileSync(AGGREGATES_PATH, 'utf8'));
  }
  return cachedAggregates;
}

/** GET /api/canonical — the full canonical report */
router.get('/', (_req, res) => {
  res.json(loadCanonical());
});

/** GET /api/canonical/aggregates — the headline aggregates seed */
router.get('/aggregates', (_req, res) => {
  res.json(loadAggregates());
});

/** GET /api/canonical/scorecard */
router.get('/scorecard', (_req, res) => {
  res.json(loadCanonical().scorecard);
});

/** GET /api/canonical/topic-of-the-week */
router.get('/topic-of-the-week', (_req, res) => {
  const c = loadCanonical();
  res.json({ topic: c.topic_of_the_week, contributors: c.top_contributors });
});

/** GET /api/canonical/forward-outlook */
router.get('/forward-outlook', (_req, res) => {
  res.json(loadCanonical().forward_estimates);
});

/** GET /api/canonical/bottom-up-eps */
router.get('/bottom-up-eps', (_req, res) => {
  res.json(loadCanonical().bottom_up_eps);
});

/** GET /api/canonical/geographic */
router.get('/geographic', (_req, res) => {
  res.json(loadCanonical().geographic);
});

/** GET /api/canonical/surprises */
router.get('/surprises', (_req, res) => {
  res.json(loadCanonical().top_surprises);
});

/** GET /api/canonical/ratings */
router.get('/ratings', (_req, res) => {
  res.json(loadCanonical().targets_ratings);
});

/** GET /api/canonical/guidance */
router.get('/guidance', (_req, res) => {
  res.json(loadCanonical().guidance_counts);
});

/** GET /api/canonical/sector-metrics */
router.get('/sector-metrics', (_req, res) => {
  res.json(loadCanonical().sector_metrics);
});

/** GET /api/canonical/valuation */
router.get('/valuation', (_req, res) => {
  res.json(loadCanonical().valuation);
});

/** GET /api/canonical/margin */
router.get('/margin', (_req, res) => {
  res.json(loadCanonical().margin);
});

/** GET /api/canonical/meta — small summary for the dashboard header */
router.get('/meta', (_req, res) => {
  const c = loadCanonical();
  // Count T1 figures for the header subtitle
  let tier1Count = 0;
  const walk = (v: any) => {
    if (!v || typeof v !== 'object') return;
    if ('source_tier' in v && v.source_tier === 'tier_1_factset_insight') tier1Count++;
    for (const k of Object.keys(v)) walk(v[k]);
  };
  walk(c);
  res.json({
    report_date: c.report_date,
    quarter: c.quarter,
    source_file: c.source_file,
    source_sha256: c.source_sha256,
    tier1_figure_count: tier1Count,
  });
});

export default router;
