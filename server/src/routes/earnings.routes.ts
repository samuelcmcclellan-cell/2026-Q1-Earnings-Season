import { Router } from 'express';
import { getEarnings, getEarningsByTicker, getRecentEarnings } from '../models/earnings.model.ts';
import { getMarketDataService } from '../services/market-data.service.ts';

const router = Router();

router.get('/', async (req, res) => {
  const { status, sector, region, quarter, style, market_cap_category, limit, offset, sort, order, enrich } = req.query;
  const earnings = await getEarnings({
    status: status as string | undefined,
    sector: sector as string | undefined,
    region: region as string | undefined,
    quarter: (quarter as string) || 'Q1 2026',
    style: style as string | undefined,
    market_cap_category: market_cap_category as string | undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
    sort: sort as string | undefined,
    order: order as string | undefined,
  });

  if (enrich === 'true') {
    const svc = getMarketDataService();
    const tickers = [...new Set(earnings.map(e => e.ticker))];
    const { quotes } = await svc.getQuotes(tickers);
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));
    const enriched = earnings.map(e => {
      const q = quoteMap.get(e.ticker);
      return q ? { ...e, live_price: q.price, live_change: q.change, live_change_pct: q.changePercent } : e;
    });
    res.json(enriched);
    return;
  }

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
