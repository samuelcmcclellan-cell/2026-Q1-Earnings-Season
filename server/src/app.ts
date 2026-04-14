import express from 'express';
import cors from 'cors';
import companiesRoutes from './routes/companies.routes.ts';
import calendarRoutes from './routes/calendar.routes.ts';
import earningsRoutes from './routes/earnings.routes.ts';
import scorecardRoutes from './routes/scorecard.routes.ts';
import sectorsRoutes from './routes/sectors.routes.ts';
import themesRoutes from './routes/themes.routes.ts';
import commentaryRoutes from './routes/commentary.routes.ts';
import aiRoutes from './routes/ai.routes.ts';
import regionsRoutes from './routes/regions.routes.ts';
import segmentsRoutes from './routes/segments.routes.ts';
import marketRoutes from './routes/market.routes.ts';
import { errorHandler } from './middleware/error-handler.ts';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // API routes
  app.use('/api/companies', companiesRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/earnings', earningsRoutes);
  app.use('/api/scorecard', scorecardRoutes);
  app.use('/api/sectors', sectorsRoutes);
  app.use('/api/themes', themesRoutes);
  app.use('/api/commentary', commentaryRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/regions', regionsRoutes);
  app.use('/api/segments', segmentsRoutes);
  app.use('/api/market', marketRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(errorHandler);

  return app;
}
