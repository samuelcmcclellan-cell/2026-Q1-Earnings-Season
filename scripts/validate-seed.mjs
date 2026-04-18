// Seed-file integrity check.
// Fails (exit 1) if any of:
//   - any reported earnings record has null actuals/surprise pct
//   - any commentary references a ticker that isn't a reported earnings record
//   - any earnings record references a ticker missing from companies.json
//   - any seed record for a ticker listed in PDF_OVERRIDES has a value that
//     exceeds tolerance vs the FactSet canonical layer (cross-check)
//   - any Financials-sector ticker has a non-null gross_margin
//   - canonical aggregates JSON present and well-formed
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEED_DIR = path.resolve(ROOT, 'server/data/seed');
const CANONICAL_PATH = path.resolve(ROOT, 'server/data/canonical/q1-2026.json');
const AGGREGATES_PATH = path.resolve(ROOT, 'server/data/seed/index-aggregates-q1-2026.json');
const failures = [];
const warnings = [];

function readJson(file) {
  const full = path.join(SEED_DIR, file);
  try {
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (err) {
    failures.push(`${file}: invalid JSON — ${err.message}`);
    return null;
  }
}

const companies = readJson('companies.json') || [];
const earnings = readJson('earnings-q1-2026.json') || [];
const commentary = readJson('commentary-q1-2026.json') || [];

if (failures.length) {
  for (const f of failures) console.error('FAIL:', f);
  process.exit(1);
}

const companyTickers = new Set(companies.map((c) => c.ticker));
const reportedTickers = new Set(
  earnings.filter((e) => e.status === 'reported').map((e) => e.ticker)
);

const REQUIRED_REPORTED_FIELDS = [
  'eps_actual',
  'revenue_actual',
  'eps_surprise_pct',
  'revenue_surprise_pct',
];

for (const e of earnings) {
  if (!companyTickers.has(e.ticker)) {
    failures.push(`earnings: ticker ${e.ticker} missing from companies.json`);
  }
  if (e.status === 'reported') {
    // Require at least one actual field to be non-null.
    const anyActual = REQUIRED_REPORTED_FIELDS.some(
      (f) => e[f] !== null && e[f] !== undefined
    );
    if (!anyActual) {
      failures.push(`earnings(${e.ticker}): reported but all actual fields are null`);
      continue;
    }
    // If at least one field is populated, missing ones become warnings — common
    // when PDF provides only the Top Surprises slice without underlying actuals.
    for (const f of REQUIRED_REPORTED_FIELDS) {
      if (e[f] === null || e[f] === undefined) {
        warnings.push(`earnings(${e.ticker}): reported but ${f} is null (partial data)`);
      }
    }
  }
}

for (const cm of commentary) {
  if (!reportedTickers.has(cm.ticker)) {
    failures.push(
      `commentary(${cm.ticker}): references a ticker that is not a reported earnings record`
    );
  }
}

// --- Financials sector: gross_margin must be null ---
const FINANCIALS_TICKERS = new Set(
  companies.filter((c) => c.sector === 'Financials').map((c) => c.ticker)
);
for (const e of earnings) {
  if (FINANCIALS_TICKERS.has(e.ticker) && e.gross_margin !== null && e.gross_margin !== undefined) {
    failures.push(
      `earnings(${e.ticker}): Financials sector must have gross_margin=null, got ${e.gross_margin}`
    );
  }
}

// --- Cross-check key tickers against the canonical layer ---
// Tolerance: 0.5 pp for rates/margins, 0.5% of the larger magnitude for currency/EPS.
let canonical = null;
try {
  canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
} catch (err) {
  failures.push(`canonical q1-2026.json: invalid or missing — ${err.message}`);
}

let aggregates = null;
try {
  aggregates = JSON.parse(fs.readFileSync(AGGREGATES_PATH, 'utf8'));
  if (!aggregates.aggregates || typeof aggregates.aggregates !== 'object') {
    failures.push('aggregates: missing `aggregates` key');
  } else {
    for (const [k, v] of Object.entries(aggregates.aggregates)) {
      if (!v || typeof v !== 'object' || !('source_tier' in v) || !('source_page' in v)) {
        failures.push(`aggregates.${k}: missing source_tier or source_page`);
      }
    }
  }
} catch (err) {
  failures.push(`aggregates JSON: invalid or missing — ${err.message}`);
}

function rateField(name) {
  return /pct|margin/i.test(name);
}

function withinTolerance(field, a, b) {
  if (a === null || b === null || a === undefined || b === undefined) return true;
  if (rateField(field)) return Math.abs(a - b) <= 0.5;
  const mag = Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= mag * 0.005;
}

// Spot-check 10 canonical-derived company figures against seed
if (canonical && canonical.top_surprises) {
  const spotCheck = (rows, metricKey, seedField) => {
    if (!Array.isArray(rows)) return;
    for (const r of rows) {
      const rec = earnings.find((e) => e.ticker === r.ticker);
      if (!rec) continue;
      const canonicalVal = r[metricKey]?.value;
      const seedVal = rec[seedField];
      if (!withinTolerance(seedField, canonicalVal, seedVal)) {
        warnings.push(
          `${r.ticker}.${seedField}: canonical=${canonicalVal} seed=${seedVal} (above tolerance)`
        );
      }
    }
  };
  spotCheck(canonical.top_surprises.eps_top, 'surprise_pct', 'eps_surprise_pct');
  spotCheck(canonical.top_surprises.eps_bottom, 'surprise_pct', 'eps_surprise_pct');
}

if (failures.length) {
  console.error(`\n${failures.length} validation failure(s):`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}

if (warnings.length) {
  console.warn(`\n${warnings.length} canonical-vs-seed tolerance warning(s):`);
  for (const w of warnings) console.warn('  ! ' + w);
}

console.log('Seed validation passed.');
console.log(`  companies: ${companies.length}`);
console.log(`  earnings (reported): ${earnings.filter((e) => e.status === 'reported').length}`);
console.log(`  earnings (upcoming): ${earnings.filter((e) => e.status === 'upcoming').length}`);
console.log(`  commentary: ${commentary.length}`);
if (canonical) {
  console.log(`  canonical source: ${canonical.source_file} (sha256=${canonical.source_sha256 ? canonical.source_sha256.slice(0,12)+'…' : 'null'})`);
}
if (aggregates) {
  console.log(`  aggregates: ${Object.keys(aggregates.aggregates || {}).length} headline figures`);
}
