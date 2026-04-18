#!/usr/bin/env node
// Migrates server/data/seed/earnings-q1-2026.json by adding provenance metadata
// (source_tier, source_page, prior_values, as_of) and applying PDF-authoritative
// overrides where the FactSet Earnings Insight (2026-04-17) conflicts with the seed.
//
// This script is idempotent. Re-running it has no additional effect.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, '..', 'server', 'data', 'seed', 'earnings-q1-2026.json');
const LOG_PATH = path.join(__dirname, '..', 'docs', 'reconciliation-log-2026-04-17.md');

const AS_OF = '2026-04-17';

// FactSet Earnings Insight (2026-04-17) authoritative overrides.
// Each entry: ticker -> { fields: {...}, source_page, notes }.
// `fields` contains PDF values for numeric columns. Any that differ from the
// current seed by more than tolerance will be overwritten and the prior value
// stored under record.prior_values.
const PDF_OVERRIDES = {
  // === Financials (pages 7-9) ===
  JPM: {
    status: 'reported',
    fields: {
      eps_actual: 5.94, eps_estimate: 5.47, revenue_actual: 49_840_000_000, revenue_estimate: 49_180_000_000,
      eps_surprise_pct: 8.6, revenue_surprise_pct: 1.3,
    },
    source_page: 7,
    notes: 'JPM EPS 5.94 vs 5.47; revenue 49.84B vs 49.18B (PDF page 9).',
  },
  C: {
    status: 'reported',
    fields: {
      eps_actual: 3.06, eps_estimate: 2.65, revenue_actual: 24_630_000_000, revenue_estimate: 23_600_000_000,
      eps_surprise_pct: 15.5, revenue_surprise_pct: 4.4,
    },
    source_page: 7,
    notes: 'Citigroup EPS 3.06 vs 2.65; revenue 24.63B (PDF page 9).',
  },
  BAC: {
    status: 'reported',
    fields: {
      eps_actual: 1.11, eps_estimate: 1.01,
      eps_surprise_pct: 9.9,
    },
    source_page: 7,
  },
  MS: {
    status: 'reported',
    fields: {
      eps_actual: 3.43, eps_estimate: 3.02, revenue_actual: 20_580_000_000, revenue_estimate: 19_740_000_000,
      eps_surprise_pct: 13.6, revenue_surprise_pct: 4.3,
    },
    source_page: 7,
  },
  TFC: {
    status: 'reported',
    fields: { eps_actual: 1.09, eps_estimate: 1.00, eps_surprise_pct: 9.0 },
    source_page: 7,
  },
  TRV: {
    status: 'reported',
    fields: { eps_actual: 7.71, eps_estimate: 7.07, eps_surprise_pct: 9.1 },
    source_page: 7,
  },
  WFC: {
    status: 'reported',
    fields: { eps_growth_yoy: 15.1 },
    source_page: 8,
    notes: 'WFC EPS growth YoY corrected to ~15.1 per PDF sector narrative.',
  },
  GS: {
    status: 'reported',
    fields: { guidance_direction: 'maintained' },
    source_page: 7,
    notes: 'GS guidance maintained (previously "raised" in seed).',
  },
  BK: {
    status: 'reported',
    fields: { eps_actual: 2.24, eps_estimate: 1.96, eps_surprise_pct: 14.3 },
    source_page: 7,
  },

  // === Communication Services (page 6) ===
  NFLX: {
    status: 'reported',
    fields: { eps_actual: 1.23, eps_estimate: 0.76, eps_surprise_pct: 61.2 },
    source_page: 6,
    notes: 'Netflix GAAP EPS 1.23 includes $2.8B Warner Bros. termination fee.',
  },

  // === Information Technology (page 6) ===
  MU: {
    status: 'reported',
    fields: { eps_actual: 12.20, eps_estimate: 9.19, eps_surprise_pct: 32.9 },
    source_page: 6,
  },

  // === Industrials (page 6, 17) ===
  FDX: {
    status: 'reported',
    fields: { eps_actual: 5.25, eps_estimate: 4.15, eps_surprise_pct: 26.5 },
    source_page: 6,
  },
  DAL: {
    status: 'reported',
    fields: { eps_actual: 0.64, eps_estimate: 0.58, eps_surprise_pct: 10.4 },
    source_page: 6,
  },

  // === Consumer (page 17 surprises) ===
  NKE: {
    status: 'reported',
    fields: { eps_surprise_pct: 20.4 },
    source_page: 17,
  },
  MKC: {
    status: 'reported',
    fields: { eps_surprise_pct: 11.2 },
    source_page: 17,
  },
  STZ: {
    status: 'reported',
    fields: { eps_surprise_pct: 10.8 },
    source_page: 17,
  },

  // === Energy / HC (page 8) downward revisions ===
  XOM: {
    fields: { eps_estimate: 1.07 },
    source_page: 8,
    notes: 'Exxon Mobil Q1 EPS lowered to 1.07 (from 1.83 since Mar 31).',
  },
  CVX: {
    fields: { eps_estimate: 1.24 },
    source_page: 8,
    notes: 'Chevron Q1 EPS lowered to 1.24 (from 1.91 since Mar 31).',
  },
  PSX: {
    fields: { eps_estimate: -0.56 },
    source_page: 8,
    notes: 'Phillips 66 Q1 EPS lowered to -0.56 (from 2.07 since Mar 31).',
  },
  ABBV: {
    fields: { eps_estimate: 2.59 },
    source_page: 8,
    notes: 'AbbVie Q1 EPS lowered to 2.59 (from 3.02 since Mar 31).',
  },
  F: {
    fields: { revenue_estimate: 42_660_000_000 },
    source_page: 9,
    notes: 'Ford Q1 revenue lowered to 42.66B (from 43.46B since Mar 31).',
  },
  TSLA: {
    fields: { revenue_estimate: 22_280_000_000 },
    source_page: 9,
    notes: 'Tesla Q1 revenue lowered to 22.28B (from 22.96B since Mar 31).',
  },

  // === Bottom 10 surprises (page 17) ===
  COST: { status: 'reported', fields: { eps_surprise_pct: 0.7 }, source_page: 17 },
  PLD:  { status: 'reported', fields: { eps_surprise_pct: 0.6 }, source_page: 17 },
  FAST: { status: 'reported', fields: { eps_surprise_pct: 0.4 }, source_page: 17 },
  DRI:  { status: 'reported', fields: { eps_surprise_pct: 0.2 }, source_page: 17 },
  CTAS: { status: 'reported', fields: { eps_surprise_pct: 0.1 }, source_page: 17 },
  LEN:  { status: 'reported', fields: { eps_surprise_pct: -2.4 }, source_page: 17 },
  CAG:  { status: 'reported', fields: { eps_surprise_pct: -2.9 }, source_page: 17 },
  PGR:  { status: 'reported', fields: { eps_surprise_pct: -5.7 }, source_page: 17 },
  GIS:  { status: 'reported', fields: { eps_surprise_pct: -12.1 }, source_page: 17 },

  // ABT already reported with 0.5 surprise per PDF; seed has 0.
  ABT: {
    status: 'reported',
    fields: { eps_surprise_pct: 0.5 },
    source_page: 17,
  },
};

