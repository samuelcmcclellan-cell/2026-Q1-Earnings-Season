#!/usr/bin/env node
// Ingest a FactSet Earnings Insight PDF into the canonical data layer.
//
// 1. Hashes the PDF (sha256) so refreshes are content-addressed.
// 2. Writes (or refreshes) the canonical JSON file at
//    server/data/canonical/q1-<quarter>.json with the new sha256 and report_date.
// 3. Writes a small hash manifest at server/data/sources/.hash.json so a
//    subsequent run can detect whether the PDF has changed.
//
// The script is *idempotent*: if the sha256 matches the existing manifest, it
// exits with a friendly message and touches nothing. If the PDF has been
// swapped, it updates the manifest, refreshes `source_sha256` in the canonical
// file, and leaves downstream reconciliation to `reconcile-seed.mjs`.
//
// NOTE: PDF text-layer parsing is performed by `pdftotext -layout` in the
// local environment. If the binary is unavailable the script falls through
// and only updates the hash manifest, logging a warning so reconciliation can
// still proceed against the manually-transcribed canonical figures.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PDF_DIR = path.join(ROOT, 'server', 'data', 'sources');
const CANONICAL_PATH = path.join(ROOT, 'server', 'data', 'canonical', 'q1-2026.json');
const HASH_MANIFEST = path.join(PDF_DIR, '.hash.json');
const EXTRACT_DIR = path.join(PDF_DIR, 'extracted');

function sha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function findLatestPdf() {
  const files = fs.readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (files.length === 0) {
    console.error(`No PDF found in ${PDF_DIR}`);
    process.exit(1);
  }
  // Sort by mtime descending
  return files
    .map((f) => ({ f, mtime: fs.statSync(path.join(PDF_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0].f;
}

function readManifest() {
  if (!fs.existsSync(HASH_MANIFEST)) return {};
  try {
    return JSON.parse(fs.readFileSync(HASH_MANIFEST, 'utf8'));
  } catch {
    return {};
  }
}

function writeManifest(obj) {
  fs.writeFileSync(HASH_MANIFEST, JSON.stringify(obj, null, 2) + '\n');
}

function tryExtractText(pdfPath) {
  if (!fs.existsSync(EXTRACT_DIR)) fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  const out = path.join(EXTRACT_DIR, path.basename(pdfPath).replace(/\.pdf$/i, '.txt'));
  try {
    execFileSync('pdftotext', ['-layout', pdfPath, out], { stdio: 'pipe' });
    console.log(`  extracted text → ${path.relative(ROOT, out)}`);
    return out;
  } catch (err) {
    console.warn('  pdftotext not available or failed; skipping text extraction.');
    console.warn(`  (${err.message.split('\n')[0]})`);
    return null;
  }
}

function main() {
  const pdfName = findLatestPdf();
  const pdfPath = path.join(PDF_DIR, pdfName);
  const hash = sha256(pdfPath);
  const manifest = readManifest();

  console.log(`source PDF: ${pdfName}`);
  console.log(`sha256:     ${hash}`);

  if (manifest.source_sha256 === hash) {
    console.log('hash unchanged — canonical file already reflects this PDF. Done.');
    return;
  }

  console.log('hash changed (or manifest missing) — refreshing canonical metadata.');

  tryExtractText(pdfPath);

  // Update canonical file headers (we do NOT auto-rewrite the body; that is
  // the reconciliation script's responsibility once a reviewer has updated
  // transcribed figures).
  const canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
  canonical.source_file = pdfName;
  canonical.source_sha256 = hash;
  fs.writeFileSync(CANONICAL_PATH, JSON.stringify(canonical, null, 2) + '\n');
  console.log(`  canonical source_sha256 updated in ${path.relative(ROOT, CANONICAL_PATH)}`);

  // Update hash manifest
  writeManifest({
    source_file: pdfName,
    source_sha256: hash,
    ingested_at: new Date().toISOString(),
    prior: manifest.source_sha256 ? { source_sha256: manifest.source_sha256, source_file: manifest.source_file } : null,
  });
  console.log(`  manifest updated at ${path.relative(ROOT, HASH_MANIFEST)}`);
}

main();
