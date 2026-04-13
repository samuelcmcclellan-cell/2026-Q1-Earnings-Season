import { Router } from 'express';
import { getEarnings } from '../models/earnings.model.ts';
import { getSectorScores } from '../models/sector-score.model.ts';
import { getThematicSignals } from '../models/thematic-signal.model.ts';

const router = Router();

router.get('/', async (req, res) => {
  const quarter = (req.query.quarter as string) || 'Q1 2026';
  const scores = await getSectorScores(quarter);
  res.json(scores);
});

router.get('/:sector', async (req, res) => {
  const sector = req.params.sector;
  const quarter = (req.query.quarter as string) || 'Q1 2026';
  const earnings = await getEarnings({ sector, quarter });
  res.json(earnings);
});

export default router;
