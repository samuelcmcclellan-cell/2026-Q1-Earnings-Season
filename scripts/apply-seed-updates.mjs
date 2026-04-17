// One-shot script to apply Q1 2026 seed corrections per the audit prompt.
// Steps 2, 3, 4, 5, and 7 (Financials gross_margin null).
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const SEED = path.join(ROOT, 'server/data/seed/earnings-q1-2026.json');
const COMMENTARY = path.join(ROOT, 'server/data/seed/commentary-q1-2026.json');

const earnings = JSON.parse(fs.readFileSync(SEED, 'utf8'));
const commentary = JSON.parse(fs.readFileSync(COMMENTARY, 'utf8'));

function patch(ticker, fields) {
  const r = earnings.find((x) => x.ticker === ticker);
  if (!r) {
    throw new Error(`Missing ticker ${ticker}`);
  }
  Object.assign(r, fields);
  return r;
}

// ---- STEP 2: corrections to existing reported records ----
patch('C', {
  eps_actual: 3.06,
  revenue_actual: 24630000000,
  eps_estimate: 2.65,
  eps_actual_prior_year: 1.96,
  revenue_actual_prior_year: 21600000000,
  eps_surprise_pct: 15.5,
  revenue_surprise_pct: 4.6,
  eps_growth_yoy: 56.1,
  revenue_growth_yoy: 14.0,
  gross_margin: null,
  gross_margin_prior: null,
  data_source: 'verified',
});

patch('JPM', {
  eps_actual: 5.94,
  eps_estimate: 5.45,
  revenue_actual: 50540000000,
  revenue_estimate: 49170000000,
  eps_actual_prior_year: 5.07,
  revenue_actual_prior_year: 46010000000,
  eps_surprise_pct: 9.0,
  revenue_surprise_pct: 2.8,
  eps_growth_yoy: 17.2,
  revenue_growth_yoy: 9.8,
  guidance_direction: 'lowered',
  stock_reaction_pct: -0.9,
  gross_margin: null,
  gross_margin_prior: null,
  data_source: 'verified',
});

patch('WFC', {
  eps_actual: 1.60,
  eps_estimate: 1.59,
  revenue_actual: 21450000000,
  revenue_estimate: 21770000000,
  eps_actual_prior_year: 1.39,
  revenue_actual_prior_year: 20150000000,
  eps_surprise_pct: 0.6,
  revenue_surprise_pct: -1.5,
  eps_growth_yoy: 15.1,
  revenue_growth_yoy: 6.5,
  guidance_direction: 'maintained',
  stock_reaction_pct: -4.9,
  gross_margin: null,
  gross_margin_prior: null,
  data_source: 'verified',
});

patch('GS', {
  eps_actual: 17.55,
  eps_estimate: 16.47,
  revenue_actual: 17230000000,
  revenue_estimate: 16950000000,
  eps_actual_prior_year: 14.12,
  revenue_actual_prior_year: 15060000000,
  eps_surprise_pct: 6.6,
  revenue_surprise_pct: 1.7,
  eps_growth_yoy: 24.3,
  revenue_growth_yoy: 14.4,
  guidance_direction: 'maintained',
  stock_reaction_pct: -3.1,
  gross_margin: null,
  gross_margin_prior: null,
  data_source: 'verified',
});

patch('BLK', {
  report_date: '2026-04-14',
  eps_actual: 14.06,
  eps_estimate: 11.64,
  revenue_actual: 6700000000,
  revenue_estimate: 6150000000,
  eps_actual_prior_year: 9.64,
  revenue_actual_prior_year: 5276000000,
  eps_surprise_pct: 20.8,
  revenue_surprise_pct: 8.9,
  eps_growth_yoy: 45.9,
  revenue_growth_yoy: 27.0,
  guidance_direction: 'maintained',
  stock_reaction_pct: 2.1,
  gross_margin: null,
  gross_margin_prior: null,
  data_source: 'verified',
});

// ---- STEP 3: newly reported companies ----
patch('JNJ', {
  status: 'reported',
  report_date: '2026-04-14',
  time_of_day: 'bmo',
  eps_actual: 2.70,
  eps_estimate: 2.68,
  revenue_actual: 24100000000,
  revenue_estimate: 23600000000,
  eps_actual_prior_year: 2.42,
  eps_surprise_pct: 0.7,
  revenue_surprise_pct: 2.1,
  eps_growth_yoy: 11.6,
  revenue_growth_yoy: 9.9,
  guidance_direction: 'raised',
  stock_reaction_pct: 1.9,
  gross_margin: null,
  data_source: 'verified',
});

patch('BAC', {
  status: 'reported',
  report_date: '2026-04-15',
  time_of_day: 'bmo',
  eps_actual: 1.11,
  eps_estimate: 1.01,
  revenue_actual: 30430000000,
  revenue_estimate: 29930000000,
  eps_surprise_pct: 9.9,
  revenue_surprise_pct: 1.7,
  eps_growth_yoy: 17.0,
  revenue_growth_yoy: 7.2,
  guidance_direction: 'raised',
  stock_reaction_pct: 1.5,
  gross_margin: null,
  gross_margin_prior: null,
  data_source: 'verified',
});

