import { Router } from 'express';
import { getEarnings, getEarningsByTicker, getRecentEarnings } from '../models/earnings.model.ts';

const router = Router();

router.get('/', async (req, res) => {
  const { status, sector, region, quarter, limit, offset, sort, order } = req.query;
  const earnings = await getEarnings({
    status: status as string | undefined,
    sector: sector as string | undefined,
    region: region as string | undefined,
    quarter: (quarter as string) || 'Q1 2026',
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
    sort: sort as string | undefined,
    order: order as string | undefined,
  });
  res.json(earnings);
});

router.get('/recent', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const earnings = await getRecentEarnings(limit);
  res.json(earnings);
});

router.get('/:ticker', async (req, res) => {
  const earnings = await getEarningsByTicker(req.params.ticker.toUpperCase());
  res.json(earnings);
});

export default router;
