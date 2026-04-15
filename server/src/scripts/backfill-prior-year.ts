/**
 * Backfill prior-year and prior-quarter EPS/revenue data using SEC EDGAR.
 *
 * Strategy:
 * 1. Fetch the EDGAR ticker→CIK mapping (single call, free)
 * 2. Fetch EDGAR XBRL frames for Q1 2025 EPS + Q4 2025 EPS (single call each)
 * 3. Fetch EDGAR XBRL frames for Q1 2025 Revenue + Q4 2025 Revenue
 * 4. Match to our seed companies by CIK
 * 5. Write enriched data back to earnings-q1-2026.json
 *
 * SEC EDGAR is free, no API key required, 10 req/sec limit.
 * International companies (TSM, SSNLF, etc.) won't have EDGAR data — skip gracefully.
 *
 * Usage:
 *   npm run backfill
 *
 * Run from the server directory:
 *   node --experimental-transform-types src/scripts/backfill-prior-year.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(__dirname, '../../data/seed/earnings-q1-2026.json');
const EDGAR_BASE = 'https://data.sec.gov';
const HEADERS = { 'User-Agent': 'Q1EarningsTracker research@example.com', 'Accept-Encoding': 'gzip,deflate' };

async function edgarFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json() as T;
  } catch (e: any) {
    console.warn(`  ⚠ EDGAR fetch failed: ${url.replace(EDGAR_BASE, '')} — ${e.message}`);
    return null;
  }
}

function round2(n: number | null | undefined): number | null {
  return n == null || isNaN(n) ? null : +n.toFixed(2);
}

// EDGAR frames response format
interface EdgarFrameEntry {
  accn: string;
  cik: number;
  entityName: string;
  loc: string;
  end: string;
  val: number;
}
interface EdgarFrame { data: EdgarFrameEntry[] }

// EDGAR companyfacts response (for revenue concepts with multiple possible tag names)
interface EdgarFact {
  end: string;
  val: number;
  form: string;
  fp: string; // Q1, Q2, Q3, Q4, FY
  filed: string;
}
interface EdgarConcept {
  label: string;
  units: Record<string, EdgarFact[]>;
}
interface EdgarCompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    'us-gaap'?: Record<string, EdgarConcept>;
  };
}

// Revenue XBRL concept tags to try (in order of preference)
const REVENUE_FRAME_CONCEPTS = [
  'Revenues',
  'RevenueFromContractWithCustomerExcludingAssessedTax',
  'RevenueFromContractWithCustomerIncludingAssessedTax',
  'SalesRevenueNet',
  'SalesRevenueGoodsNet',
];

async function fetchEdgarFrame(concept: string, unit: string, period: string): Promise<Map<number, number>> {
  const url = `${EDGAR_BASE}/api/xbrl/frames/us-gaap/${concept}/${unit}/${period}.json`;
  const data = await edgarFetch<EdgarFrame>(url);
  if (!data?.data) return new Map();
  return new Map(data.data.map(e => [e.cik, e.val]));
}

/** Find the best quarterly figure from companyfacts for a specific end-date window */
function findQuarterly(facts: EdgarFact[], fromDate: string, toDate: string): number | null {
  const candidates = facts.filter(f =>
    (f.form === '10-Q' || f.form === '10-K') &&
    f.fp !== 'FY' &&
    f.end >= fromDate && f.end <= toDate
  );
  if (!candidates.length) return null;
  // Prefer 10-Q filings, then most recent
  candidates.sort((a, b) => {
    if (a.form !== b.form) return a.form === '10-Q' ? -1 : 1;
    return b.end.localeCompare(a.end);
  });
  return candidates[0].val;
}

