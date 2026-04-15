// Targeted revenue-only backfill for companies that have EPS but no revenue prior-year data
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(__dirname, '../../data/seed/earnings-q1-2026.json');
const HEADERS = { 'User-Agent': 'Q1EarningsTracker research@example.com' };

async function fetchFrame(concept, unit, period) {
  try {
    const url = `https://data.sec.gov/api/xbrl/frames/us-gaap/${concept}/${unit}/${period}.json`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return new Map();
    const d = await res.json();
    return new Map((d.data || []).map(e => [e.cik, e.val]));
  } catch { return new Map(); }
}

const earnings = JSON.parse(readFileSync(SEED_FILE, 'utf8'));
const needRev = earnings.filter(e => e.eps_actual_prior_year !== null && e.revenue_actual_prior_year === null);
console.log('Companies needing revenue backfill:', needRev.length);

const tickerMap = await (await fetch('https://www.sec.gov/files/company_tickers.json', { headers: HEADERS })).json();
const toCik = new Map(Object.values(tickerMap).map(e => [e.ticker.toUpperCase(), parseInt(e.cik_str)]));

const CONCEPTS = [
  'Revenues',
  'RevenueFromContractWithCustomerExcludingAssessedTax',
  'RevenueFromContractWithCustomerIncludingAssessedTax',
  'SalesRevenueNet',
];

const mergeFrames = async (period) => {
  const combined = new Map();
  for (const c of CONCEPTS) {
    const f = await fetchFrame(c, 'USD', period);
    for (const [cik, val] of f) if (!combined.has(cik)) combined.set(cik, val);
  }
  return combined;
};

console.log('Fetching Q1 2025 revenue frames...');
const revQ1 = await mergeFrames('CY2025Q1');
console.log('  Q1 entries:', revQ1.size);

console.log('Fetching Q4 2025 revenue frames...');
const revQ4 = await mergeFrames('CY2025Q4');
console.log('  Q4 entries:', revQ4.size);

let updated = 0;
for (const e of needRev) {
  const cik = toCik.get(e.ticker.toUpperCase());
  if (!cik) continue;
  const py = revQ1.get(cik);
  const pq = revQ4.get(cik);
  if (py != null) {
    e.revenue_actual_prior_year = py;
    updated++;
    console.log(` ${e.ticker.padEnd(8)} rev_PY: ${(py/1e9).toFixed(2)}B  rev_PQ: ${pq!=null?(pq/1e9).toFixed(2)+'B':'--'}`);
  }
  if (pq != null) e.revenue_actual_prior_quarter = pq;
}

console.log(`\nUpdated revenue for ${updated} of ${needRev.length} companies`);
console.log(`Total with revenue_actual_prior_year: ${earnings.filter(e => e.revenue_actual_prior_year !== null).length}/${earnings.length}`);
writeFileSync(SEED_FILE, JSON.stringify(earnings, null, 2) + '\n');
console.log('Seed written.');
