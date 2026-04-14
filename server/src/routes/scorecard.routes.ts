import { Router } from 'express';
import { computeScorecard } from '../services/scorecard.service.ts';
import { getMarketDataService } from '../services/market-data.service.ts';

const router = Router();

router.get('/', async (req, res) => {
  const quarter = (req.query.quarter as string) || 'Q1 2026';
  const [scorecard, snapshot] = await Promise.all([
    computeScorecard(quarter),
    getMarketSnapshot(),
  ]);
  res.json({ ...scorecard, marketSnapshot: snapshot });
});

async function getMarketSnapshot() {
  const svc = getMarketDataService();
  const { quotes } = await svc.getQuotes(['SPY', 'QQQ']);
  if (quotes.length === 0) return null;
  const map = new Map(quotes.map(q => [q.symbol, q]));
  const spy = map.get('SPY');
  const qqq = map.get('QQQ');
  return {
    spy: spy ? { price: spy.price, change: spy.change, changePercent: spy.changePercent } : null,
    qqq: qqq ? { price: qqq.price, change: qqq.change, changePercent: qqq.changePercent } : null,
    lastUpdated: new Date().toISOString(),
  };
}

router.get('/sectors', async (req, res) => {
  const quarter = (req.query.quarter as string) || 'Q1 2026';
  const scorecard = await computeScorecard(quarter);
  res.json(scorecard.bySector);
});

export default router;