/** Build a CIK → revenue map from EDGAR frames for a given period */
async function fetchRevenueFrame(period: string): Promise<Map<number, number>> {
  const combined = new Map<number, number>();
  for (const concept of REVENUE_FRAME_CONCEPTS) {
    const frame = await fetchEdgarFrame(concept, 'USD', period);
    // Only add entries not already found (first-match wins)
    for (const [cik, val] of frame.entries()) {
      if (!combined.has(cik)) combined.set(cik, val);
    }
    if (combined.size > 0) break; // If first concept has many hits, use it
  }
  return combined;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('════════════════════════════════════════');
  console.log(' Q1 2026 Earnings Tracker — SEC EDGAR Prior-Year Backfill');
  console.log('════════════════════════════════════════\n');

  const earnings: any[] = JSON.parse(readFileSync(SEED_FILE, 'utf8'));
  const toBackfill = earnings.filter(e => e.eps_actual_prior_year === null && e.eps_estimate !== null);

  console.log(`Total companies: ${earnings.length}`);
  console.log(`Already have prior-year data: ${earnings.length - toBackfill.length}`);
  console.log(`Need backfill: ${toBackfill.length}\n`);

  // ── Step 1: Ticker → CIK mapping ──────────────────────────────────────
  console.log('1. Fetching EDGAR ticker→CIK mapping...');
  const tickerMap = await edgarFetch<Record<string, { cik_str: string; ticker: string; title: string }>>(
    'https://www.sec.gov/files/company_tickers.json'
  );

  if (!tickerMap) {
    console.error('Failed to fetch EDGAR ticker map. Aborting.');
    process.exit(1);
  }

  // Build ticker→CIK map (uppercase tickers)
  const tickerToCik = new Map<string, number>();
  for (const entry of Object.values(tickerMap)) {
    tickerToCik.set(entry.ticker.toUpperCase(), parseInt(entry.cik_str, 10));
  }
  console.log(`   Loaded ${tickerToCik.size} ticker→CIK mappings\n`);

  // ── Step 2: EDGAR frames — EPS ────────────────────────────────────────
  console.log('2. Fetching EDGAR frames for Q1 2025 EPS...');
  const epsQ1_2025 = await fetchEdgarFrame('EarningsPerShareDiluted', 'USD-per-shares', 'CY2025Q1');
  console.log(`   Found ${epsQ1_2025.size} companies with Q1 2025 EPS`);

  console.log('3. Fetching EDGAR frames for Q4 2025 EPS...');
  const epsQ4_2025 = await fetchEdgarFrame('EarningsPerShareDiluted', 'USD-per-shares', 'CY2025Q4');
  console.log(`   Found ${epsQ4_2025.size} companies with Q4 2025 EPS`);

  // ── Step 3: EDGAR frames — Revenue ────────────────────────────────────
  console.log('4. Fetching EDGAR frames for Q1 2025 Revenue...');
  const revQ1_2025 = await fetchRevenueFrame('CY2025Q1');
  console.log(`   Found ${revQ1_2025.size} companies with Q1 2025 Revenue`);

  console.log('5. Fetching EDGAR frames for Q4 2025 Revenue...');
  const revQ4_2025 = await fetchRevenueFrame('CY2025Q4');
  console.log(`   Found ${revQ4_2025.size} companies with Q4 2025 Revenue\n`);

  // ── Step 6: Match and enrich using frames data ────────────────────────
  console.log('6. Matching and enriching earnings entries...');
  let matched = 0, noEDGAR = 0;

  for (const entry of toBackfill) {
    const ticker = entry.ticker.toUpperCase();
    const cik = tickerToCik.get(ticker);

    if (!cik) {
      console.log(`  ${ticker.padEnd(8)} ⚠  not in EDGAR (international/OTC)`);
      noEDGAR++;
      continue;
    }

    const py_eps = epsQ1_2025.get(cik);
    const pq_eps = epsQ4_2025.get(cik);
    const py_rev = revQ1_2025.get(cik);
    const pq_rev = revQ4_2025.get(cik);

    if (py_eps === undefined && py_rev === undefined) {
      console.log(`  ${ticker.padEnd(8)} ⚠  no data in EDGAR frames`);
      noEDGAR++;
      continue;
    }

    if (py_eps !== undefined) entry.eps_actual_prior_year     = round2(py_eps);
    if (pq_eps !== undefined) entry.eps_actual_prior_quarter  = round2(pq_eps);
    if (py_rev !== undefined) entry.revenue_actual_prior_year = py_rev;
    if (pq_rev !== undefined) entry.revenue_actual_prior_quarter = pq_rev;
    entry.data_source = 'edgar';
    matched++;

    console.log(
      `  ${ticker.padEnd(8)} ✓  EPS_PY: ${py_eps?.toFixed(2) ?? '--'}`
      + ` EPS_PQ: ${pq_eps?.toFixed(2) ?? '--'}`
      + ` Rev_PY: ${py_rev != null ? (py_rev / 1e9).toFixed(1) + 'B' : '--'}`
      + ` Rev_PQ: ${pq_rev != null ? (pq_rev / 1e9).toFixed(1) + 'B' : '--'}`
    );
  }

  console.log(`\n   Matched: ${matched}, not in EDGAR: ${noEDGAR}`);

  // ── Step 5: Summary and write ──────────────────────────────────────────
  const finalWithPY = earnings.filter(e => e.eps_actual_prior_year !== null).length;
  const finalWithRev = earnings.filter(e => e.revenue_actual_prior_year !== null).length;

  console.log('\n════════════════════════════════════════');
  console.log(` Summary:`);
  console.log(`   Companies with prior-year EPS: ${finalWithPY}/${earnings.length}`);
  console.log(`   Companies with prior-year Revenue: ${finalWithRev}/${earnings.length}`);
  console.log(`   International/not-in-EDGAR: ${noEDGAR}`);
  console.log('════════════════════════════════════════');

  console.log('\nWriting enriched seed file...');
  writeFileSync(SEED_FILE, JSON.stringify(earnings, null, 2) + '\n');
  console.log('✓ Seed file written');
  console.log('\nRun "npm run seed" next to rebuild the database.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
