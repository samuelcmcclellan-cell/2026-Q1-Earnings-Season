#!/usr/bin/env node
// Thin wrapper that runs `migrate-seed-to-tiered.mjs` and then re-validates
// the seed. Intended to be the "apply the PDF" step of the refresh pipeline.
//
// Sequence:
//   1. scripts/ingest-factset-pdf.mjs  (hash + canonical metadata)
//   2. scripts/reconcile-seed.mjs      ← this file (migrate + validate)
//   3. scripts/validate-seed.mjs       (cross-check against canonical)

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function run(label, cmd, args) {
  console.log(`\n→ ${label}`);
  try {
    execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error(`FAIL: ${label} — ${err.message}`);
    process.exit(err.status ?? 1);
  }
}

run('migrate seed with PDF-authoritative overrides', process.execPath, ['scripts/migrate-seed-to-tiered.mjs']);
run('validate seed', process.execPath, ['scripts/validate-seed.mjs']);

console.log('\nReconciliation complete.');
