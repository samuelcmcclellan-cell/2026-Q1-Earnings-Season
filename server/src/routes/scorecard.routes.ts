import { Router } from 'express';
import { computeScorecard } from '../services/scorecard.service.ts';

const router = Router();

router.get('/', async (req, res) => {
  const quarter = (req.query.quarter as string) || 'Q1 2026';
  const scorecard = await computeScorecard(quarter);
  res.json(scorecard);
});

router.get('/sectors', async (req, res) => {
  const quarter = (req.query.quarter as string) || 'Q1 2026';
  const scorecard = await computeScorecard(quarter);
  res.json(scorecard.bySector);
});

export default router;
