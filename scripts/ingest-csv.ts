#!/usr/bin/env node
/**
 * ingest-csv.ts — Import CSV files from server/data/imports/ into the earnings DB.
 * Run via: npm run ingest
 *
 * Auto-detects format by column headers:
 *   - Earnings data: Ticker, EPS Estimate, EPS Actual, Revenue Estimate, Revenue Actual, Report Date
 *   - Margin data: Ticker, Gross Margin, Operating Margin, Quarter
 *   - Estimate revisions: Ticker, Metric, Current Estimate, Prior Estimate, Change Date
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMPORTS_DIR = path.join(ROOT, 'server/data/imports');
const SEED_DIR = path.join(ROOT, 'server/data/seed');

// ── CSV parser (simple, handles quoted fields) ───────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = (values[j] || '').trim();
    }
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Format detection ─────────────────────────────────────────────────────────

type DataFormat = 'earnings' | 'margins' | 'revisions' | 'unknown';

function detectFormat(headers: string[]): DataFormat {
  const h = new Set(headers.map(s => s.toLowerCase().trim()));

  if ((h.has('ticker') || h.has('symbol')) && (h.has('eps estimate') || h.has('eps_estimate') || h.has('epsestimate'))) {
    return 'earnings';
  }
  if ((h.has('ticker') || h.has('symbol')) && (h.has('gross margin') || h.has('gross_margin') || h.has('grossmargin'))) {
    return 'margins';
  }
  if ((h.has('ticker') || h.has('symbol')) && (h.has('metric') || h.has('current estimate') || h.has('current_estimate'))) {
    return 'revisions';
  }
  return 'unknown';
}

function findCol(row: Record<string, string>, ...candidates: string[]): string | undefined {
  for (const c of candidates) {
    for (const key of Object.keys(row)) {
      if (key.toLowerCase().replace(/[_ ]/g, '') === c.toLowerCase().replace(/[_ ]/g, '')) {
        return row[key];
      }
    }
  }
  return undefined;
}

function toNum(val: string | undefined): number | null {
  if (!val || val === '' || val === '--' || val === 'N/A') return null;
  const n = parseFloat(val.replace(/[$,%]/g, '').replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

// ── Importers ────────────────────────────────────────────────────────────────

interface SeedEarnings {
  ticker: string;
  [key: string]: any;
}

function importEarnings(rows: Record<string, string>[], earnings: SeedEarnings[]): { matched: number; unmatched: string[] } {
  const tickerSet = new Set(earnings.map(e => e.ticker));
  let matched = 0;
  const unmatched: string[] = [];

  for (const row of rows) {
    const ticker = findCol(row, 'ticker', 'symbol');
    if (!ticker) continue;

    const existing = earnings.find(e => e.ticker === ticker.toUpperCase());
    if (!existing) {
      unmatched.push(ticker);
      continue;
    }

    const epsEst = toNum(findCol(row, 'epsestimate', 'eps_estimate', 'eps estimate'));
    const epsAct = toNum(findCol(row, 'epsactual', 'eps_actual', 'eps actual'));
    const revEst = toNum(findCol(row, 'revenueestimate', 'revenue_estimate', 'revenue estimate'));
    const revAct = toNum(findCol(row, 'revenueactual', 'revenue_actual', 'revenue actual'));
    const reportDate = findCol(row, 'reportdate', 'report_date', 'report date', 'date');
    const guidance = findCol(row, 'guidance', 'guidance_direction');
    const reaction = toNum(findCol(row, 'stockreaction', 'stock_reaction_pct', 'stock reaction'));

    if (epsEst !== null) existing.eps_estimate = epsEst;
    if (epsAct !== null) {
      existing.eps_actual = epsAct;
      existing.status = 'reported';
    }
    if (revEst !== null) existing.revenue_estimate = revEst;
    if (revAct !== null) existing.revenue_actual = revAct;
    if (reportDate) existing.report_date = reportDate;
    if (guidance) existing.guidance_direction = guidance;
    if (reaction !== null) existing.stock_reaction_pct = reaction;

    // Recompute surprise
    if (existing.eps_actual != null && existing.eps_estimate != null && existing.eps_estimate !== 0) {
      existing.eps_surprise_pct = parseFloat(((existing.eps_actual - existing.eps_estimate) / Math.abs(existing.eps_estimate) * 100).toFixed(1));
    }
    if (existing.revenue_actual != null && existing.revenue_estimate != null && existing.revenue_estimate !== 0) {
      existing.revenue_surprise_pct = parseFloat(((existing.revenue_actual - existing.revenue_estimate) / Math.abs(existing.revenue_estimate) * 100).toFixed(1));
    }

    existing.data_source = 'csv_import';
    matched++;
  }

  return { matched, unmatched: [...new Set(unmatched)] };
}

function importMargins(rows: Record<string, string>[], earnings: SeedEarnings[]): { matched: number; unmatched: string[] } {
  let matched = 0;
  const unmatched: string[] = [];

  for (const row of rows) {
    const ticker = findCol(row, 'ticker', 'symbol');
    if (!ticker) continue;

    const existing = earnings.find(e => e.ticker === ticker.toUpperCase());
    if (!existing) {
      unmatched.push(ticker);
      continue;
    }

    const gm = toNum(findCol(row, 'grossmargin', 'gross_margin', 'gross margin'));
    const om = toNum(findCol(row, 'operatingmargin', 'operating_margin', 'operating margin'));

    if (gm !== null) existing.gross_margin = gm;
    if (om !== null) existing.operating_margin = om;
    existing.data_source = 'csv_import';
    matched++;
  }

  return { matched, unmatched: [...new Set(unmatched)] };
}

function importRevisions(rows: Record<string, string>[], earnings: SeedEarnings[]): { matched: number; unmatched: string[] } {
  let matched = 0;
  const unmatched: string[] = [];

  for (const row of rows) {
    const ticker = findCol(row, 'ticker', 'symbol');
    if (!ticker) continue;

    const existing = earnings.find(e => e.ticker === ticker.toUpperCase());
    if (!existing) {
      unmatched.push(ticker);
      continue;
    }

    const metric = findCol(row, 'metric');
    const current = toNum(findCol(row, 'currentestimate', 'current_estimate', 'current estimate'));
    const prior = toNum(findCol(row, 'priorestimate', 'prior_estimate', 'prior estimate'));

    if (metric?.toLowerCase().includes('eps') && current !== null) {
      existing.forward_eps_current = current;
      if (prior !== null) existing.forward_eps_30d_ago = prior;
    }
    if (metric?.toLowerCase().includes('revenue') && current !== null) {
      existing.forward_revenue_current = current;
      if (prior !== null) existing.forward_revenue_30d_ago = prior;
    }

    existing.data_source = 'csv_import';
    matched++;
  }

  return { matched, unmatched: [...new Set(unmatched)] };
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(IMPORTS_DIR)) {
    fs.mkdirSync(IMPORTS_DIR, { recursive: true });
    console.log(`Created imports directory: ${IMPORTS_DIR}`);
    console.log('Drop CSV files there and run this script again.');
    return;
  }

  const files = fs.readdirSync(IMPORTS_DIR).filter(f => f.endsWith('.csv') || f.endsWith('.tsv'));

  if (files.length === 0) {
    console.log(`No CSV/TSV files found in ${IMPORTS_DIR}`);
    console.log('Drop your data files there and run again.');
    return;
  }

  const earnings: SeedEarnings[] = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'earnings-q1-2026.json'), 'utf-8'));

  for (const file of files) {
    console.log(`\nProcessing: ${file}`);
    const filepath = path.join(IMPORTS_DIR, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    const rows = parseCSV(content);

    if (rows.length === 0) {
      console.log('  Empty file, skipping.');
      continue;
    }

    const headers = Object.keys(rows[0]);
    const format = detectFormat(headers);
    console.log(`  Detected format: ${format} (${rows.length} rows)`);

    if (format === 'unknown') {
      console.log(`  Could not determine format from headers: ${headers.join(', ')}`);
      console.log('  Skipping. Expected headers like: Ticker, EPS Estimate, Revenue Actual, etc.');
      continue;
    }

    let result: { matched: number; unmatched: string[] };

    switch (format) {
      case 'earnings':
        result = importEarnings(rows, earnings);
        break;
      case 'margins':
        result = importMargins(rows, earnings);
        break;
      case 'revisions':
        result = importRevisions(rows, earnings);
        break;
      default:
        continue;
    }

    console.log(`  Imported ${rows.length} rows from ${file} — ${result.matched} companies matched, ${result.unmatched.length} unmatched tickers skipped`);
    if (result.unmatched.length > 0 && result.unmatched.length <= 20) {
      console.log(`  Unmatched: ${result.unmatched.join(', ')}`);
    }
  }

  // Write back
  fs.writeFileSync(path.join(SEED_DIR, 'earnings-q1-2026.json'), JSON.stringify(earnings, null, 2) + '\n');
  console.log('\nUpdated seed JSON. Rebuilding database...');

  const { execSync } = await import('node:child_process');
  execSync('npm run seed', { cwd: ROOT, stdio: 'inherit' });
  console.log('\nImport complete!');
}

main().catch(err => {
  console.error('Ingest failed:', err);
  process.exit(1);
});
