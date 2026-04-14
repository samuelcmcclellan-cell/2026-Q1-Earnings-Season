import { Router } from 'express';
import { getCommentary } from '../models/commentary.model.ts';

const router = Router();

router.get('/', async (req, res) => {
  const { quarter, theme, sentiment, sector, region, limit } = req.query;
  const items = await getCommentary({
    quarter: (quarter as string) || 'Q1 2026',
    theme: theme as string | undefined,
    sentiment: sentiment as string | undefined,
    sector: sector as string | undefined,
    region: region as string | undefined,
    limit: limit ? parseInt(limit as string) : 50,
  });
  res.json(items);
});

export default router;
