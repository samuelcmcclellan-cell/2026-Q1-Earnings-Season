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
  'United States': 'United States',
  'Europe': 'Europe',
  'Japan': 'Japan',
  'China': 'China',
  'EM': 'Emerging Markets',
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

export const MARKET_CAP_LABELS: Record<string, string> = {
  'mega': 'Mega Cap',
  'large': 'Large Cap',
  'mid': 'Mid Cap',
  'small': 'Small Cap',
  'Mega Cap': 'Mega Cap',
  'Large Cap': 'Large Cap',
  'Mid Cap': 'Mid Cap',
  'Small Cap': 'Small Cap',
};

export const STYLE_LABELS: Record<string, string> = {
  'growth': 'Growth',
  'value': 'Value',
  'blend': 'Blend',
};

export const DATA_SOURCE_LABELS: Record<string, string> = {
  'seed': 'Estimated',
  'fmp': 'FMP',
  'finnhub': 'Finnhub',
  'csv_import': 'Import',
};

export const SECTORS = Object.keys(SECTOR_COLORS);
export const REGIONS = ['us', 'europe', 'asia'];
export const STYLES = ['growth', 'value', 'blend'];
export const MARKET_CAPS = ['mega', 'large', 'mid', 'small'];
