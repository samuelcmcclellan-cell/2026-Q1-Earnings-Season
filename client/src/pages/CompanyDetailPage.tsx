import { useParams, Link } from 'react-router-dom';
import { useCompany } from '../hooks/use-companies';
import { useEarningsByTicker } from '../hooks/use-earnings';
import { useCommentary } from '../hooks/use-commentary';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { formatEps, formatCurrency, formatPct, formatDateFull, classifyResult } from '../lib/utils';
import { SECTOR_COLORS, THEME_LABELS } from '../lib/constants';
import { ArrowLeft } from 'lucide-react';

export function CompanyDetailPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const { data: company, isLoading: companyLoading } = useCompany(ticker || '');
  const { data: earnings, isLoading: earningsLoading } = useEarningsByTicker(ticker || '');
  const { data: commentary } = useCommentary();

  if (companyLoading || earningsLoading) return <Spinner />;
  if (!company) return <div className="text-text-muted text-center py-12">Company not found</div>;

  const latest = earnings?.[0];
  const epsResult = latest ? classifyResult(latest.eps_actual, latest.eps_estimate) : 'pending';
  const revResult = latest ? classifyResult(latest.revenue_actual, latest.revenue_estimate) : 'pending';
  const companyCommentary = (commentary || []).filter(c => c.ticker === ticker);

  return (
    <div className="max-w-4xl">
      <Link to="/earnings" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Earnings
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold font-mono text-text-primary">{company.ticker}</h1>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-semibold"
              style={{ backgroundColor: `${SECTOR_COLORS[company.sector]}25`, color: SECTOR_COLORS[company.sector] }}
            >
              {company.sector}
            </span>
            <span className="text-xs text-text-muted uppercase font-mono">{company.region}</span>
          </div>
          <p className="text-text-secondary">{company.name}</p>
          <p className="text-xs text-text-muted mt-1">
            {company.industry} &bull; {company.country} &bull; {company.market_cap_category} cap
            {company.index_membership && ` &bull; ${company.index_membership}`}
          </p>
        </div>
        {latest && <Badge variant={latest.status === 'reported' ? epsResult : 'pending'} className="text-sm px-3 py-1" />}
      </div>

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="EPS"
            value={latest.status === 'reported' ? formatEps(latest.eps_actual) : formatEps(latest.eps_estimate)}
            subtitle={latest.status === 'reported' ? `Est: ${formatEps(latest.eps_estimate)}` : 'Estimate'}
            delta={latest.eps_surprise_pct !== null ? formatPct(latest.eps_surprise_pct) : undefined}
            deltaColor={latest.eps_surprise_pct && latest.eps_surprise_pct > 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Revenue"
            value={formatCurrency(latest.status === 'reported' ? latest.revenue_actual : latest.revenue_estimate)}
            subtitle={latest.status === 'reported' ? `Est: ${formatCurrency(latest.revenue_estimate)}` : 'Estimate'}
            delta={latest.revenue_surprise_pct !== null ? formatPct(latest.revenue_surprise_pct) : undefined}
            deltaColor={latest.revenue_surprise_pct && latest.revenue_surprise_pct > 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Stock Reaction"
            value={latest.stock_reaction_pct !== null ? formatPct(latest.stock_reaction_pct) : '--'}
            deltaColor={latest.stock_reaction_pct && latest.stock_reaction_pct >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Report Date"
            value={formatDateFull(latest.report_date)}
            subtitle={latest.time_of_day?.toUpperCase() || ''}
          />
        </div>
      )}

      {latest?.guidance_direction && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Guidance</h3>
          <Badge variant={latest.guidance_direction as any} className="text-sm px-3 py-1" />
        </div>
      )}

      {companyCommentary.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Management Commentary</h3>
          <div className="space-y-3">
            {companyCommentary.map((c) => {
              let tags: string[] = [];
              try { tags = JSON.parse(c.theme_tags); } catch {}
              return (
                <div key={c.id} className="bg-bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-text-secondary italic leading-relaxed">"{c.quote_text}"</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={c.sentiment === 'positive' ? 'beat' : c.sentiment === 'negative' ? 'miss' : 'meet'} label={c.sentiment.toUpperCase()} />
                    {tags.map(t => (
                      <span key={t} className="text-[10px] font-mono text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
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
