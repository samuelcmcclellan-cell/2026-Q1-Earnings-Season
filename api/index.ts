import type { IncomingMessage, ServerResponse } from 'node:http';
import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { setDb } from '../server/src/db/connection.ts';
import companiesRoutes from '../server/src/routes/companies.routes.ts';
import calendarRoutes from '../server/src/routes/calendar.routes.ts';
import earningsRoutes from '../server/src/routes/earnings.routes.ts';
import scorecardRoutes from '../server/src/routes/scorecard.routes.ts';
import sectorsRoutes from '../server/src/routes/sectors.routes.ts';
import themesRoutes from '../server/src/routes/themes.routes.ts';
import commentaryRoutes from '../server/src/routes/commentary.routes.ts';
import aiRoutes from '../server/src/routes/ai.routes.ts';

let app: express.Express | null = null;

async function getApp() {
  if (app) return app;

  // Initialize sql.js and load the pre-built database
  const SQL = await initSqlJs();

  const dbPath = path.join(process.cwd(), 'server/data/earnings.db');
  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    // Fallback: create empty DB and run schema
    db = new SQL.Database();
    const schemaPath = path.join(process.cwd(), 'server/src/db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      db.run(schema);
    }
  }
  db.run('PRAGMA foreign_keys = ON');

  // Inject the DB into the shared connection module
  setDb(db);

  // Create Express app
  app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/companies', companiesRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/earnings', earningsRoutes);
  app.use('/api/scorecard', scorecardRoutes);
  app.use('/api/sectors', sectorsRoutes);
  app.use('/api/themes', themesRoutes);
  app.use('/api/commentary', commentaryRoutes);
  app.use('/api/ai', aiRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: 'vercel' });
  });

  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const expressApp = await getApp();
  expressApp(req as any, res as any);
}
