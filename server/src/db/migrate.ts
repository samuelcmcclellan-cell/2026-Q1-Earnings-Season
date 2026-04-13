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
  saveDb();
  console.log('Database migrations complete.');
}

// Allow running as standalone script
const isMain = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/').includes(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  runMigrations().catch(console.error);
}
