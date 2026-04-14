import { Router } from 'express';
import { getAllCompanies, getCompanyByTicker } from '../models/company.model.ts';

const router = Router();

router.get('/', async (req, res) => {
  const { sector, region, style, market_cap_category } = req.query;
  const companies = await getAllCompanies({
    sector: sector as string | undefined,
    region: region as string | undefined,
    style: style as string | undefined,
    market_cap_category: market_cap_category as string | undefined,
  });
  res.json(companies);
});

router.get('/:ticker', async (req, res) => {
  const company = await getCompanyByTicker(req.params.ticker.toUpperCase());
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  res.json(company);
});

export default router;
