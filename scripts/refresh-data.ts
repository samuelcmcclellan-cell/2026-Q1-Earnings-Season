#!/usr/bin/env node
/**
 * refresh-data.ts — Build-time pipeline to fetch real earnings data from FMP or Finnhub.
 * Run via: npm run refresh (or: node --experimental-transform-types scripts/refresh-data.ts)
 *
 * Reads FMP_API_KEY or FINNHUB_API_KEY from .env.
 * Falls back to existing seed JSON if neither key is set.
 * Supports --dry-run flag.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SEED_DIR = path.join(ROOT, 'server/data/seed');
const CACHE_DIR = path.join(ROOT, 'server/data/cache');
const ENV_PATH = path.join(ROOT, '.env');

// ── helpers ──────────────────────────────────────────────────────────────────

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(ENV_PATH)) return env;
  for (const line of fs.readFileSync(ENV_PATH, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

interface CacheEntry { data: any; timestamp: number }

const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

function readCache(key: string): any | null {
  const fp = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(fp)) return null;
  try {
    const entry: CacheEntry = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const age = Date.now() - entry.timestamp;
    if (age < CACHE_MAX_AGE_MS) return entry.data;
    return null; // stale
  } catch {
    return null;
  }
}

function writeCache(key: string, data: any) {
  ensureDir(CACHE_DIR);
  const entry: CacheEntry = { data, timestamp: Date.now() };
  fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(entry));
}

function cacheAge(key: string): string {
  const fp = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(fp)) return 'no cache';
  try {
    const entry: CacheEntry = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const mins = Math.round((Date.now() - entry.timestamp) / 60000);
    if (mins < 60) return `${mins}m old`;
    return `${Math.round(mins / 60)}h old`;
  } catch {
    return 'corrupt';
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ── FMP fetcher ──────────────────────────────────────────────────────────────

const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

async function fmpFetch(endpoint: string, apiKey: string): Promise<any> {
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${FMP_BASE}${endpoint}${sep}apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP ${res.status}: ${endpoint}`);
  return res.json();
}

async function fetchWithCache(cacheKey: string, fetcher: () => Promise<any>, label: string): Promise<{ data: any; fromCache: boolean }> {
  const cached = readCache(cacheKey);
  if (cached !== null) {
    console.log(`  ${label}... cached (${cacheAge(cacheKey)})`);
    return { data: cached, fromCache: true };
  }
  console.log(`  ${label}... API call`);
  const data = await fetcher();
  writeCache(cacheKey, data);
  return { data, fromCache: false };
}

// ── main pipeline ────────────────────────────────────────────────────────────

interface SeedCompany {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  region: string;
  country: string;
  market_cap_category: string;
  style: string;
  index_membership: string | null;
}

interface SeedEarnings {
  ticker: string;
  report_date: string;
  time_of_day: string;
  eps_estimate: number | null;
  eps_actual: number | null;
  revenue_estimate: number | null;
  revenue_actual: number | null;
  eps_surprise_pct: number | null;
  revenue_surprise_pct: number | null;
  guidance_direction: string | null;
  stock_reaction_pct: number | null;
  status: string;
  eps_actual_prior_year: number | null;
  revenue_actual_prior_year: number | null;
  eps_actual_prior_quarter: number | null;
  revenue_actual_prior_quarter: number | null;
  eps_growth_yoy: number | null;
  revenue_growth_yoy: number | null;
  eps_growth_qoq: number | null;
  revenue_growth_qoq: number | null;
  gross_margin: number | null;
  operating_margin: number | null;
  gross_margin_prior: number | null;
  operating_margin_prior: number | null;
  forward_eps_current: number | null;
  forward_eps_30d_ago: number | null;
  forward_revenue_current: number | null;
  forward_revenue_30d_ago: number | null;
  data_source: string;
}

async function refreshFromFMP(apiKey: string, companies: SeedCompany[], existingEarnings: SeedEarnings[], dryRun: boolean) {
  console.log('\n=== Fetching from Financial Modeling Prep ===\n');

  // 1. Fetch earnings calendar
  const { data: calendar } = await fetchWithCache(
    'fmp_calendar_q1_2026',
    () => fmpFetch('/earning_calendar?from=2026-04-01&to=2026-06-30', apiKey),
    'Earnings calendar'
  );

  const calendarMap = new Map<string, any>();
  if (Array.isArray(calendar)) {
    for (const entry of calendar) {
      if (entry.symbol) calendarMap.set(entry.symbol, entry);
    }
  }

  // 2. Process companies in batches
  const BATCH_SIZE = 5;
  const BATCH_DELAY_MS = 1200; // stay well under rate limits
  let apiCalls = 0;

  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);

    for (const company of batch) {
      const idx = i + batch.indexOf(company) + 1;
      console.log(`\nFetching ${idx}/${companies.length}: ${company.ticker}`);

      const existing = existingEarnings.find(e => e.ticker === company.ticker);
      if (!existing) continue;

      try {
        // Income statements (for actuals + prior periods)
        const incomeResult = await fetchWithCache(
          `fmp_income_${company.ticker}`,
          () => fmpFetch(`/income-statement/${company.ticker}?period=quarter&limit=8`, apiKey),
          'Income statements'
        );
        if (!incomeResult.fromCache) apiCalls++;

        // Key metrics (for margins)
        const metricsResult = await fetchWithCache(
          `fmp_metrics_${company.ticker}`,
          () => fmpFetch(`/key-metrics/${company.ticker}?period=quarter&limit=8`, apiKey),
          'Key metrics'
        );
        if (!metricsResult.fromCache) apiCalls++;

        // Analyst estimates
        const estimatesResult = await fetchWithCache(
          `fmp_estimates_${company.ticker}`,
          () => fmpFetch(`/analyst-estimates/${company.ticker}?limit=4`, apiKey),
          'Analyst estimates'
        );
        if (!estimatesResult.fromCache) apiCalls++;

        // Process the data
        const income = Array.isArray(incomeResult.data) ? incomeResult.data : [];
        const metrics = Array.isArray(metricsResult.data) ? metricsResult.data : [];
        const estimates = Array.isArray(estimatesResult.data) ? estimatesResult.data : [];

        // Calendar entry for report date
        const calEntry = calendarMap.get(company.ticker);
        if (calEntry?.date) {
          existing.report_date = calEntry.date;
          if (calEntry.epsEstimated) existing.eps_estimate = calEntry.epsEstimated;
          if (calEntry.revenueEstimated) existing.revenue_estimate = calEntry.revenueEstimated;
          if (calEntry.eps !== null && calEntry.eps !== undefined) {
            existing.eps_actual = calEntry.eps;
            existing.status = 'reported';
          }
          if (calEntry.revenue !== null && calEntry.revenue !== undefined) {
            existing.revenue_actual = calEntry.revenue;
          }
        }

        // Prior periods from income statements
        if (income.length >= 2) {
          const q1 = income[0]; // most recent
          const priorQ = income[1]; // prior quarter
          const priorY = income.find((s: any) => {
            // Find same quarter last year
            if (!s.period || !q1.period) return false;
            return s.calendarYear === String(Number(q1.calendarYear) - 1) && s.period === q1.period;
          }) || income[4]; // fallback: 4 quarters ago

          if (priorY?.eps) existing.eps_actual_prior_year = priorY.eps;
          if (priorY?.revenue) existing.revenue_actual_prior_year = priorY.revenue;
          if (priorQ?.eps) existing.eps_actual_prior_quarter = priorQ.eps;
          if (priorQ?.revenue) existing.revenue_actual_prior_quarter = priorQ.revenue;
        }

        // Compute growth rates
        if (existing.eps_actual != null && existing.eps_actual_prior_year != null && existing.eps_actual_prior_year !== 0) {
          existing.eps_growth_yoy = round((existing.eps_actual - existing.eps_actual_prior_year) / Math.abs(existing.eps_actual_prior_year) * 100);
        }
        if (existing.revenue_actual != null && existing.revenue_actual_prior_year != null && existing.revenue_actual_prior_year !== 0) {
          existing.revenue_growth_yoy = round((existing.revenue_actual - existing.revenue_actual_prior_year) / Math.abs(existing.revenue_actual_prior_year) * 100);
        }
        if (existing.eps_actual != null && existing.eps_actual_prior_quarter != null && existing.eps_actual_prior_quarter !== 0) {
          existing.eps_growth_qoq = round((existing.eps_actual - existing.eps_actual_prior_quarter) / Math.abs(existing.eps_actual_prior_quarter) * 100);
        }
        if (existing.revenue_actual != null && existing.revenue_actual_prior_quarter != null && existing.revenue_actual_prior_quarter !== 0) {
          existing.revenue_growth_qoq = round((existing.revenue_actual - existing.revenue_actual_prior_quarter) / Math.abs(existing.revenue_actual_prior_quarter) * 100);
        }

        // Compute surprise %
        if (existing.eps_actual != null && existing.eps_estimate != null && existing.eps_estimate !== 0) {
          existing.eps_surprise_pct = round((existing.eps_actual - existing.eps_estimate) / Math.abs(existing.eps_estimate) * 100);
        }
        if (existing.revenue_actual != null && existing.revenue_estimate != null && existing.revenue_estimate !== 0) {
          existing.revenue_surprise_pct = round((existing.revenue_actual - existing.revenue_estimate) / Math.abs(existing.revenue_estimate) * 100);
        }

        // Margins from key metrics
        if (metrics.length >= 2) {
          const current = metrics[0];
          const prior = metrics[1];
          if (current.grossProfitMargin != null) existing.gross_margin = round(current.grossProfitMargin * 100);
          if (current.operatingCashFlowPerShare != null && current.revenuePerShare != null && current.revenuePerShare !== 0) {
            // Use actual operating income margin if available
          }
          if (prior.grossProfitMargin != null) existing.gross_margin_prior = round(prior.grossProfitMargin * 100);
        }

        // Forward estimates
        if (estimates.length >= 1) {
          existing.forward_eps_current = estimates[0].estimatedEpsAvg ?? null;
          existing.forward_revenue_current = estimates[0].estimatedRevenueAvg ?? null;
        }

        existing.data_source = 'fmp';

      } catch (err: any) {
        console.warn(`  Error for ${company.ticker}: ${err.message}`);
      }
    }

    // Rate limit delay between batches
    if (i + BATCH_SIZE < companies.length) {
      console.log(`\n  --- Batch delay (${BATCH_DELAY_MS}ms) ---`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(`\n=== FMP refresh complete. API calls: ${apiCalls} ===\n`);

  if (dryRun) {
    console.log('[DRY RUN] Would write updated data. Showing sample:');
    const reported = existingEarnings.filter(e => e.status === 'reported').slice(0, 3);
    for (const e of reported) {
      console.log(`  ${e.ticker}: EPS ${e.eps_actual} (YoY ${e.eps_growth_yoy}%), Rev Growth ${e.revenue_growth_yoy}%`);
    }
    return;
  }

  // Write back
  fs.writeFileSync(path.join(SEED_DIR, 'earnings-q1-2026.json'), JSON.stringify(existingEarnings, null, 2) + '\n');
  console.log('Wrote updated earnings to seed JSON');
}

function round(n: number, d = 1): number {
  return parseFloat(n.toFixed(d));
}

// ── Finnhub fetcher ──────────────────────────────────────────────────────────

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

async function refreshFromFinnhub(apiKey: string, companies: SeedCompany[], existingEarnings: SeedEarnings[], dryRun: boolean) {
  console.log('\n=== Fetching from Finnhub ===\n');

  const { data: calendar } = await fetchWithCache(
    'finnhub_calendar_q1_2026',
    async () => {
      const url = `${FINNHUB_BASE}/calendar/earnings?from=2026-04-01&to=2026-06-30&token=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Finnhub ${res.status}`);
      return res.json();
    },
    'Earnings calendar'
  );

  const calEntries = calendar?.earningsCalendar || [];
  const calMap = new Map<string, any>();
  for (const e of calEntries) {
    calMap.set(e.symbol, e);
  }

  let apiCalls = 0;
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const existing = existingEarnings.find(e => e.ticker === company.ticker);
    if (!existing) continue;

    console.log(`Fetching ${i + 1}/${companies.length}: ${company.ticker}`);

    try {
      const { data: basicFinancials, fromCache } = await fetchWithCache(
        `finnhub_metrics_${company.ticker}`,
        async () => {
          const url = `${FINNHUB_BASE}/stock/metric?symbol=${company.ticker}&metric=all&token=${apiKey}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Finnhub ${res.status}`);
          return res.json();
        },
        'Fundamentals'
      );
      if (!fromCache) apiCalls++;

      const m = basicFinancials?.metric || {};
      if (m.grossMarginTTM != null) existing.gross_margin = round(m.grossMarginTTM);
      if (m.operatingMarginTTM != null) existing.operating_margin = round(m.operatingMarginTTM);
      if (m.epsGrowthTTMYoy != null) existing.eps_growth_yoy = round(m.epsGrowthTTMYoy);
      if (m.revenueGrowthTTMYoy != null) existing.revenue_growth_yoy = round(m.revenueGrowthTTMYoy);

      const calEntry = calMap.get(company.ticker);
      if (calEntry) {
        if (calEntry.date) existing.report_date = calEntry.date;
        if (calEntry.epsEstimate) existing.eps_estimate = calEntry.epsEstimate;
        if (calEntry.epsActual != null) {
          existing.eps_actual = calEntry.epsActual;
          existing.status = 'reported';
        }
        if (calEntry.revenueEstimate) existing.revenue_estimate = calEntry.revenueEstimate;
        if (calEntry.revenueActual != null) existing.revenue_actual = calEntry.revenueActual;
      }

      existing.data_source = 'finnhub';

      // Rate limit: Finnhub free tier is 60/min
      if (!fromCache) await sleep(1100);

    } catch (err: any) {
      console.warn(`  Error for ${company.ticker}: ${err.message}`);
    }
  }

  console.log(`\n=== Finnhub refresh complete. API calls: ${apiCalls} ===\n`);

  if (dryRun) {
    console.log('[DRY RUN] Would write updated data.');
    return;
  }

  fs.writeFileSync(path.join(SEED_DIR, 'earnings-q1-2026.json'), JSON.stringify(existingEarnings, null, 2) + '\n');
  console.log('Wrote updated earnings to seed JSON');
}

// ── entry point ──────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (dryRun) console.log('🔍 DRY RUN MODE — no files will be written\n');

  const env = loadEnv();
  const fmpKey = env.FMP_API_KEY || process.env.FMP_API_KEY || '';
  const finnhubKey = env.FINNHUB_API_KEY || process.env.FINNHUB_API_KEY || '';

  const companies: SeedCompany[] = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'companies.json'), 'utf-8'));
  const earnings: SeedEarnings[] = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'earnings-q1-2026.json'), 'utf-8'));

  console.log(`Loaded ${companies.length} companies, ${earnings.length} earnings records`);

  if (fmpKey) {
    await refreshFromFMP(fmpKey, companies, earnings, dryRun);
  } else if (finnhubKey) {
    await refreshFromFinnhub(finnhubKey, companies, earnings, dryRun);
  } else {
    console.warn('\n⚠️  No FMP_API_KEY or FINNHUB_API_KEY found in .env');
    console.warn('   Falling back to existing seed JSON files (no API data fetched).');
    console.warn('   Set FMP_API_KEY=your_key in .env to enable real data.\n');
    return;
  }

  // Rebuild database
  if (!dryRun) {
    console.log('\nRebuilding database...');
    const { execSync } = await import('node:child_process');
    execSync('npm run seed', { cwd: ROOT, stdio: 'inherit' });
    console.log('\nData refresh complete!');
  }
}

main().catch(err => {
  console.error('Refresh failed:', err);
  process.exit(1);
});
