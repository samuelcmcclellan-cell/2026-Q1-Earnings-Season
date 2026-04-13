import { Router } from 'express';
import { getThematicSignals } from '../models/thematic-signal.model.ts';
import { getCommentary } from '../models/commentary.model.ts';

const router = Router();

router.get('/', async (req, res) => {
  const quarter = (req.query.quarter as string) || 'Q1 2026';
  const signals = await getThematicSignals({ quarter });

  // Group by theme
  const grouped: Record<string, any[]> = {};
  for (const s of signals) {
    if (!grouped[s.theme]) grouped[s.theme] = [];
    grouped[s.theme].push(s);
  }
  res.json(grouped);
});

router.get('/:theme', async (req, res) => {
  const theme = req.params.theme;
  const quarter = (req.query.quarter as string) || 'Q1 2026';
  const signals = await getThematicSignals({ quarter, theme });
  const commentary = await getCommentary({ quarter, theme });
  res.json({ signals, commentary });
});

export default router;