// Financials tickers — nullify gross_margin per banking convention. Net profit
// margin is the correct sector metric (PDF page 11).
const FINANCIALS_TICKERS = new Set([
  'JPM','WFC','C','GS','BLK','BAC','MS','PNC','USB','SCHW','COF','TFC','CB','MMC','AXP','BK','TRV','PGR'
]);

const RATE_TOLERANCE = 0.5; // pct points
const CURRENCY_TOLERANCE_PCT = 0.5; // % of value

function isRateField(field) {
  return /_pct$|_growth_yoy$|_growth_qoq$|margin/.test(field);
}

function delta(oldVal, newVal, field) {
  if (oldVal == null || newVal == null) return null;
  if (isRateField(field)) return Math.abs(newVal - oldVal);
  // currency / scalar
  const denom = Math.max(Math.abs(oldVal), 1e-6);
  return (Math.abs(newVal - oldVal) / denom) * 100;
}

function exceedsTolerance(oldVal, newVal, field) {
  if (oldVal == null || newVal == null) return oldVal !== newVal;
  const d = delta(oldVal, newVal, field);
  if (d == null) return false;
  return isRateField(field) ? d > RATE_TOLERANCE : d > CURRENCY_TOLERANCE_PCT;
}

function main() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const log = [];

  for (const rec of seed) {
    // Skip Samsung (SSNLF) and other fabricated entries flagged for removal.
    if (rec.ticker === 'SSNLF') continue;

    // Ensure provenance block exists.
    rec.provenance ??= {};
    rec.provenance.source_tier ??= rec.data_source === 'seed' || !rec.data_source
      ? 'tier_5_seed_legacy'
      : rec.data_source === 'fmp' || rec.data_source === 'finnhub'
        ? 'tier_4_aggregator'
        : 'tier_5_seed_legacy';
    rec.provenance.as_of ??= AS_OF;
    rec.provenance.source_page ??= null;
    rec.provenance.field_sources ??= {};
    rec.prior_values ??= {};

    // Financials: blank gross_margin + operating_margin (sector NPM is the correct metric)
    if (FINANCIALS_TICKERS.has(rec.ticker)) {
      for (const f of ['gross_margin', 'gross_margin_prior', 'operating_margin', 'operating_margin_prior']) {
        if (rec[f] != null) {
          rec.prior_values[f] = rec[f];
          rec[f] = null;
          log.push({ ticker: rec.ticker, field: f, before: rec.prior_values[f], after: null,
                     reason: 'Financials: gross/operating margin n/a; sector net profit margin is the correct banking metric',
                     source_page: 11 });
        }
      }
    }

    const override = PDF_OVERRIDES[rec.ticker];
    if (!override) continue;

    // Apply status promotion
    if (override.status && rec.status !== override.status) {
      log.push({ ticker: rec.ticker, field: 'status', before: rec.status, after: override.status,
                 reason: 'PDF lists ticker as reported', source_page: override.source_page });
      rec.status = override.status;
    }

    for (const [field, newVal] of Object.entries(override.fields ?? {})) {
      const oldVal = rec[field];
      if (oldVal === newVal) continue;

      // String fields (guidance_direction) — overwrite if different
      if (typeof newVal === 'string') {
        if (oldVal !== newVal) {
          rec.prior_values[field] = oldVal;
          rec[field] = newVal;
          rec.provenance.field_sources[field] = {
            source_tier: 'tier_1_factset_insight',
            source_page: override.source_page,
            as_of: AS_OF,
          };
          log.push({ ticker: rec.ticker, field, before: oldVal, after: newVal,
                     reason: override.notes ?? 'PDF override', source_page: override.source_page });
        }
        continue;
      }

      // Numeric
      const exceed = exceedsTolerance(oldVal, newVal, field);
      if (exceed || oldVal == null) {
        rec.prior_values[field] = oldVal;
        rec[field] = newVal;
        rec.provenance.field_sources[field] = {
          source_tier: 'tier_1_factset_insight',
          source_page: override.source_page,
          as_of: AS_OF,
        };
        log.push({ ticker: rec.ticker, field, before: oldVal, after: newVal,
                   reason: override.notes ?? 'PDF overrides seed (delta exceeds tolerance)',
                   source_page: override.source_page });
      } else {
        // Within tolerance — keep seed but tag with PDF page for traceability
        rec.provenance.field_sources[field] = {
          source_tier: 'tier_5_seed_legacy',
          source_page: override.source_page,
          as_of: AS_OF,
          notes: 'Seed within tolerance of PDF; page recorded for verification.',
        };
      }
    }

    // Promote top-level record tier to tier_1 if any field is now PDF-sourced
    const hasTier1Field = Object.values(rec.provenance.field_sources).some(
      s => s.source_tier === 'tier_1_factset_insight'
    );
    if (hasTier1Field) {
      rec.provenance.source_tier = 'tier_1_factset_insight';
      rec.provenance.source_page = override.source_page;
      rec.data_source = 'factset_insight';
    }
  }

  // Remove SSNLF if present
  const cleaned = seed.filter(r => r.ticker !== 'SSNLF');

  fs.writeFileSync(SEED_PATH, JSON.stringify(cleaned, null, 2) + '\n');

  // Write reconciliation log
  const md = [
    '# Reconciliation Log — FactSet Earnings Insight 2026-04-17',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Total changes: **${log.length}**`,
    '',
    '| Ticker | Field | Before | After | Reason | Source Page |',
    '|---|---|---|---|---|---|',
    ...log.map(e => `| ${e.ticker} | ${e.field} | ${JSON.stringify(e.before)} | ${JSON.stringify(e.after)} | ${e.reason} | ${e.source_page} |`),
    '',
  ].join('\n');
  fs.writeFileSync(LOG_PATH, md);

  console.log(`migrate-seed-to-tiered: applied ${log.length} changes`);
}

main();
