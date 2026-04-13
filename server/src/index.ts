import { config } from './config.ts';
import { runMigrations } from './db/migrate.ts';
import { createApp } from './app.ts';

async function start() {
  // Run migrations on startup
  await runMigrations();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Earnings Tracker API running on http://localhost:${config.port}`);
    console.log(`Data source: ${config.dataSource}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
