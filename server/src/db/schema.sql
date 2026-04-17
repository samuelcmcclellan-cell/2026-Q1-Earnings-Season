CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT 'us',
  country TEXT NOT NULL DEFAULT 'US',
  market_cap_category TEXT NOT NULL DEFAULT 'large',
  style TEXT DEFAULT 'blend',
  index_membership TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS earnings_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  fiscal_quarter TEXT NOT NULL,
  report_date TEXT,
  time_of_day TEXT DEFAULT 'bmo',
  eps_estimate REAL,
  eps_actual REAL,
  revenue_estimate REAL,
  revenue_actual REAL,
  eps_surprise_pct REAL,
  revenue_surprise_pct REAL,
  guidance_direction TEXT,
  stock_reaction_pct REAL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  eps_actual_prior_year REAL,
  revenue_actual_prior_year REAL,
  eps_actual_prior_quarter REAL,
  revenue_actual_prior_quarter REAL,
  eps_growth_yoy REAL,
  revenue_growth_yoy REAL,
  eps_growth_qoq REAL,
  revenue_growth_qoq REAL,
  gross_margin REAL,
  operating_margin REAL,
  gross_margin_prior REAL,
  operating_margin_prior REAL,
  forward_eps_current REAL,
  forward_eps_30d_ago REAL,
  forward_revenue_current REAL,
  forward_revenue_30d_ago REAL,
  data_source TEXT DEFAULT 'seed',
  last_refreshed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(company_id, fiscal_quarter)
);

CREATE TABLE IF NOT EXISTS commentary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  fiscal_quarter TEXT NOT NULL,
  quote_text TEXT NOT NULL,
  theme_tags TEXT DEFAULT '[]',
  sentiment TEXT DEFAULT 'neutral',
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sector_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sector TEXT NOT NULL,
  fiscal_quarter TEXT NOT NULL,
  total_companies INTEGER NOT NULL DEFAULT 0,
  reported_companies INTEGER NOT NULL DEFAULT 0,
  pct_beating_eps REAL,
  pct_beating_revenue REAL,
  avg_eps_growth REAL,
  avg_revenue_growth REAL,
  avg_gross_margin REAL,
  avg_operating_margin REAL,
  avg_gross_margin_prior REAL,
  avg_operating_margin_prior REAL,
  pct_guidance_raised REAL,
  pct_guidance_lowered REAL,
  pct_guidance_maintained REAL,
  avg_stock_reaction REAL,
  avg_eps_growth_yoy REAL,
  avg_revenue_growth_yoy REAL,
  forward_eps_revision_pct REAL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(sector, fiscal_quarter)
);

CREATE TABLE IF NOT EXISTS thematic_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  fiscal_quarter TEXT NOT NULL,
  theme TEXT NOT NULL,
  signal_direction TEXT DEFAULT 'neutral',
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(company_id, fiscal_quarter, theme)
);

CREATE TABLE IF NOT EXISTS estimate_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  fiscal_quarter TEXT NOT NULL,
  metric TEXT NOT NULL,
  estimate_date TEXT NOT NULL,
  estimate_value REAL NOT NULL,
  prior_value REAL,
  revision_pct REAL,
  source TEXT DEFAULT 'fmp',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_earnings_report_date ON earnings_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings_reports(status);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_region ON companies(region);
CREATE INDEX IF NOT EXISTS idx_companies_style ON companies(style);
CREATE INDEX IF NOT EXISTS idx_commentary_company_quarter ON commentary(company_id, fiscal_quarter);
CREATE INDEX IF NOT EXISTS idx_thematic_theme ON thematic_signals(theme);
CREATE INDEX IF NOT EXISTS idx_estimate_revisions_company ON estimate_revisions(company_id, fiscal_quarter);
CREATE INDEX IF NOT EXISTS idx_estimate_revisions_date ON estimate_revisions(estimate_date);
