import type { SourceTier } from '../../hooks/use-canonical';

const LABEL: Record<SourceTier, string> = {
  tier_1_factset_insight: 'T1',
  tier_2_company_filing: 'T2',
  tier_3_wire: 'T3',
  tier_4_aggregator: 'T4',
  tier_5_seed_legacy: 'T5',
};

const COLOR: Record<SourceTier, string> = {
  tier_1_factset_insight: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  tier_2_company_filing: 'bg-blue-900/40 text-blue-300 border-blue-700',
  tier_3_wire: 'bg-amber-900/40 text-amber-300 border-amber-700',
  tier_4_aggregator: 'bg-orange-900/40 text-orange-300 border-orange-700',
  tier_5_seed_legacy: 'bg-zinc-800/60 text-zinc-400 border-zinc-700',
};

const TITLE: Record<SourceTier, string> = {
  tier_1_factset_insight: 'FactSet Earnings Insight (authoritative)',
  tier_2_company_filing: 'Company SEC filing',
  tier_3_wire: 'Newswire / press release',
  tier_4_aggregator: 'Data aggregator',
  tier_5_seed_legacy: 'Legacy seed (unverified)',
};

export function TierBadge({
  tier,
  page,
  asOf,
  className = '',
}: {
  tier: SourceTier | undefined | null;
  page?: number | null;
  asOf?: string | null;
  className?: string;
}) {
  if (!tier) return null;
  const title = `${TITLE[tier]}${page ? ` · p.${page}` : ''}${asOf ? ` · ${asOf}` : ''}`;
  return (
    <span
      title={title}
      className={`inline-flex items-center px-1 py-[1px] text-[8px] font-mono font-semibold rounded border ${COLOR[tier]} ${className}`}
    >
      {LABEL[tier]}
      {page ? <span className="ml-1 opacity-70">p.{page}</span> : null}
    </span>
  );
}
