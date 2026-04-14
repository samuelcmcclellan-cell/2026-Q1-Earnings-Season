import { useParams, Link } from 'react-router-dom';
import { useCompany } from '../hooks/use-companies';
import { useEarningsByTicker } from '../hooks/use-earnings';
import { useCommentary } from '../hooks/use-commentary';
import { useCompanyNews } from '../hooks/use-market-data';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { DataSourceDot } from '../components/ui/DataSourceDot';
import { StatCard } from '../components/ui/StatCard';
import { LivePrice } from '../components/ui/LivePrice';
import { Sparkline } from '../components/ui/Sparkline';
import { NewsCard } from '../components/market/NewsCard';
import { AnalystBar } from '../components/market/AnalystBar';
import { formatEps, formatCurrency, formatPct, formatDateFull, classifyResult, numColor } from '../lib/utils';
import { SECTOR_COLORS, THEME_LABELS, STYLE_LABELS } from '../lib/constants';
import { ArrowLeft } from 'lucide-react';

export function CompanyDetailPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const { data: company, isLoading: companyLoading } = useCompany(ticker || '');
  const { data: earnings, isLoading: earningsLoading } = useEarningsByTicker(ticker || '');
  const { data: commentary } = useCommentary();
  const { data: news } = useCompanyNews(ticker || '');

  if (companyLoading || earningsLoading) return <Spinner />;
  if (!company) return <div className="text-text-muted text-center py-12 text-xs">Company not found</div>;

  const latest = earnings?.[0];
  const epsResult = latest ? classifyResult(latest.eps_actual, latest.eps_estimate) : 'pending';
  const companyCommentary = (commentary || []).filter(c => c.ticker === ticker);

  return (
    <div className="max-w-5xl">
      <Link to="/earnings" className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary mb-3 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-lg font-bold font-mono text-text-primary">{company.ticker}</h1>
            <LivePrice symbol={company.ticker} />
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
              style={{ backgroundColor: `${SECTOR_COLORS[company.sector]}25`, color: SECTOR_COLORS[company.sector] }}
            >
              {company.sector}
            </span>
            <span className="text-[10px] text-text-muted font-mono uppercase">{STYLE_LABELS[company.style] || company.style}</span>
            {latest && <DataSourceDot source={latest.data_source} showLabel />}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-text-secondary">{company.name}</p>
            <Sparkline symbol={company.ticker} width={200} height={40} />
          </div>
          <p className="text-[10px] text-text-muted mt-0.5">
            {company.industry} · {company.country} · {company.market_cap_category} cap
            {company.index_membership && ` · ${company.index_membership}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {latest && <Badge variant={latest.status === 'reported' ? epsResult : 'pending'} />}
          <AnalystBar symbol={company.ticker} />
        </div>
      </div>

      {latest && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
            <StatCard
              label="EPS"
              value={latest.status === 'reported' ? formatEps(latest.eps_actual) : formatEps(latest.eps_estimate)}
              subtitle={latest.status === 'reported' ? `Est ${formatEps(latest.eps_estimate)}` : 'Estimate'}
              delta={latest.eps_surprise_pct !== null ? formatPct(latest.eps_surprise_pct) : undefined}
              deltaColor={latest.eps_surprise_pct && latest.eps_surprise_pct > 0 ? 'green' : 'red'}
            />
            <StatCard
              label="Revenue"
              value={formatCurrency(latest.status === 'reported' ? latest.revenue_actual : latest.revenue_estimate)}
              delta={latest.revenue_surprise_pct !== null ? formatPct(latest.revenue_surprise_pct) : undefined}
              deltaColor={latest.revenue_surprise_pct && latest.revenue_surprise_pct > 0 ? 'green' : 'red'}
            />
            <StatCard
              label="EPS Growth YoY"
              value={latest.eps_growth_yoy !== null ? formatPct(latest.eps_growth_yoy) : '--'}
              deltaColor={latest.eps_growth_yoy && latest.eps_growth_yoy >= 0 ? 'green' : 'red'}
            />
            <StatCard
              label="Rev Growth YoY"
              value={latest.revenue_growth_yoy !== null ? formatPct(latest.revenue_growth_yoy) : '--'}
              deltaColor={latest.revenue_growth_yoy && latest.revenue_growth_yoy >= 0 ? 'green' : 'red'}
            />
            <StatCard
              label="Gross Margin"
              value={latest.gross_margin !== null ? `${latest.gross_margin.toFixed(1)}%` : '--'}
              delta={latest.gross_margin_prior !== null && latest.gross_margin !== null
                ? `${(latest.gross_margin - latest.gross_margin_prior) >= 0 ? '+' : ''}${(latest.gross_margin - latest.gross_margin_prior).toFixed(1)}pp`
                : undefined}
              deltaColor={latest.gross_margin !== null && latest.gross_margin_prior !== null && (latest.gross_margin - latest.gross_margin_prior) >= 0 ? 'green' : 'red'}
            />
            <StatCard
              label="Stock Reaction"
              value={latest.stock_reaction_pct !== null ? formatPct(latest.stock_reaction_pct) : '--'}
              deltaColor={latest.stock_reaction_pct && latest.stock_reaction_pct >= 0 ? 'green' : 'red'}
              subtitle={formatDateFull(latest.report_date)}
            />
          </div>

          {/* Operating margin + forward estimates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <StatCard
              label="Operating Margin"
              value={latest.operating_margin !== null ? `${latest.operating_margin.toFixed(1)}%` : '--'}
            />
            <StatCard
              label="Forward EPS"
              value={latest.forward_eps_current !== null ? `$${latest.forward_eps_current.toFixed(2)}` : '--'}
              delta={latest.forward_eps_30d_ago && latest.forward_eps_current
                ? `30d ago: $${latest.forward_eps_30d_ago.toFixed(2)}`
                : undefined}
              deltaColor="blue"
            />
            {latest.guidance_direction && (
              <div className="bg-bg-card border border-border rounded-lg p-3 flex items-center gap-2">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Guidance</span>
                <Badge variant={latest.guidance_direction as any} />
              </div>
            )}
          </div>
        </>
      )}

      {news && news.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Recent News</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {news.slice(0, 5).map((n, i) => (
              <NewsCard key={i} headline={n.headline} summary={n.summary} url={n.url} source={n.source} datetime={n.datetime} />
            ))}
          </div>
        </div>
      )}

      {companyCommentary.length > 0 && (
        <div>
          <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Management Commentary</h3>
          <div className="space-y-2">
            {companyCommentary.map((c) => {
              let tags: string[] = [];
              try { tags = JSON.parse(c.theme_tags); } catch {}
              return (
                <div key={c.id} className="bg-bg-card border border-border rounded-lg p-3">
                  <p className="text-[11px] text-text-secondary italic leading-relaxed">"{c.quote_text}"</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge variant={c.sentiment === 'positive' ? 'beat' : c.sentiment === 'negative' ? 'miss' : 'meet'} label={c.sentiment.toUpperCase()} />
                    {tags.map(t => (
                      <span key={t} className="text-[9px] font-mono text-text-muted bg-bg-secondary px-1 py-0.5 rounded">
                        {THEME_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
