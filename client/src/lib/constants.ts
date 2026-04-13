export const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#3b82f6',
  'Financials': '#22c55e',
  'Healthcare': '#ef4444',
  'Energy': '#f97316',
  'Industrials': '#eab308',
  'Consumer Discretionary': '#a855f7',
  'Consumer Staples': '#06b6d4',
  'Communication Services': '#ec4899',
  'Materials': '#84cc16',
  'Utilities': '#6366f1',
  'Real Estate': '#14b8a6',
};

export const REGION_LABELS: Record<string, string> = {
  'us': 'United States',
  'europe': 'Europe',
  'asia': 'Asia',
};

export const THEME_LABELS: Record<string, string> = {
  'ai_capex': 'AI & Cloud Capex',
  'tariff_impact': 'Tariff Impact',
  'china_exposure': 'China Exposure',
  'consumer_health': 'Consumer Health',
  'margin_trend': 'Margin Trends',
  'capital_allocation': 'Capital Allocation',
  'guidance': 'Guidance',
  'competitive_dynamics': 'Competitive Dynamics',
  'regulatory': 'Regulatory',
  'supply_chain': 'Supply Chain',
  'pricing_power': 'Pricing Power',
  'workforce': 'Workforce',
  'capital_markets': 'Capital Markets',
  'credit': 'Credit',
};

export const SECTORS = Object.keys(SECTOR_COLORS);
export const REGIONS = ['us', 'europe', 'asia'];
