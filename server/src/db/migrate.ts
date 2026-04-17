import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, saveDb } from './connection.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const db = await getDb();

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  let sql: string;

  if (fs.existsSync(schemaPath)) {
    sql = fs.readFileSync(schemaPath, 'utf-8');
  } else {
    const altPath = path.resolve(__dirname, '../../src/db/schema.sql');
    sql = fs.readFileSync(altPath, 'utf-8');
  }

  db.run(sql);

  // Idempotent column additions for tables that may already exist with an older schema.
  // CREATE TABLE IF NOT EXISTS will not add new columns to an existing table.
  // SQLite forbids non-constant DEFAULTs in ALTER TABLE, so we add the column with a
  // constant default and then backfill to the current datetime.
  if (!hasColumn(db, 'earnings_reports', 'last_refreshed_at')) {
    db.run(`ALTER TABLE earnings_reports ADD COLUMN last_refreshed_at TEXT NOT NULL DEFAULT ''`);
    db.run(`UPDATE earnings_reports SET last_refreshed_at = datetime('now') WHERE last_refreshed_at = ''`);
    console.log(`  Added missing column earnings_reports.last_refreshed_at`);
  }

  saveDb();
  console.log('Database migrations complete.');
}

function hasColumn(db: any, table: string, column: string): boolean {
  const stmt = db.prepare(`PRAGMA table_info(${table})`);
  const existing = new Set<string>();
  while (stmt.step()) {
    const row = stmt.getAsObject() as { name: string };
    existing.add(row.name);
  }
  stmt.free();
  return existing.has(column);
}

// Allow running as standalone script
const isMain = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/').includes(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  runMigrations().catch(console.error);
}
