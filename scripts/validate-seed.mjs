// Seed-file integrity check.
// Fails (exit 1) if any of:
//   - any reported earnings record has null actuals/surprise pct
//   - any commentary references a ticker that isn't a reported earnings record
//   - any earnings record references a ticker missing from companies.json
import fs from 'node:fs';
import path from 'node:path';

const SEED_DIR = path.resolve(process.cwd(), 'server/data/seed');
const failures = [];

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
    for (const f of REQUIRED_REPORTED_FIELDS) {
      if (e[f] === null || e[f] === undefined) {
        failures.push(`earnings(${e.ticker}): reported but ${f} is null/undefined`);
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

if (failures.length) {
  console.error(`\n${failures.length} validation failure(s):`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}

console.log('Seed validation passed.');
console.log(`  companies: ${companies.length}`);
console.log(`  earnings (reported): ${earnings.filter((e) => e.status === 'reported').length}`);
console.log(`  earnings (upcoming): ${earnings.filter((e) => e.status === 'upcoming').length}`);
console.log(`  commentary: ${commentary.length}`);
