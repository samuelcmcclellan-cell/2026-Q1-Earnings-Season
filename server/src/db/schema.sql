CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT 'us',
  country TEXT NOT NULL DEFAULT 'US',
  market_cap_category TEXT NOT NULL DEFAULT 'large',
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

CREATE INDEX IF NOT EXISTS idx_earnings_report_date ON earnings_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings_reports(status);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_region ON companies(region);
CREATE INDEX IF NOT EXISTS idx_commentary_company_quarter ON commentary(company_id, fiscal_quarter);
CREATE INDEX IF NOT EXISTS idx_thematic_theme ON thematic_signals(theme);
