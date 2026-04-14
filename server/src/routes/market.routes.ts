import { Router } from 'express';
import { getMarketDataService } from '../services/market-data.service.ts';

const router = Router();

router.get('/status', (_req, res) => {
  const svc = getMarketDataService();
  res.json(svc.getStatus());
});

router.get('/quote/:symbol', async (req, res) => {
  const svc = getMarketDataService();
  const quote = await svc.getQuote(req.params.symbol);
  if (!quote) {
    res.status(503).json({ error: 'No market data API key configured' });
    return;
  }
  res.json(quote);
});

router.post('/quotes', async (req, res) => {
  const { symbols } = req.body;
  if (!Array.isArray(symbols) || symbols.length === 0) {
    res.status(400).json({ error: 'symbols array required' });
    return;
  }
  if (symbols.length > 20) {
    res.status(400).json({ error: 'Max 20 symbols per request' });
    return;
  }
  const svc = getMarketDataService();
  const result = await svc.getQuotes(symbols);
  res.json(result);
});

router.get('/news/:symbol', async (req, res) => {
  const svc = getMarketDataService();
  const news = await svc.getCompanyNews(req.params.symbol);
  res.json(news);
});

router.get('/price-history/:symbol', async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const svc = getMarketDataService();
  const prices = await svc.getPriceHistory(req.params.symbol, days);
  res.json({ symbol: req.params.symbol.toUpperCase(), prices });
});

router.get('/recommendations/:symbol', async (req, res) => {
  const svc = getMarketDataService();
  const rec = await svc.getRecommendations(req.params.symbol);
  if (!rec) {
    res.json(null);
    return;
  }
  res.json({ symbol: req.params.symbol.toUpperCase(), ...rec });
});

export default router;