patch('MS', {
  status: 'reported',
  report_date: '2026-04-15',
  time_of_day: 'bmo',
  eps_actual: 3.43,
  eps_estimate: 3.02,
  revenue_actual: 20580000000,
  revenue_estimate: 19700000000,
  eps_actual_prior_year: 2.60,
  revenue_actual_prior_year: 17700000000,
  eps_surprise_pct: 13.6,
  revenue_surprise_pct: 4.5,
  eps_growth_yoy: 31.9,
  revenue_growth_yoy: 16.3,
  guidance_direction: 'maintained',
  stock_reaction_pct: 4.2,
  gross_margin: null,
  gross_margin_prior: null,
  data_source: 'verified',
});

patch('PNC', {
  status: 'reported',
  report_date: '2026-04-15',
  time_of_day: 'bmo',
  eps_actual: 4.32,
  eps_estimate: 3.91,
  revenue_actual: 6165000000,
  revenue_estimate: 6240000000,
  eps_surprise_pct: 10.5,
  revenue_surprise_pct: -1.2,
  guidance_direction: 'raised',
  stock_reaction_pct: -1.5,
  gross_margin: null,
  data_source: 'verified',
});

patch('ABT', {
  status: 'reported',
  report_date: '2026-04-16',
  time_of_day: 'bmo',
  eps_actual: 1.15,
  eps_estimate: 1.15,
  revenue_actual: 11200000000,
  revenue_estimate: 11040000000,
  eps_surprise_pct: 0.0,
  revenue_surprise_pct: 1.4,
  eps_growth_yoy: null,
  revenue_growth_yoy: 8.0,
  guidance_direction: 'lowered',
  stock_reaction_pct: -1.0,
  gross_margin: null,
  data_source: 'verified',
});

patch('USB', {
  status: 'reported',
  report_date: '2026-04-16',
  time_of_day: 'bmo',
  eps_actual: 1.18,
  eps_estimate: 1.15,
  revenue_actual: 7290000000,
  revenue_estimate: 7280000000,
  eps_surprise_pct: 2.6,
  revenue_surprise_pct: 0.1,
  revenue_growth_yoy: 4.7,
  guidance_direction: 'maintained',
  stock_reaction_pct: -0.8,
  gross_margin: null,
  data_source: 'verified',
});

patch('SCHW', {
  status: 'reported',
  report_date: '2026-04-16',
  time_of_day: 'bmo',
  eps_actual: 1.43,
  eps_estimate: 1.42,
  revenue_actual: 6482000000,
  revenue_estimate: 6616000000,
  eps_surprise_pct: 0.7,
  revenue_surprise_pct: -2.0,
  revenue_growth_yoy: 16.0,
  guidance_direction: 'maintained',
  stock_reaction_pct: -2.0,
  gross_margin: null,
  data_source: 'verified',
});

// ---- STEP 4: TSM (already in seed; update to reported) ----
patch('TSM', {
  status: 'reported',
  report_date: '2026-04-16',
  time_of_day: 'bmo',
  eps_actual: 3.49,
  eps_estimate: 3.27,
  revenue_actual: 35900000000,
  revenue_estimate: 35200000000,
  eps_surprise_pct: 6.7,
  revenue_surprise_pct: 2.0,
  eps_growth_yoy: 58.3,
  revenue_growth_yoy: 40.6,
  gross_margin: 66.2,
  operating_margin: 58.1,
  guidance_direction: 'raised',
  stock_reaction_pct: -2.5,
  data_source: 'verified',
});

// ---- STEP 7: Null gross_margin / gross_margin_prior for ALL Financials ----
const FINANCIALS = new Set([
  'JPM', 'WFC', 'C', 'GS', 'BLK', 'BAC', 'MS', 'PNC', 'USB', 'SCHW',
  'COF', 'TFC', 'CB', 'MMC', 'AXP',
]);
let financialsTouched = 0;
for (const r of earnings) {
  if (FINANCIALS.has(r.ticker)) {
    if (r.gross_margin !== null || r.gross_margin_prior !== null) {
      financialsTouched++;
    }
    r.gross_margin = null;
    r.gross_margin_prior = null;
  }
}

// ---- STEP 5: remove SSNLF commentary ----
const beforeCount = commentary.length;
const filteredCommentary = commentary.filter((x) => x.ticker !== 'SSNLF');
const removed = beforeCount - filteredCommentary.length;

// ---- write back ----
fs.writeFileSync(SEED, JSON.stringify(earnings, null, 2) + '\n');
fs.writeFileSync(COMMENTARY, JSON.stringify(filteredCommentary, null, 2) + '\n');

console.log(`Earnings records: ${earnings.length}`);
console.log(`  reported: ${earnings.filter((r) => r.status === 'reported').length}`);
console.log(`  upcoming: ${earnings.filter((r) => r.status === 'upcoming').length}`);
console.log(`Financials gross_margin nulled: ${financialsTouched}`);
console.log(`Commentary records removed (SSNLF): ${removed}`);
console.log(`Commentary records remaining: ${filteredCommentary.length}`);
